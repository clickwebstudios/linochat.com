<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'read' => $this->read_at !== null,
            'time' => $this->created_at->diffForHumans(),
            'created_at' => $this->created_at,
        ];
    }
}
