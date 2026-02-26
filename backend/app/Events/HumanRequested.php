<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class HumanRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Chat $chat
    ) {}

    public function broadcastOn(): array
    {
        $project = $this->chat->project;
        if (!$project) {
            return [];
        }

        $agentIds = $project->agents->pluck('id')->merge([$project->user_id])->unique()->filter();
        $channels = $agentIds->map(fn ($id) => new PrivateChannel('agent.' . $id))->all();
        // Also broadcast to project channel so all project members receive it
        $channels[] = new PrivateChannel('project.' . $project->id);
        return array_values($channels);
    }

    public function broadcastAs(): string
    {
        return 'human.requested';
    }

    public function broadcastWith(): array
    {
        $customerName = $this->chat->customer_name ?? 'Customer';
        $customerInitials = implode('', array_map(fn ($n) => mb_substr($n, 0, 1), explode(' ', $customerName)));

        return [
            'chat_id' => (string) $this->chat->id,
            'customer_name' => $customerName,
            'project_id' => (string) $this->chat->project_id,
            'project_name' => $this->chat->project?->name ?? 'Project',
        ];
    }
}
