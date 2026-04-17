<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on every customer activity (message, heartbeat, page view) so
 * agents' chat-list state can flip a chat's online indicator without waiting
 * for the 15s silent poll. Goes out on each company agent's private channel
 * so it reaches every dashboard that could potentially show the chat — not
 * just the one currently focused on the chat-specific channel.
 */
class CustomerPresenceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public string $lastSeenAt;
    public array $agentIds;

    public function __construct(int $chatId, string $lastSeenAt, array $agentIds)
    {
        $this->chatId = $chatId;
        $this->lastSeenAt = $lastSeenAt;
        $this->agentIds = $agentIds;
    }

    /**
     * @return PrivateChannel[]
     */
    public function broadcastOn(): array
    {
        return array_map(
            fn ($id) => new PrivateChannel('agent.' . $id),
            $this->agentIds,
        );
    }

    public function broadcastAs(): string
    {
        return 'customer.presence.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'last_seen_at' => $this->lastSeenAt,
        ];
    }
}
