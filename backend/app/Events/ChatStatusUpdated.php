<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $status;
    public $agentId;
    public $agentName;

    /**
     * Create a new event instance.
     */
    public function __construct(string $chatId, string $status, ?string $agentId = null, ?string $agentName = null)
    {
        $this->chatId = $chatId;
        $this->status = $status;
        $this->agentId = $agentId;
        $this->agentName = $agentName;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('chat.' . $this->chatId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'chat.status';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'status' => $this->status,
            'agent_id' => $this->agentId,
            'agent_name' => $this->agentName,
        ];
    }
}
