<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Mail\TicketCreatedMail;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Mail\NewTicketMail;
use App\Models\ActivityLog;
use App\Models\NotificationLog;
use App\Models\User;
use App\Services\FrubixService;

class TicketController extends Controller
{
    /**
     * List tickets for agent's projects
     */
    public function index(Request $request)
    {
        $user = auth('api')->user();
        $allProjectIds = $user->resolveProjectIds($request->input('company_id'));

        $query = Ticket::when($allProjectIds, fn ($q) => $q->whereIn('project_id', $allProjectIds))
            ->with(['project', 'assignedAgent']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        // Filter by assigned agent
        if ($request->input('assigned_to') === 'me') {
            $query->where('assigned_to', $user->id);
        } elseif ($request->input('assigned_to') === 'unassigned') {
            $query->whereNull('assigned_to');
        }

        // Filter by customer email
        if ($request->filled('customer_email')) {
            $query->where('customer_email', $request->input('customer_email'));
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $tickets = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => TicketResource::collection($tickets),
        ]);
    }

    /**
     * Get single ticket
     */
    public function show(string $ticket_id)
    {
        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)
            ->with(['project', 'assignedAgent', 'messages' => function($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Check access (project member, owner, assigned agent, or superadmin)
        $hasAccess = $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $ticket->assigned_to === $user->id ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new TicketResource($ticket),
        ]);
    }

