<?php

namespace App\Events;

use App\Http\Resources\ChatResource;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Support\Str;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatForAgent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chat;
    public $projectId;
    public $agentIds;

    /**
     * Create a new event instance.
     */
    public function __construct($chat, string $projectId, array $agentIds)
    {
        $this->chat = $chat;
        $this->projectId = $projectId;
        $this->agentIds = $agentIds;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        foreach ($this->agentIds as $agentId) {
            $channels[] = new PrivateChannel('agent.' . $agentId);
        }
        
        // Also broadcast to project channel
        $channels[] = new PrivateChannel('project.' . $this->projectId);
        
        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'new.chat';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $chatArray = (new ChatResource($this->chat))->resolve();
        $lastMsg = $this->chat->messages->first();
        if ($lastMsg) {
            $chatArray['preview'] = Str::limit($lastMsg->content ?? '', 50);
        }

        return [
            'chat' => $chatArray,
            'chat_id' => $this->chat->id,
            'project_id' => $this->projectId,
        ];
    }
}
