<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $agentId;
    public $agentName;
    public $isTyping;

    /**
     * Create a new event instance.
     */
    public function __construct(string $chatId, string $agentId, string $agentName, bool $isTyping)
    {
        $this->chatId = $chatId;
        $this->agentId = $agentId;
        $this->agentName = $agentName;
        $this->isTyping = $isTyping;
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
        return 'agent.typing';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'agent_id' => $this->agentId,
            'agent_name' => $this->agentName,
            'is_typing' => $this->isTyping,
        ];
    }
}
