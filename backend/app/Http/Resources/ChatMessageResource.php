<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'sender' => $this->sender,
            'text' => $this->text,
            'is_read' => $this->is_read,
            'timestamp' => $this->created_at,
        ];
    }
}
