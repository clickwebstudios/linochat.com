<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransferResolved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $transferId,
        public string $projectId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.' . $this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'transfer.resolved';
    }

    public function broadcastWith(): array
    {
        return ['transfer_id' => $this->transferId];
    }
}
