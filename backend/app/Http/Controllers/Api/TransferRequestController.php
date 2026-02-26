<?php

namespace App\Http\Controllers\Api;

use App\Events\TransferRequested;
use App\Events\TransferResolved;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatTransfer;
use Illuminate\Http\Request;

class TransferRequestController extends Controller
{
    /**
     * List pending transfer requests for projects the current agent has access to
     */
    public function index()
    {
        $user = auth('api')->user();
        $projectIds = $user->projects()->pluck('projects.id')->merge($user->ownedProjects()->pluck('id'))->unique();

        $transfers = ChatTransfer::whereIn('project_id', $projectIds)
            ->where('status', 'pending')
            ->where('from_agent_id', '!=', $user->id)
            ->with(['chat', 'fromAgent', 'project'])
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $transfers->map(fn (ChatTransfer $t) => $this->formatTransfer($t));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Accept a transfer request (any agent in the project can accept)
     */
    public function accept(Request $request, string $id)
    {
        $user = auth('api')->user();

        $transfer = ChatTransfer::where('id', $id)
            ->where('status', 'pending')
            ->with('project')
            ->first();

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer request not found or already resolved',
            ], 404);
        }

        $hasAccess = $transfer->project
            && ($user->projects()->where('projects.id', $transfer->project_id)->exists()
                || $user->ownedProjects()->where('id', $transfer->project_id)->exists());

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this project',
            ], 403);
        }

        if ((string) $transfer->from_agent_id === (string) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot accept your own transfer request',
            ], 422);
        }

        $notes = $request->input('notes', '');

        $transfer->update([
            'status' => 'accepted',
            'notes' => $notes,
            'resolved_at' => now(),
        ]);

        $chat = $transfer->chat;
        $chat->update(['agent_id' => $user->id]);

        broadcast(new TransferResolved((string) $transfer->id, (string) $transfer->project_id));

        return response()->json([
            'success' => true,
            'message' => 'Transfer accepted',
            'data' => $this->formatTransfer($transfer->fresh(['chat', 'fromAgent', 'project'])),
        ]);
    }

    /**
     * Reject a transfer request (any agent in the project can reject)
     */
    public function reject(Request $request, string $id)
    {
        $user = auth('api')->user();

        $transfer = ChatTransfer::where('id', $id)
            ->where('status', 'pending')
            ->with('project')
            ->first();

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer request not found or already resolved',
            ], 404);
        }

        $hasAccess = $transfer->project
            && ($user->projects()->where('projects.id', $transfer->project_id)->exists()
                || $user->ownedProjects()->where('id', $transfer->project_id)->exists());

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this project',
            ], 403);
        }

        $notes = $request->input('notes', '');

        $transfer->update([
            'status' => 'rejected',
            'notes' => $notes,
            'resolved_at' => now(),
        ]);

        broadcast(new TransferResolved((string) $transfer->id, (string) $transfer->project_id));

        return response()->json([
            'success' => true,
            'message' => 'Transfer rejected',
        ]);
    }

    /**
     * Create a new transfer request (initiate transfer)
     */
    public function store(Request $request)
    {
        $request->validate([
            'chat_id' => 'required|exists:chats,id',
            'to_agent_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:2000',
        ]);

        $user = auth('api')->user();

        $chat = Chat::findOrFail($request->chat_id);

        if ($chat->agent_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only transfer chats you are assigned to',
            ], 403);
        }

        if ($chat->agent_id == $request->to_agent_id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot transfer to yourself',
            ], 422);
        }

        $transfer = ChatTransfer::create([
            'chat_id' => $chat->id,
            'customer_id' => $chat->customer_id,
            'customer_name' => $chat->customer_name,
            'from_agent_id' => $user->id,
            'to_agent_id' => $request->to_agent_id,
            'project_id' => $chat->project_id,
            'reason' => $request->reason,
        ]);

        broadcast(new TransferRequested($transfer->load(['chat', 'fromAgent', 'project'])));

        return response()->json([
            'success' => true,
            'message' => 'Transfer request sent',
            'data' => $this->formatTransfer($transfer),
        ], 201);
    }

    private function formatTransfer(ChatTransfer $t): array
    {
        $fromAgent = $t->fromAgent;
        $initials = $fromAgent
            ? implode('', array_map(fn ($n) => mb_substr($n, 0, 1), explode(' ', $fromAgent->name)))
            : '??';

        $customerName = $t->customer_name ?? $t->chat?->customer_name ?? 'Customer';
        $customerInitials = implode('', array_map(fn ($n) => mb_substr($n, 0, 1), explode(' ', $customerName)));

        return [
            'id' => (string) $t->id,
            'customerId' => (string) ($t->customer_id ?? ''),
            'customerName' => $customerName,
            'customerAvatar' => strtoupper(mb_substr($customerInitials, 0, 2)) ?: 'CU',
            'chatId' => (string) $t->chat_id,
            'fromAgentId' => (string) $t->from_agent_id,
            'fromAgentName' => $fromAgent?->name ?? 'Unknown',
            'fromAgentAvatar' => strtoupper(mb_substr($initials, 0, 2)) ?: '??',
            'reason' => $t->reason,
            'timestamp' => $t->created_at->diffForHumans(),
            'projectId' => (string) $t->project_id,
            'projectName' => $t->project?->name ?? 'Project',
        ];
    }
}
