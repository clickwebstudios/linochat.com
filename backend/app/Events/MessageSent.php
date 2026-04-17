<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $chatId;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatMessage $message)
    {
        $this->message = $message;
        $this->chatId = $message->chat_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('chat.' . $this->chatId),
        ];

        $projectId = $this->message->chat?->project_id;
        if ($projectId) {
            $channels[] = new PrivateChannel('project.' . $projectId);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $chat = $this->message->chat;

        $payload = [
            'id' => $this->message->id,
            'chat_id' => $this->message->chat_id,
            'project_id' => $chat?->project_id,
            'sender_type' => $this->message->sender_type,
            'sender_id' => $this->message->sender_id,
            'content' => $this->message->content,
            'is_ai' => $this->message->is_ai,
            'created_at' => $this->message->created_at->toIso8601String(),
            'metadata' => $this->message->metadata ?? [],
        ];

        // Include customer_name so the project-wide notification on the agent
        // dashboard can show "<Name> sent: ..." without a follow-up fetch.
        if ($chat) {
            $payload['customer_name'] = $chat->customer_name ?? null;
        }

        return $payload;
    }
}
