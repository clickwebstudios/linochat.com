<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'sender_type' => $this->sender_type,
            'content' => $this->content,
            'is_read' => (bool) $this->read_at,
            'timestamp' => $this->created_at,
        ];
    }
}
