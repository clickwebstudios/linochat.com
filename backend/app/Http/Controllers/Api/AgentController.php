<?php

namespace App\Http\Controllers\Api;

use App\Events\AgentTyping;
use App\Events\ChatStatusUpdated;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Agent\InviteAgentRequest;
use App\Http\Requests\Agent\SendMessageRequest;
use App\Http\Resources\ChatResource;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use App\Services\FrubixService;
use App\Services\InvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AgentController extends Controller
{
    public function __construct(private readonly InvitationService $invitationService) {}

    /**
     * Get all active chats for agent's projects
     */
    public function chats(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->resolveProjectIds($request->input('company_id'));
        $status        = $request->input('status', 'active');

        $query = Chat::when($allProjectIds, fn ($q) => $q->whereIn('project_id', $allProjectIds))
            ->with(['project', 'agent', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_messages_count' => fn ($q) => $q->whereIn('sender_type', ['customer', 'ai'])->whereNull('read_at')]);

        if ($status === 'active') {
            $query->whereIn('status', ['active', 'waiting', 'ai_handling']);
        } elseif ($status === 'mine') {
            $query->where('agent_id', $user->id)->whereIn('status', ['active', 'waiting']);
        } elseif ($status === 'unassigned') {
            $query->whereNull('agent_id')->whereIn('status', ['waiting', 'ai_handling']);
        } elseif ($status === 'closed') {
            $query->where('status', 'closed');
        }

        $chats = $query->orderBy('last_message_at', 'desc')->paginate(20);

        return response()->json(['success' => true, 'data' => ChatResource::collection($chats)]);
    }

    /**
     * Get single chat details
     */
    public function show(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)
            ->with(['project', 'agent', 'messages' => fn ($q) => $q->orderBy('created_at', 'asc')])
            ->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('view', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json(['success' => true, 'data' => new ChatResource($chat)]);
    }

    /**
     * Get customer activity for a chat (previous chats, tickets count, session info)
     */
    public function activity(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)->with(['project', 'agent'])->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('view', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $metadata     = $chat->metadata ?? [];
        $createdAt    = $chat->created_at;
        $sessionStart = $createdAt ? $createdAt->format('M j, Y g:i A') : null;

        $previousChatsQuery = Chat::where('project_id', $chat->project_id)
            ->where('id', '!=', $chat->id)
            ->where('status', 'closed');

        if (!empty($chat->customer_email)) {
            $previousChatsQuery->where('customer_email', $chat->customer_email);
        } elseif (!empty($chat->customer_id)) {
            $previousChatsQuery->where('customer_id', $chat->customer_id);
        } else {
            $previousChatsQuery->whereRaw('1 = 0');
        }

        $previousChats = $previousChatsQuery
            ->with('agent')
            ->orderBy('last_message_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function (Chat $c) {
                $start    = $c->created_at;
                $end      = $c->last_message_at ?? $c->updated_at;
                $duration = $start && $end ? $start->diffInMinutes($end) : 0;
                return [
                    'id'       => $c->id,
                    'date'     => $c->created_at?->format('Y-m-d'),
                    'topic'    => $c->subject ?: 'Support chat',
                    'duration' => $duration . ' min',
                    'agent'    => $c->agent?->name ?? '—',
                ];
            })
            ->values()
            ->all();

        $totalTickets = 0;
        if (!empty($chat->customer_email)) {
            $totalTickets = Ticket::where('project_id', $chat->project_id)
                ->where('customer_email', $chat->customer_email)
                ->count();
        }

        $activity = [
            'customer'          => $chat->customer_name ?: $chat->customer_email ?: 'Guest',
            'customer_email'    => $chat->customer_email ?? '',
            'sessionStart'      => $sessionStart ?? '—',
            'chatInitiatedFrom' => $metadata['current_page'] ?? $metadata['referrer'] ?? '/',
            'location'          => $metadata['location'] ?? '—',
            'device'            => $metadata['device'] ?? '—',
            'browser'           => $metadata['browser'] ?? '—',
            'referralSource'    => $metadata['referral_source'] ?? $metadata['referrer'] ?? '—',
            'pagesVisited'      => $this->normalizePagesVisited(
                $metadata['pages_visited'] ?? null,
                $metadata['current_page'] ?? '/',
                $sessionStart ?? ''
            ),
            'previousChats'  => $previousChats,
            'totalTickets'   => $totalTickets,
            'customerTier'   => $metadata['customer_tier'] ?? null,
        ];

        return response()->json(['success' => true, 'data' => $activity]);
    }

    private function normalizePagesVisited($pages, string $fallbackUrl, string $fallbackTimestamp): array
    {
        if (!is_array($pages) || empty($pages)) {
            return [['page' => 'Chat', 'url' => $fallbackUrl, 'timestamp' => $fallbackTimestamp, 'duration' => 'Active']];
        }
        return array_values(array_map(function ($p) use ($fallbackTimestamp) {
            $item = is_array($p) ? $p : [];
            return [
                'page'      => $item['page'] ?? $item['name'] ?? 'Page',
                'url'       => $item['url'] ?? $item['path'] ?? '/',
                'timestamp' => $item['timestamp'] ?? $item['time'] ?? $fallbackTimestamp,
                'duration'  => $item['duration'] ?? '—',
            ];
        }, $pages));
    }

    /**
     * Take chat (assign to agent)
     */
    public function take(Request $request, string $chat_id)
    {
        $user = auth('api')->user();

        return \DB::transaction(function () use ($user, $chat_id) {
            $chat = Chat::where('id', $chat_id)
                ->whereIn('status', ['waiting', 'ai_handling'])
                ->lockForUpdate()
                ->first();

            if (!$chat) {
                return response()->json(['success' => false, 'message' => 'Chat not found or already assigned'], 404);
            }

            $project = Project::find($chat->project_id);
            if (!$project || !$user->canAccessProject($project)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $chat->update(['agent_id' => $user->id, 'status' => 'active']);

            $systemMessage = ChatMessage::create([
                'chat_id'     => $chat->id,
                'sender_type' => 'system',
                'content'     => $user->name . ' has joined the chat.',
            ]);

            broadcast(new ChatStatusUpdated($chat->id, 'active', $user->id, $user->name));
            broadcast(new MessageSent($systemMessage))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Chat assigned to you',
                'data'    => ['chat_id' => $chat->id, 'agent_id' => $user->id, 'status' => 'active'],
            ]);
        });
    }

    /**
     * Send message as agent (supports file attachments via multipart/form-data)
     */
    public function sendMessage(SendMessageRequest $request, string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('sendMessage', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if ($file->isValid() && $file->getSize() <= 10 * 1024 * 1024) {
                    $path          = $file->store('chat-attachments/' . $chat_id, 'public');
                    $attachments[] = [
                        'url'  => rtrim(config('app.url'), '/') . '/storage/' . $path,
                        'name' => $file->getClientOriginalName(),
                    ];
                }
            }
        }

        $message = ChatMessage::create([
            'chat_id'     => $chat->id,
            'sender_type' => 'agent',
            'sender_id'   => $user->id,
            'content'     => $request->input('message'),
            'is_ai'       => false,
            'metadata'    => $attachments ? ['attachments' => $attachments] : null,
        ]);

        $chat->update(['last_message_at' => now()]);
        broadcast(new MessageSent($message));
        $this->forwardToFrubix($chat, $message, $user);

        // Send via Twilio for non-web channels
        if ($chat->channel !== 'web') {
            $twilioMessageService = app(\App\Services\TwilioMessageService::class);
            $twilioMessageService->send($chat, $message->content, $request->user());
        }

        return response()->json(['success' => true, 'data' => ['message' => $message->load([])]]);
    }

    /**
     * Close chat
     */
    public function close(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('close', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        if ($chat->status === 'closed') {
            return response()->json(['success' => false, 'message' => 'Chat is already closed'], 422);
        }

        $chat->update(['status' => 'closed']);

        $systemMessage = ChatMessage::create([
            'chat_id'     => $chat->id,
            'sender_type' => 'system',
            'content'     => 'This chat has been closed.',
        ]);

        broadcast(new ChatStatusUpdated($chat->id, 'closed'));
        broadcast(new MessageSent($systemMessage))->toOthers();

        return response()->json(['success' => true, 'message' => 'Chat closed']);
    }

    /**
     * Delete chat and all its messages
     */
    public function destroy(string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('delete', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $chat->messages()->delete();
        $chat->transfers()->delete();
        $chat->delete();

        return response()->json(['success' => true, 'message' => 'Chat deleted']);
    }

    /**
     * Send typing indicator
     */
    public function typing(Request $request, string $chat_id)
    {
        $validator = Validator::make($request->all(), ['is_typing' => 'required|boolean']);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error'], 422);
        }

        $user      = auth('api')->user();
        $isOAuth   = $request->attributes->has('oauth_token');
        $chatQuery = Chat::where('id', $chat_id);

        if ($user->role !== 'superadmin' && !$isOAuth) {
            $chatQuery->where('agent_id', $user->id);
        }

        $chat = $chatQuery->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found or not assigned to you'], 404);
        }

        broadcast(new AgentTyping($chat->id, $user->id, $user->name, $request->input('is_typing')));

        return response()->json(['success' => true]);
    }

    /**
     * Mark messages in chat as read
     */
    public function markRead(Request $request, string $chat_id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $chat_id)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('view', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $updated = ChatMessage::where('chat_id', $chat_id)
            ->whereIn('sender_type', ['customer', 'ai'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'data' => ['marked_count' => $updated]]);
    }

    /**
     * Get agent statistics
     */
    public function stats(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();

        $stats = [
            'total_active_chats' => Chat::whereIn('project_id', $allProjectIds)->whereIn('status', ['active', 'waiting', 'ai_handling'])->count(),
            'my_active_chats'    => Chat::where('agent_id', $user->id)->whereIn('status', ['active', 'waiting'])->count(),
            'unassigned_chats'   => Chat::whereIn('project_id', $allProjectIds)->whereNull('agent_id')->whereIn('status', ['waiting', 'ai_handling'])->count(),
            'closed_today'       => Chat::where('agent_id', $user->id)->where('status', 'closed')->whereDate('updated_at', today())->count(),
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Get users/agents list with active chats count, projects, tickets resolved, last active
     */
    public function users(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->resolveProjectIds($request->input('company_id'));

        $agents = User::where(function ($q) use ($allProjectIds) {
            $q->whereHas('projects', fn ($q2) => $allProjectIds ? $q2->whereIn('projects.id', $allProjectIds) : $q2)
              ->orWhereHas('ownedProjects', fn ($q2) => $allProjectIds ? $q2->whereIn('projects.id', $allProjectIds) : $q2);
        })
            ->select('id', 'first_name', 'last_name', 'email', 'role', 'status', 'avatar_url', 'created_at', 'last_active_at')
            ->with(['projects:id,name', 'ownedProjects:id,name'])
            ->withCount(['chats as active_chats_count' => fn ($q) => $q->whereIn('status', ['active', 'waiting'])])
            ->withCount(['tickets as tickets_resolved' => fn ($q) => $q->whereIn('status', ['resolved', 'closed'])])
            ->get()
            ->map(function ($agent) {
                return [
                    'id'                => (string) $agent->id,
                    'invitation_id'     => null,
                    'first_name'        => $agent->first_name,
                    'last_name'         => $agent->last_name,
                    'email'             => $agent->email,
                    'role'              => $agent->role,
                    'status'            => $agent->status ?? 'Active',
                    'avatar_url'        => $agent->avatar_url,
                    'created_at'        => $agent->created_at?->toIso8601String(),
                    'last_active_at'    => $agent->last_active_at?->toIso8601String(),
                    'last_active'       => $agent->last_active_at ? $agent->last_active_at->diffForHumans() : null,
                    'active_chats_count'=> $agent->active_chats_count ?? 0,
                    'tickets_resolved'  => $agent->tickets_resolved ?? 0,
                    'projects'          => $agent->projects->pluck('name')->merge($agent->ownedProjects->pluck('name'))->unique()->values()->all(),
                ];
            });

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
                    'id'                => 'invitation-' . $inv->id,
                    'invitation_id'     => (string) $inv->id,
                    'first_name'        => $inv->first_name ?? '',
                    'last_name'         => $inv->last_name ?? '',
                    'email'             => $inv->email,
                    'role'              => $inv->role ?? 'agent',
                    'status'            => 'Invited',
                    'avatar_url'        => null,
                    'created_at'        => $inv->created_at?->toIso8601String(),
                    'last_active_at'    => null,
                    'last_active'       => null,
                    'active_chats_count'=> 0,
                    'tickets_resolved'  => 0,
                    'projects'          => $inv->project ? [$inv->project->name] : [],
                ];
            });

        $agentEmails = $agents->pluck('email')->all();
        $invitedOnly = $invitations->filter(fn ($i) => !in_array($i['email'], $agentEmails));
        $merged      = $agents->concat($invitedOnly->values())->values()->all();

        return response()->json(['success' => true, 'data' => $merged]);
    }

    /**
     * Invite a new agent (sends invitation email)
     */
    public function inviteAgent(InviteAgentRequest $request)
    {
        $user      = auth('api')->user();
        $projectId = $request->input('project_ids')[0];
        $project   = Project::where('id', $projectId)->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if ($project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You can only invite agents to projects you own'], 403);
        }

        $email        = $request->input('email');
        $existingUser = User::where('email', $email)->first();

        if ($existingUser && $existingUser->projects()->where('projects.id', $projectId)->exists()) {
            return response()->json(['success' => false, 'message' => 'This user is already an agent on this project'], 422);
        }

        $existing = Invitation::where('project_id', $projectId)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'An invitation has already been sent to this email'], 422);
        }

        $result     = $this->invitationService->create($email, $project, $request->only(['first_name', 'last_name', 'role']));
        $invitation = $result['invitation'];
        $message    = $this->invitationService->buildMessage($result['email_sent']);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'invitation_id' => $invitation->id,
                'email'         => $invitation->email,
                'status'        => $invitation->status,
                'expires_at'    => $invitation->expires_at->toIso8601String(),
                'email_sent'    => $result['email_sent'] && $result['mail_driver'] !== 'log',
            ],
        ]);
    }

    /**
     * Resend invitation email
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
            return response()->json(['success' => false, 'message' => 'Invitation not found or expired'], 404);
        }

        $project = $invitation->project;
        if (!$project || $project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You can only resend invitations for projects you own'], 403);
        }

        $sent    = $this->invitationService->resend($invitation, $project);
        $message = $this->invitationService->buildMessage($sent, 'resent');

        if (!$sent) {
            return response()->json(['success' => false, 'message' => 'Failed to send invitation email'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'invitation_id' => $invitation->id,
                'email'         => $invitation->email,
                'expires_at'    => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Toggle AI enabled status for chat
     */
    public function toggleAi(Request $request, string $id)
    {
        $user = auth('api')->user();
        $chat = Chat::where('id', $id)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }
        if (!$user->can('toggleAi', $chat)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $newAiStatus = $request->has('ai_enabled') ? (bool) $request->input('ai_enabled') : !$chat->ai_enabled;

        $chat->update([
            'ai_enabled' => $newAiStatus,
            'agent_id'   => $newAiStatus ? null : $chat->agent_id,
            'status'     => $newAiStatus ? 'ai_handling' : ($chat->agent_id ? 'active' : 'waiting'),
        ]);

        $isFrubixManaged = (bool) ($chat->project?->integrations['frubix_managed']['enabled'] ?? false);
        if (!$isFrubixManaged) {
            $systemMessage = ChatMessage::create([
                'chat_id'     => $chat->id,
                'sender_type' => 'system',
                'content'     => $newAiStatus
                    ? 'AI assistant has been enabled for this chat.'
                    : 'AI assistant has been disabled. A human agent will assist you.',
            ]);
            broadcast(new MessageSent($systemMessage))->toOthers();
        }

        broadcast(new ChatStatusUpdated($chat->id, $chat->status, $chat->agent_id, $user->name));

        return response()->json([
            'success' => true,
            'message' => 'AI status updated',
            'data'    => ['chat_id' => $chat->id, 'ai_enabled' => $chat->ai_enabled, 'status' => $chat->status],
        ]);
    }

    private function forwardToFrubix(Chat $chat, ChatMessage $message, $user): void
    {
        try {
            $project = Project::find($chat->project_id);
            if (!$project) return;

            $frubixConfig = $project->integrations['frubix'] ?? null;
            if (!$frubixConfig || empty($frubixConfig['access_token'])) return;

            FrubixService::sendMessage($frubixConfig, [
                'message'                    => $message->content,
                'sender_name'                => $user->name ?? 'Agent',
                'sender_phone'               => null,
                'sender_email'               => $user->email ?? null,
                'sender_type'                => 'agent',
                'channel'                    => 'linochat',
                'source'                     => 'linochat',
                'external_id'                => (string) $message->id,
                'external_conversation_id'   => (string) $chat->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Frubix message forward failed', ['chat_id' => $chat->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Generate AI-powered reply suggestions for an agent.
     */
    public function suggestReplies(Request $request, string $chatId)
    {
        $chat = Chat::with('project')->where('id', $chatId)->first();

        if (!$chat) {
            return response()->json(['success' => false, 'message' => 'Chat not found'], 404);
        }

        $aiService   = app(\App\Services\AiChatService::class);
        $suggestions = $aiService->suggestReplies($chat, $chat->project);

        return response()->json(['success' => true, 'data' => ['suggestions' => $suggestions]]);
    }
}
