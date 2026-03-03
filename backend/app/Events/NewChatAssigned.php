<?php
namespace App\Events;
use App\Models\Chat;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatAssigned implements ShouldBroadcast {
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Chat $chat, public int $userId) {}

    public function broadcastOn(): array {
        return [new PrivateChannel('user.' . $this->userId)];
    }

    public function broadcastWith(): array {
        return ['chat_id' => $this->chat->id, 'customer_name' => $this->chat->customer_name];
    }
}
