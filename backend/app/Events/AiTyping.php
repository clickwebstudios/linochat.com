<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chatId;
    public $isTyping;
    public $model;

    /**
     * Create a new event instance.
     */
    public function __construct(string $chatId, bool $isTyping, string $model = 'gpt-4o')
    {
        $this->chatId = $chatId;
        $this->isTyping = $isTyping;
        $this->model = $model;
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
        return $this->isTyping ? 'ai.typing' : 'ai.typing.stop';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'is_typing' => $this->isTyping,
            'model' => $this->model,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
