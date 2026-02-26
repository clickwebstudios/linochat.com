<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Mail\TicketCreatedMail;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * List tickets for agent's projects
     */
    public function index(Request $request)
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

        $query = Ticket::whereIn('project_id', $allProjectIds)
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

        $tickets = $query->orderBy('created_at', 'desc')->paginate(20);

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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $ticket = Ticket::create([
            'project_id' => $request->input('project_id'),
            'customer_email' => $request->input('customer_email'),
            'customer_name' => $request->input('customer_name'),
            'subject' => $request->input('subject'),
            'description' => $request->input('description'),
            'priority' => $request->input('priority', 'medium'),
            'category' => $request->input('category'),
            'status' => 'open',
        ]);

        // Create initial message
        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_id' => $request->input('customer_email'),
            'content' => $request->input('description'),
        ]);

        // Send confirmation email to customer
        try {
            $project = Project::find($request->input('project_id'));
            $ticketUrl = env('FRONTEND_URL', 'http://localhost:5174') . '/tickets/' . $ticket->id;
            Mail::to($ticket->customer_email)->send(new TicketCreatedMail($ticket, $project->name, $ticketUrl));
        } catch (\Exception $e) {
            Log::error('Failed to send ticket created email', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket created',
            'data' => $ticket,
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
        
        $projectIds = $user->projects()->pluck('projects.id');
        $ownedProjectIds = $user->ownedProjects()->pluck('id');
        $allProjectIds = $projectIds->merge($ownedProjectIds)->unique();

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
        
        $projectIds = $user->projects()->pluck('projects.id');
        $ownedProjectIds = $user->ownedProjects()->pluck('id');
        $allProjectIds = $projectIds->merge($ownedProjectIds)->unique();

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
}
