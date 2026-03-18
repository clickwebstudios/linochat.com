<?php

namespace App\Http\Controllers\Api;

use App\Events\AgentTyping;
use App\Events\ChatStatusUpdated;
use App\Events\MessageSent;
use App\Events\NewChatForAgent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatResource;
use App\Mail\AgentInvitationMail;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\FrubixService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    /**
     * Get all active chats for agent's projects
     */
    public function chats(Request $request)
    {
        $user = auth('api')->user();
        $companyId = $request->input('company_id');
        
        // Superadmin filtering by company
        if ($companyId && $user->role === 'superadmin') {
            $allProjectIds = Project::where('user_id', $companyId)->pluck('id');
        } else {
            // Get projects where user is assigned as agent
            $projectIds = $user->projects()->pluck('projects.id');
            
            // Also include user's own projects
            $ownedProjectIds = $user->ownedProjects()->pluck('id');
            $allProjectIds = $projectIds->merge($ownedProjectIds)->unique();
        }

        $status = $request->input('status', 'active');
        
        $query = Chat::whereIn('project_id', $allProjectIds)
            ->with(['project', 'agent', 'messages' => function($q) {
                $q->latest()->limit(1);
            }]);

        if ($status === 'active') {
            $query->whereIn('status', ['active', 'waiting', 'ai_handling']);
        } elseif ($status === 'mine') {
            $query->where('agent_id', $user->id)
                  ->whereIn('status', ['active', 'waiting']);
        } elseif ($status === 'unassigned') {
            $query->whereNull('agent_id')
                  ->whereIn('status', ['waiting', 'ai_handling']);
        } elseif ($status === 'closed') {
            $query->where('status', 'closed');
        }

        $chats = $query->orderBy('last_message_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => ChatResource::collection($chats),
        ]);
    }

    /**
     * Get single chat details
     */
    public function show(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        
        $chat = Chat::where('id', $chat_id)
            ->with(['project', 'agent', 'messages' => function($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Check if user has access to this chat (superadmin has access to all)
        $hasAccess = $user->role === 'superadmin' ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists() ||
                     $chat->agent_id === $user->id;

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new ChatResource($chat),
        ]);
    }

    /**
     * Get customer activity for a chat (previous chats, tickets count, session info)
     */
    public function activity(Request $request, string $chat_id)
    {
        $user = auth('api')->user();

        $chat = Chat::where('id', $chat_id)
            ->with(['project', 'agent'])
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        $hasAccess = $user->role === 'superadmin' ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists() ||
                     $chat->agent_id === $user->id;

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $metadata = $chat->metadata ?? [];
        $createdAt = $chat->created_at;
        $sessionStart = $createdAt ? $createdAt->format('M j, Y g:i A') : null;

        // Previous chats: same customer (email or id), same project, exclude current, closed only
        $previousChatsQuery = Chat::where('project_id', $chat->project_id)
            ->where('id', '!=', $chat->id)
            ->where('status', 'closed');

        if (!empty($chat->customer_email)) {
            $previousChatsQuery->where('customer_email', $chat->customer_email);
        } elseif (!empty($chat->customer_id)) {
            $previousChatsQuery->where('customer_id', $chat->customer_id);
        } else {
            $previousChatsQuery->whereRaw('1 = 0'); // No identifier = no previous chats
        }

        $previousChats = $previousChatsQuery
            ->with('agent')
            ->orderBy('last_message_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function (Chat $c) {
                $start = $c->created_at;
                $end = $c->last_message_at ?? $c->updated_at;
                $duration = $start && $end ? $start->diffInMinutes($end) : 0;

                return [
                    'id' => $c->id,
                    'date' => $c->created_at?->format('Y-m-d'),
                    'topic' => $c->subject ?: 'Support chat',
                    'duration' => $duration . ' min',
                    'agent' => $c->agent?->name ?? '—',
                ];
            })
            ->values()
            ->all();

        // Total tickets by customer email (same project)
        $totalTickets = 0;
        if (!empty($chat->customer_email)) {
            $totalTickets = Ticket::where('project_id', $chat->project_id)
                ->where('customer_email', $chat->customer_email)
                ->count();
        }

        $activity = [
            'customer' => $chat->customer_name ?: $chat->customer_email ?: 'Guest',
            'customer_email' => $chat->customer_email ?? '',
            'sessionStart' => $sessionStart ?? '—',
            'chatInitiatedFrom' => $metadata['current_page'] ?? $metadata['referrer'] ?? '/',
            'location' => $metadata['location'] ?? '—',
            'device' => $metadata['device'] ?? '—',
            'browser' => $metadata['browser'] ?? '—',
            'referralSource' => $metadata['referral_source'] ?? $metadata['referrer'] ?? '—',
            'pagesVisited' => $this->normalizePagesVisited(
                $metadata['pages_visited'] ?? null,
                $metadata['current_page'] ?? '/',
                $sessionStart ?? ''
            ),
            'previousChats' => $previousChats,
            'totalTickets' => $totalTickets,
            'customerTier' => $metadata['customer_tier'] ?? null,
        ];

        return response()->json([
            'success' => true,
            'data' => $activity,
        ]);
    }

    /**
     * Normalize pages visited to expected format.
     *
     * @param  mixed  $pages
     * @param  string  $fallbackUrl
     * @param  string  $fallbackTimestamp
     * @return array<int, array{page: string, url: string, timestamp: string, duration: string}>
     */
    private function normalizePagesVisited($pages, string $fallbackUrl, string $fallbackTimestamp): array
    {
        if (! is_array($pages) || empty($pages)) {
            return [
                [
                    'page' => 'Chat',
                    'url' => $fallbackUrl,
                    'timestamp' => $fallbackTimestamp,
                    'duration' => 'Active',
                ],
            ];
        }

        return array_values(array_map(function ($p) use ($fallbackTimestamp) {
            $item = is_array($p) ? $p : [];
            return [
                'page' => $item['page'] ?? $item['name'] ?? 'Page',
                'url' => $item['url'] ?? $item['path'] ?? '/',
                'timestamp' => $item['timestamp'] ?? $item['time'] ?? $fallbackTimestamp,
                'duration' => $item['duration'] ?? '—',
            ];
        }, $pages));
    }

    /**
     * Take chat (assign to agent)
     */
    public function take(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        
        $chat = Chat::where('id', $chat_id)
            ->whereIn('status', ['waiting', 'ai_handling'])
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found or already assigned',
            ], 404);
        }

        // Check if user has access to this project (superadmin can take any chat)
        $hasAccess = $user->role === 'superadmin' ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Assign chat to agent (superadmin assigns to themselves)
        $chat->update([
            'agent_id' => $user->id,
            'status' => 'active',
        ]);

        // Add system message
        $systemMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'system',
            'content' => $user->name . ' has joined the chat.',
        ]);

        // Broadcast status update
        broadcast(new ChatStatusUpdated($chat->id, 'active', $user->id, $user->name));
        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Chat assigned to you',
            'data' => [
                'chat_id' => $chat->id,
                'agent_id' => $user->id,
                'status' => 'active',
            ],
        ]);
    }

    /**
     * Send message as agent (supports file attachments via multipart/form-data)
     */
    public function sendMessage(Request $request, string $chat_id)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Check if user is assigned agent or has access (superadmin can send to any chat)
        $hasAccess = $user->role === 'superadmin' ||
                     $chat->agent_id === $user->id ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if ($file->isValid() && $file->getSize() <= 10 * 1024 * 1024) { // 10MB max
                    $path = $file->store(
                        'chat-attachments/' . $chat_id,
                        'public'
                    );
                    $attachments[] = [
                        'url' => rtrim(config('app.url'), '/') . '/storage/' . $path,
                        'name' => $file->getClientOriginalName(),
                    ];
                }
            }
        }

        $metadata = $attachments ? ['attachments' => $attachments] : null;

        // Create agent message
        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'agent',
            'sender_id' => $user->id,
            'content' => $request->input('message'),
            'is_ai' => false,
            'metadata' => $metadata,
        ]);

        $chat->update(['last_message_at' => now()]);

        // Broadcast to widget and agent dashboard (immediate, no queue)
        broadcast(new MessageSent($message));

        // Forward message to Frubix if integrated
        $this->forwardToFrubix($chat, $message, $user);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => $message->load([]),
            ],
        ]);
    }

    /**
     * Close chat
     */
    public function close(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        
        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Check if user is assigned agent or has access (superadmin can close any chat)
        $hasAccess = $user->role === 'superadmin' ||
                     $chat->agent_id === $user->id ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $chat->update(['status' => 'closed']);

        // Add system message
        $systemMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'system',
            'content' => 'This chat has been closed.',
        ]);

        // Broadcast
        broadcast(new ChatStatusUpdated($chat->id, 'closed'));
        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Chat closed',
        ]);
    }

    /**
     * Send typing indicator
     */
    public function typing(Request $request, string $chat_id)
    {
        $validator = Validator::make($request->all(), [
            'is_typing' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
            ], 422);
        }

        $user = auth('api')->user();
        
        // Superadmin can type in any chat, agents only in assigned chats
        $chatQuery = Chat::where('id', $chat_id);
        
        if ($user->role !== 'superadmin') {
            $chatQuery->where('agent_id', $user->id);
        }
        
        $chat = $chatQuery->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found or not assigned to you',
            ], 404);
        }

        // Broadcast typing indicator
        broadcast(new AgentTyping(
            $chat->id,
            $user->id,
            $user->name,
            $request->input('is_typing')
        ));

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Mark messages in chat as read (when agent views the chat)
     */
    public function markRead(Request $request, string $chat_id)
    {
        $user = auth('api')->user();

        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        $hasAccess = $user->role === 'superadmin' ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists() ||
                     $chat->agent_id === $user->id;

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $updated = ChatMessage::where('chat_id', $chat_id)
            ->whereIn('sender_type', ['customer', 'ai'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => ['marked_count' => $updated],
        ]);
    }

    /**
     * Get agent statistics
     */
    public function stats(Request $request)
    {
        $user = auth('api')->user();
        
        $projectIds = $user->projects()->pluck('projects.id');
        $ownedProjectIds = $user->ownedProjects()->pluck('id');
        $allProjectIds = $projectIds->merge($ownedProjectIds)->unique();

        $stats = [
            'total_active_chats' => Chat::whereIn('project_id', $allProjectIds)
                ->whereIn('status', ['active', 'waiting', 'ai_handling'])
                ->count(),
            'my_active_chats' => Chat::where('agent_id', $user->id)
                ->whereIn('status', ['active', 'waiting'])
                ->count(),
            'unassigned_chats' => Chat::whereIn('project_id', $allProjectIds)
                ->whereNull('agent_id')
                ->whereIn('status', ['waiting', 'ai_handling'])
                ->count(),
            'closed_today' => Chat::where('agent_id', $user->id)
                ->where('status', 'closed')
                ->whereDate('updated_at', today())
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
    
    /**
     * Get users/agents list with active chats count, projects, tickets resolved, last active
     */
    public function users(Request $request)
    {
        $user = auth('api')->user();
        $companyId = $request->input('company_id');

        // Superadmin filtering by company
        if ($companyId && $user->role === 'superadmin') {
            $allProjectIds = Project::where('user_id', $companyId)->pluck('id');
        } else {
            $projectIds = $user->projects()->pluck('projects.id');
            $ownedProjectIds = $user->ownedProjects()->pluck('id');
            $allProjectIds = $projectIds->merge($ownedProjectIds)->unique();
        }

        // Get all agents from user's projects with enriched data
        $agents = User::whereHas('projects', function ($q) use ($allProjectIds) {
            $q->whereIn('projects.id', $allProjectIds);
        })
            ->orWhereHas('ownedProjects', function ($q) use ($allProjectIds) {
                $q->whereIn('projects.id', $allProjectIds);
            })
            ->select('id', 'first_name', 'last_name', 'email', 'role', 'status', 'avatar_url', 'created_at', 'last_active_at')
            ->with(['projects:id,name', 'ownedProjects:id,name'])
            ->withCount(['chats as active_chats_count' => function ($q) {
                $q->whereIn('status', ['active', 'waiting']);
            }])
            ->withCount(['tickets as tickets_resolved' => function ($q) {
                $q->whereIn('status', ['resolved', 'closed']);
            }])
            ->get()
            ->map(function ($agent) {
                return [
                    'id' => (string) $agent->id,
                    'invitation_id' => null,
                    'first_name' => $agent->first_name,
                    'last_name' => $agent->last_name,
                    'email' => $agent->email,
                    'role' => $agent->role,
                    'status' => $agent->status ?? 'Active',
                    'avatar_url' => $agent->avatar_url,
                    'created_at' => $agent->created_at?->toIso8601String(),
                    'last_active_at' => $agent->last_active_at?->toIso8601String(),
                    'last_active' => $agent->last_active_at ? $agent->last_active_at->diffForHumans() : null,
                    'active_chats_count' => $agent->active_chats_count ?? 0,
                    'tickets_resolved' => $agent->tickets_resolved ?? 0,
                    'projects' => $agent->projects->pluck('name')
                        ->merge($agent->ownedProjects->pluck('name'))
                        ->unique()
                        ->values()
                        ->all(),
                ];
            });

        // Get pending invitations for user's projects
        // For superadmin with company filter, use company's projects
        $invitations = Invitation::whereIn('project_id', $allProjectIds)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with('project:id,name')
            ->get()
            ->map(function ($inv) {
                $name = trim(($inv->first_name ?? '') . ' ' . ($inv->last_name ?? ''));
                if ($name === '') {
                    $name = explode('@', $inv->email)[0] ?? $inv->email;
                }
                return [
                    'id' => 'invitation-' . $inv->id,
                    'invitation_id' => (string) $inv->id,
                    'first_name' => $inv->first_name ?? '',
                    'last_name' => $inv->last_name ?? '',
                    'email' => $inv->email,
                    'role' => $inv->role ?? 'agent',
                    'status' => 'Invited',
                    'avatar_url' => null,
                    'created_at' => $inv->created_at?->toIso8601String(),
                    'last_active_at' => null,
                    'last_active' => null,
                    'active_chats_count' => 0,
                    'tickets_resolved' => 0,
                    'projects' => $inv->project ? [$inv->project->name] : [],
                ];
            });

        // Merge: exclude invitations for emails that are already agents
        $agentEmails = $agents->pluck('email')->all();
        $invitedOnly = $invitations->filter(fn ($i) => !in_array($i['email'], $agentEmails));
        $merged = $agents->concat($invitedOnly->values())->values()->all();

        return response()->json([
            'success' => true,
            'data' => $merged,
        ]);
    }

    /**
     * Invite a new agent (sends invitation email)
     * POST /api/agent/invitations
     */
    public function inviteAgent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:agent,admin',
            'project_ids' => 'required|array',
            'project_ids.*' => 'required|string|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        $projectIds = $request->input('project_ids');
        $projectId = $projectIds[0];

        $project = Project::where('id', $projectId)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Only project owner can invite
        if ($project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only invite agents to projects you own',
            ], 403);
        }

        $email = $request->input('email');

        // Check if user already exists and is assigned to this project
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $isAlreadyAssigned = $existingUser->projects()->where('projects.id', $projectId)->exists();
            if ($isAlreadyAssigned) {
                return response()->json([
                    'success' => false,
                    'message' => 'This user is already an agent on this project',
                ], 422);
            }
        }

        // Check for pending invitation
        $existingInvitation = Invitation::where('project_id', $projectId)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'success' => false,
                'message' => 'An invitation has already been sent to this email',
            ], 422);
        }

        // Create invitation
        $invitation = Invitation::create([
            'project_id' => $projectId,
            'email' => $email,
            'first_name' => $request->input('first_name'),
            'last_name' => $request->input('last_name'),
            'role' => $request->input('role', 'agent'),
            'token' => Str::random(32),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // Send email
        $emailSent = false;
        $mailDriver = config('mail.default');
        try {
            Mail::to($email)->send(new AgentInvitationMail($invitation, $project));
            $emailSent = true;
        } catch (\Exception $e) {
            Log::error('Failed to send invitation email', [
                'error' => $e->getMessage(),
                'invitation_id' => $invitation->id,
            ]);
        }

        $message = 'Invitation sent successfully';
        if (!$emailSent) {
            $message = 'Invitation created but email could not be sent. Check mail configuration.';
        } elseif ($mailDriver === 'log') {
            $message = 'Invitation created. Configure MAIL_MAILER=smtp in .env to send emails to recipients.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'invitation_id' => $invitation->id,
                'email' => $invitation->email,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'email_sent' => $emailSent && $mailDriver !== 'log',
            ],
        ]);
    }

    /**
     * Resend invitation email
     * POST /api/agent/invitations/{id}/resend
     */
    public function resendInvitation(Request $request, string $id)
    {
        $user = auth('api')->user();

        $invitation = Invitation::where('id', $id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with('project')
            ->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation not found or expired',
            ], 404);
        }

        $project = $invitation->project;
        if (!$project || $project->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only resend invitations for projects you own',
            ], 403);
        }

        $invitation->update([
            'token' => Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        try {
            Mail::to($invitation->email)->send(new AgentInvitationMail($invitation, $project));
        } catch (\Exception $e) {
            Log::error('Failed to resend invitation email', [
                'error' => $e->getMessage(),
                'invitation_id' => $invitation->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invitation email',
            ], 500);
        }

        $message = config('mail.default') === 'log'
            ? 'Invitation resent. Configure MAIL_MAILER=smtp in .env to send emails to recipients.'
            : 'Invitation resent successfully';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'invitation_id' => $invitation->id,
                'email' => $invitation->email,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Toggle AI enabled status for chat
     * POST /api/agent/chats/{id}/toggle-ai
     */
    public function toggleAi(Request $request, string $id)
    {
        $user = auth('api')->user();
        
        $chat = Chat::where('id', $id)->first();

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat not found',
            ], 404);
        }

        // Check if user has access to this chat (superadmin can toggle AI for any chat)
        $hasAccess = $user->role === 'superadmin' ||
                     $chat->agent_id === $user->id ||
                     $user->projects()->where('projects.id', $chat->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $chat->project_id)->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Toggle AI enabled status
        $newAiStatus = !$chat->ai_enabled;
        
        // Update chat
        $chat->update([
            'ai_enabled' => $newAiStatus,
            // If AI is being disabled and no agent assigned, set to waiting
            // If AI is being enabled, set to ai_handling if no agent
            'status' => $newAiStatus 
                ? ($chat->agent_id ? $chat->status : 'ai_handling')
                : ($chat->agent_id ? 'active' : 'waiting'),
        ]);

        // Add system message about AI status change
        $systemMessage = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => 'system',
            'content' => $newAiStatus 
                ? 'AI assistant has been enabled for this chat.'
                : 'AI assistant has been disabled. A human agent will assist you.',
        ]);

        // Broadcast status update and message
        broadcast(new ChatStatusUpdated($chat->id, $chat->status, $chat->agent_id, $user->name));
        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'AI status updated',
            'data' => [
                'chat_id' => $chat->id,
                'ai_enabled' => $chat->ai_enabled,
                'status' => $chat->status,
            ],
        ]);
    }

    private function forwardToFrubix(Chat $chat, ChatMessage $message, $user): void
    {
        try {
            $project = Project::find($chat->project_id);
            if (!$project) return;

            $frubixConfig = $project->integrations['frubix'] ?? null;
            if (!$frubixConfig || empty($frubixConfig['access_token'])) {
                return;
            }

            FrubixService::sendMessage($frubixConfig, [
                'message' => $message->content,
                'sender_name' => $user->name ?? 'Agent',
                'sender_phone' => null,
                'sender_email' => $user->email ?? null,
                'sender_type' => 'agent',
                'channel' => 'linochat',
                'source' => 'linochat',
                'external_id' => (string) $message->id,
                'external_conversation_id' => (string) $chat->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Frubix message forward failed', [
                'chat_id' => $chat->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
