<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'type' => $this->type ?? 'general',
            'title' => $this->title ?? '',
            'description' => $this->description ?? $this->message ?? '',
            'read' => isset($this->read_at) ? $this->read_at !== null : (bool) ($this->is_read ?? false),
            'time' => $this->created_at?->diffForHumans() ?? '',
            'created_at' => $this->created_at,
        ];
    }
}
