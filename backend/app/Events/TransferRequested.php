<?php

namespace App\Events;

use App\Models\ChatTransfer;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransferRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatTransfer $transfer
    ) {}

    public function broadcastOn(): array
    {
        $project = $this->transfer->project;
        if (!$project) {
            return [new PrivateChannel('agent.' . $this->transfer->to_agent_id)];
        }
        $agentIds = $project->getCompanyAgentIds()
            ->reject(fn ($id) => (string) $id === (string) $this->transfer->from_agent_id);
        $channels = $agentIds->map(fn ($id) => new PrivateChannel('agent.' . $id))->all();
        return $channels ?: [new PrivateChannel('agent.' . $this->transfer->to_agent_id)];
    }

    public function broadcastAs(): string
    {
        return 'transfer.requested';
    }

    public function broadcastWith(): array
    {
        $t = $this->transfer;
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
