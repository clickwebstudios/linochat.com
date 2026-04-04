<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\AssignTicketRequest;
use App\Http\Requests\Ticket\EscalateTicketRequest;
use App\Http\Requests\Ticket\ReplyTicketRequest;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\UpdateStatusRequest;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\FrubixService;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    public function __construct(private readonly TicketService $ticketService) {}

    /**
     * List tickets for agent's projects
     */
    public function index(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->resolveProjectIds($request->input('company_id'));

        $query = Ticket::when($allProjectIds, fn ($q) => $q->whereIn('project_id', $allProjectIds))
            ->with(['project', 'assignedAgent']);

        if ($request->has('status') && in_array($request->input('status'), ['open', 'in_progress', 'waiting', 'resolved', 'closed', 'pending'])) {
            $query->where('status', $request->input('status'));
        }
        if ($request->has('priority') && in_array($request->input('priority'), ['low', 'medium', 'high', 'urgent'])) {
            $query->where('priority', $request->input('priority'));
        }
        if ($request->input('assigned_to') === 'me') {
            $query->where('assigned_to', $user->id);
        } elseif ($request->input('assigned_to') === 'unassigned') {
            $query->whereNull('assigned_to');
        }
        if ($request->filled('customer_email')) {
            $query->where('customer_email', $request->input('customer_email'));
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $tickets = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => TicketResource::collection($tickets),
        ]);
    }

    /**
     * Get single ticket
     */
    public function show(string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)
            ->with(['project', 'assignedAgent', 'messages' => fn ($q) => $q->orderBy('created_at', 'asc')])
            ->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        if (!$user->can('view', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json(['success' => true, 'data' => new TicketResource($ticket)]);
    }

    /**
     * Create ticket from email or API
     */
    public function store(StoreTicketRequest $request)
    {
        $ticket = $this->ticketService->create($request->validated(), $request->user());

        return response()->json([
            'success'       => true,
            'message'       => 'Ticket created',
            'data'          => $ticket,
            'ticket_number' => $ticket->ticket_number,
        ], 201);
    }

    /**
     * Update ticket details (subject, description, priority, category)
     */
    public function update(UpdateTicketRequest $request, string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('update', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ticket->update($request->only(['subject', 'description', 'priority', 'category']));

        return response()->json([
            'success' => true,
            'message' => 'Ticket updated',
            'data'    => new TicketResource($ticket->fresh(['project', 'assignedAgent', 'messages'])),
        ]);
    }

    /**
     * Assign ticket to agent
     */
    public function assign(AssignTicketRequest $request, string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('assign', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $agentId = $request->input('agent_id');
        $ticket  = $this->ticketService->assign($ticket, $agentId ? (int) $agentId : null);

        return response()->json([
            'success' => true,
            'message' => $agentId ? 'Ticket assigned' : 'Ticket unassigned',
            'data'    => [
                'ticket_id'   => $ticket->id,
                'assigned_to' => $agentId,
                'status'      => $ticket->status,
            ],
        ]);
    }

    /**
     * Escalate ticket to another agent with optional reason
     */
    public function escalate(EscalateTicketRequest $request, string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('escalate', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ticket = $this->ticketService->escalate(
            $ticket,
            (int) $request->input('escalate_to'),
            $request->input('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket escalated',
            'data'    => new TicketResource($ticket),
        ]);
    }

    /**
     * Take ticket (self-assign)
     */
    public function take(string $ticket_id)
    {
        $user = auth('api')->user();

        return \DB::transaction(function () use ($user, $ticket_id) {
            $ticket = Ticket::where('id', $ticket_id)
                ->whereNull('assigned_to')
                ->whereIn('status', ['open', 'waiting'])
                ->lockForUpdate()
                ->first();

            if (!$ticket) {
                return response()->json(['success' => false, 'message' => 'Ticket not found or already assigned'], 404);
            }

            $project = Project::find($ticket->project_id);
            if (!$project || !$user->canAccessProject($project)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $ticket->update(['assigned_to' => $user->id, 'status' => 'in_progress']);

            TicketMessage::create([
                'ticket_id'   => $ticket->id,
                'sender_type' => 'agent',
                'content'     => "Assigned to {$user->name}",
                'metadata'    => ['system' => true],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket assigned to you',
                'data'    => ['ticket_id' => $ticket->id, 'assigned_to' => $user->id, 'status' => 'in_progress'],
            ]);
        });
    }

    /**
     * Update ticket status
     */
    public function updateStatus(UpdateStatusRequest $request, string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('update', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ticket = $this->ticketService->updateStatus($ticket, $request->input('status'));

        return response()->json([
            'success' => true,
            'message' => 'Status updated',
            'data'    => ['ticket_id' => $ticket->id, 'status' => $ticket->status],
        ]);
    }

    /**
     * Send reply to ticket
     */
    public function reply(ReplyTicketRequest $request, string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('reply', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $message = $this->ticketService->reply(
            $ticket,
            $request->input('message'),
            $user,
            $request->boolean('send_email', true)
        );

        return response()->json(['success' => true, 'data' => ['message' => $message]]);
    }

    /**
     * Delete ticket
     */
    public function destroy(string $ticket_id)
    {
        $user   = auth('api')->user();
        $ticket = Ticket::where('id', $ticket_id)->first();

        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }
        if (!$user->can('delete', $ticket)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ticket->delete();

        return response()->json(['success' => true, 'message' => 'Ticket deleted']);
    }

    /**
     * Get ticket stats
     */
    public function stats(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();

        $stats = [
            'total'      => Ticket::whereIn('project_id', $allProjectIds)->count(),
            'open'       => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'open')->count(),
            'in_progress'=> Ticket::whereIn('project_id', $allProjectIds)->where('status', 'in_progress')->count(),
            'waiting'    => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'waiting')->count(),
            'resolved'   => Ticket::whereIn('project_id', $allProjectIds)->where('status', 'resolved')->count(),
            'my_tickets' => Ticket::whereIn('project_id', $allProjectIds)->where('assigned_to', $user->id)->whereIn('status', ['open', 'in_progress', 'waiting'])->count(),
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Get ticket volume data for chart (last 7 days)
     */
    public function volume(Request $request)
    {
        $user          = auth('api')->user();
        $allProjectIds = $user->getCompanyProjectIds();
        $days          = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $startDate     = now()->subDays(6)->startOfDay();

        $counts = Ticket::whereIn('project_id', $allProjectIds)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupByRaw('DATE(created_at)')
            ->pluck('count', 'date');

        $volume = [];
        for ($i = 6; $i >= 0; $i--) {
            $date     = now()->subDays($i);
            $volume[] = [
                'day'   => $days[$date->dayOfWeekIso - 1],
                'count' => $counts[$date->toDateString()] ?? 0,
            ];
        }

        return response()->json(['success' => true, 'data' => $volume]);
    }

    /**
     * Manually create a Frubix lead from an existing ticket.
     */
    public function createFrubixLead(Request $request, string $ticketId)
    {
        $user   = auth('api')->user();
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
            $lead    = FrubixService::createLead($frubixConfig, [
                'name'   => $ticket->customer_name ?: ($ticket->customer_email ? explode('@', $ticket->customer_email)[0] : 'Unknown'),
                'email'  => $ticket->customer_email,
                'source' => 'linochat',
                'status' => 'new',
                'notes'  => "[LinoChat Ticket {$ticket->ticket_number}] {$ticket->subject}\n\n{$ticket->description}",
            ], $project);
            $leadId  = $lead['id'] ?? null;
            $frubixUrl = rtrim($frubixConfig['url'] ?? 'https://frubix.com', '/');
            $leadUrl = $leadId ? "{$frubixUrl}/leads/{$leadId}" : null;

            return response()->json([
                'success' => true,
                'message' => 'Lead created in Frubix',
                'data'    => ['frubix_lead_id' => $leadId, 'frubix_lead_url' => $leadUrl],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create Frubix lead manually', ['ticket_id' => $ticketId, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to create lead. Please try again.'], 500);
        }
    }
}