    /**
     * Update ticket details (subject, description, priority, category)
     */
    public function update(Request $request, string $ticket_id)
    {
        $validator = Validator::make($request->all(), [
            'subject' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'category' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        $hasAccess = $ticket->assigned_to === $user->id ||
                     $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ticket->update($request->only(['subject', 'description', 'priority', 'category']));

        return response()->json([
            'success' => true,
            'message' => 'Ticket updated',
            'data' => new TicketResource($ticket->fresh(['project', 'assignedAgent', 'messages'])),
        ]);
    }

    /**
     * Create ticket from email or API
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'customer_email' => 'required|email',
            'customer_name' => 'nullable|string',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'category' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'chat_id' => 'nullable|exists:chats,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $assignedTo = $request->input('assigned_to');
        $chatId     = $request->input('chat_id');
        $ticket = Ticket::create([
            'project_id' => $request->input('project_id'),
            'chat_id' => $chatId,
            'customer_email' => $request->input('customer_email'),
            'customer_name' => $request->input('customer_name'),
            'subject' => $request->input('subject'),
            'description' => $request->input('description'),
            'priority' => $request->input('priority', 'medium'),
            'category' => $request->input('category'),
            'status' => $assignedTo ? 'in_progress' : 'open',
            'assigned_to' => $assignedTo,
        ]);

        // Ticket number is set by model booted() hook; refresh to get it
        $ticket->refresh();

        // Post a system message to the linked chat so agents/customers see the ticket reference
        if ($chatId) {
            $chat = Chat::find($chatId);
            if ($chat) {
                $ticketNumber = $ticket->ticket_number ?? ('TKT-' . $ticket->id);
                $systemMessage = ChatMessage::create([
                    'chat_id'     => $chat->id,
                    'sender_type' => 'system',
                    'content'     => "Ticket {$ticketNumber} created: {$ticket->subject}",
                ]);
                $chat->update(['last_message_at' => now()]);
                broadcast(new MessageSent($systemMessage))->toOthers();
            }
        }

        // Create initial message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $request->input('customer_email'),
            'content' => $request->input('description'),
        ]);

        // Send confirmation email to customer
        $project = Project::find($request->input('project_id'));
        $companyId = $project->company_id ?? null;
        try {
            $ticketUrl = config('app.frontend_url', 'http://localhost:5174') . '/ticket/' . $ticket->access_token;
            Mail::to($ticket->customer_email)->send(new TicketCreatedMail($ticket, $project->name ?? 'Support', $ticketUrl));
            NotificationLog::record('email', 'Ticket Created — Customer', "Ticket #{$ticket->ticket_number} created. Subject: {$ticket->subject}\n\n{$ticket->description}", $ticket->customer_email, 'sent', $companyId);
        } catch (\Exception $e) {
            Log::error('Failed to send ticket created email', ['error' => $e->getMessage()]);
            NotificationLog::record('email', 'Ticket Created — Customer', "Ticket #{$ticket->ticket_number}: {$ticket->subject}", $ticket->customer_email, 'failed', $companyId);
        }

        // Send notification email to company admin(s)
        if ($project) {
            $adminEmails = User::where('company_id', $project->company_id)
                ->where('role', 'admin')
                ->pluck('email')
                ->filter()
                ->toArray();
            if ($project->user && $project->user->email) {
                $adminEmails[] = $project->user->email;
            }
            $adminEmails = array_unique($adminEmails);
            foreach ($adminEmails as $adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new NewTicketMail($ticket));
                    NotificationLog::record('email', 'New Ticket — Admin', "New ticket #{$ticket->ticket_number} from {$ticket->customer_name}. Subject: {$ticket->subject}\n\n{$ticket->description}", $adminEmail, 'sent', $companyId);
                } catch (\Exception $e) {
                    Log::error('Failed to send new ticket email to admin', ['email' => $adminEmail, 'error' => $e->getMessage()]);
                    NotificationLog::record('email', 'New Ticket — Admin', "Ticket #{$ticket->ticket_number}: {$ticket->subject}", $adminEmail, 'failed', $companyId);
                }
            }
        }

        // Log activity
        ActivityLog::log('ticket_created', "Ticket #{$ticket->ticket_number} created", "{$ticket->customer_name} — {$ticket->subject}", [
            'company_id' => $companyId,
            'user_id' => $request->user()?->id,
            'project_id' => $request->input('project_id'),
        ]);

        // Create lead in Frubix if integration is enabled
        if ($project) {
            $frubixConfig = $project->integrations['frubix'] ?? null;
            if ($frubixConfig && !empty($frubixConfig['enabled']) && !empty($frubixConfig['access_token'])) {
                try {
                    $lead = FrubixService::createLead($frubixConfig, [
                        'name'   => $ticket->customer_name ?: explode('@', $ticket->customer_email)[0],
                        'email'  => $ticket->customer_email,
                        'source' => 'linochat',
                        'status' => 'new',
                        'notes'  => "[LinoChat Ticket {$ticket->ticket_number}] {$ticket->subject}\n\n{$ticket->description}",
                    ]);
                    Log::info('Frubix lead created for ticket', ['ticket_id' => $ticket->id, 'lead' => $lead]);

                    // If token was refreshed, update stored tokens
                    // (handled inside FrubixService if needed)
                } catch (\Exception $e) {
                    Log::error('Failed to create Frubix lead', ['ticket_id' => $ticket->id, 'error' => $e->getMessage()]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket created',
            'data' => $ticket,
            'ticket_number' => $ticket->ticket_number,
        ], 201);
    }

    /**
     * Assign ticket to agent
     */
    public function assign(Request $request, string $ticket_id)
    {
        $validator = Validator::make($request->all(), [
            'agent_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Check access (project member, owner, or superadmin)
        $hasAccess = $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $agentId = $request->input('agent_id');
        $oldAgent = $ticket->assignedAgent;

        $ticket->update([
            'assigned_to' => $agentId,
            'status' => $agentId ? 'in_progress' : 'open',
        ]);

        // Add system message
        $messageText = $agentId 
            ? ($oldAgent 
                ? "Reassigned from {$oldAgent->name} to {$ticket->fresh()->assignedAgent->name}"
                : "Assigned to {$ticket->fresh()->assignedAgent->name}")
            : 'Unassigned';

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'agent',
            'content' => $messageText,
            'metadata' => ['system' => true],
        ]);

        return response()->json([
            'success' => true,
            'message' => $agentId ? 'Ticket assigned' : 'Ticket unassigned',
            'data' => [
                'ticket_id' => $ticket->id,
                'assigned_to' => $agentId,
                'status' => $ticket->fresh()->status,
            ],
        ]);
    }

    /**
     * Escalate ticket to another agent with optional reason
     */
    public function escalate(Request $request, string $ticket_id)
    {
        $validator = Validator::make($request->all(), [
            'escalate_to' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        $hasAccess = $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $ticket->assigned_to === $user->id ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $escalateToId = $request->input('escalate_to');
        $reason = trim($request->input('reason', ''));
        $targetAgent = \App\Models\User::find($escalateToId);
        $oldAgent = $ticket->assignedAgent;

        $ticket->update([
            'assigned_to' => $escalateToId,
            'status' => 'in_progress',
        ]);

        $messageText = "Escalated to {$targetAgent->name}";
        if ($oldAgent && (string) $oldAgent->id !== (string) $escalateToId) {
            $messageText = "Escalated from {$oldAgent->name} to {$targetAgent->name}";
        }
        if ($reason) {
            $messageText .= ". Reason: {$reason}";
        }

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'agent',
            'content' => $messageText,
            'metadata' => ['system' => true, 'escalation' => true],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket escalated',
            'data' => new TicketResource($ticket->fresh(['project', 'assignedAgent', 'messages'])),
        ]);
    }

    /**
     * Take ticket (self-assign)
     */
    public function take(string $ticket_id)
    {
        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)
            ->whereNull('assigned_to')
            ->whereIn('status', ['open', 'waiting'])
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or already assigned',
            ], 404);
        }

        // Check access (project member, owner, or superadmin)
        $hasAccess = $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $ticket->update([
            'assigned_to' => $user->id,
            'status' => 'in_progress',
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'agent',
            'content' => "Assigned to {$user->name}",
            'metadata' => ['system' => true],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket assigned to you',
            'data' => [
                'ticket_id' => $ticket->id,
                'assigned_to' => $user->id,
                'status' => 'in_progress',
            ],
        ]);
    }

    /**
     * Update ticket status
     */
    public function updateStatus(Request $request, string $ticket_id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:open,in_progress,waiting,resolved,closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Check access (assigned agent, project member, owner, or superadmin)
        $hasAccess = $ticket->assigned_to === $user->id ||
                     $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $oldStatus = $ticket->status;
        $newStatus = $request->input('status');

        $updateData = ['status' => $newStatus];
        
        if ($newStatus === 'resolved') {
            $updateData['resolved_at'] = now();
        }

        $ticket->update($updateData);

        // Add system message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'agent',
            'content' => "Status changed from {$oldStatus} to {$newStatus}",
            'metadata' => ['system' => true],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated',
            'data' => [
                'ticket_id' => $ticket->id,
                'status' => $newStatus,
            ],
        ]);
    }

    /**
     * Send reply to ticket
     */
    public function reply(Request $request, string $ticket_id)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
            'send_email' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Check access (assigned agent, project member, owner, or superadmin)
        $hasAccess = $ticket->assigned_to === $user->id ||
                     $user->projects()->where('projects.id', $ticket->project_id)->exists() ||
                     $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                     $user->role === 'superadmin';

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Create message
        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'agent',
            'sender_id' => $user->id,
            'content' => $request->input('message'),
        ]);

        // Send email to customer if requested
        if ($request->input('send_email', true)) {
            $this->sendEmailReply($ticket, $message);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'message' => $message,
            ],
        ]);
    }

    /**
     * Send email reply to customer
     */
    protected function sendEmailReply(Ticket $ticket, TicketMessage $message)
    {
        try {
            Mail::raw($message->content, function($mail) use ($ticket) {
                $mail->to($ticket->customer_email)
                    ->subject("Re: {$ticket->subject}")
                    ->from(config('mail.from.address'), config('mail.from.name'));
            });
        } catch (\Exception $e) {
            \Log::error('Failed to send ticket email reply', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete ticket
     */
    public function destroy(string $ticket_id)
    {
        $user = auth('api')->user();
        
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Only project owner or superadmin can delete
        $isOwner = $user->ownedProjects()->where('id', $ticket->project_id)->exists() ||
                   $user->role === 'superadmin';

        if (!$isOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $ticket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ticket deleted',
        ]);
    }

    /**
     * Get ticket stats
     */
    public function stats(Request $request)
    {
        $user = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();

        $stats = [
            'total' => Ticket::whereIn('project_id', $allProjectIds)->count(),
            'open' => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'open')->count(),
            'in_progress' => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'in_progress')->count(),
            'waiting' => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'waiting')->count(),
            'resolved' => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'resolved')->count(),
            'my_tickets' => Ticket::whereIn('project_id', $allProjectIds)->where('assigned_to', $user->id)->whereIn('status', ['open', 'in_progress', 'waiting'])->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get ticket volume data for chart (last 7 days)
     */
    public function volume(Request $request)
    {
        $user = auth('api')->user();
        
        $allProjectIds = $user->getCompanyProjectIds();

        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $volume = [];

        // Get last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayName = $days[$date->dayOfWeekIso - 1];
            
            $count = Ticket::whereIn('project_id', $allProjectIds)
                ->whereDate('created_at', $date->toDateString())
                ->count();
            
            $volume[] = [
                'day' => $dayName,
                'count' => $count,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $volume,
        ]);
    }

    /**
     * Manually create a Frubix lead from an existing ticket.
     */
    public function createFrubixLead(Request $request, string $ticketId)
    {
        $user = auth('api')->user();
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        $project = Project::find($ticket->project_id);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $frubixConfig = $project->integrations['frubix'] ?? null;
        if (!$frubixConfig || empty($frubixConfig['enabled']) || empty($frubixConfig['access_token'])) {
            return response()->json(['success' => false, 'message' => 'Frubix integration not connected'], 400);
        }

        try {
            $lead = FrubixService::createLead($frubixConfig, [
                'name'   => $ticket->customer_name ?: ($ticket->customer_email ? explode('@', $ticket->customer_email)[0] : 'Unknown'),
                'email'  => $ticket->customer_email,
                'source' => 'linochat',
                'status' => 'new',
                'notes'  => "[LinoChat Ticket {$ticket->ticket_number}] {$ticket->subject}\n\n{$ticket->description}",
            ], $project);

            $leadId = $lead['id'] ?? null;
            $frubixUrl = rtrim($frubixConfig['url'] ?? 'https://frubix.com', '/');
            $leadUrl = $leadId ? "{$frubixUrl}/leads/{$leadId}" : null;

            return response()->json([
                'success' => true,
                'message' => 'Lead created in Frubix',
                'data' => [
                    'frubix_lead_id'  => $leadId,
                    'frubix_lead_url' => $leadUrl,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create Frubix lead manually', ['ticket_id' => $ticketId, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to create lead: ' . $e->getMessage()], 500);
        }
    }
}
