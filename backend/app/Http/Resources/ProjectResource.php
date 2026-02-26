<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name ?? '',
            'slug' => $this->slug ?? '',
            'widget_id' => $this->widget_id ?? '',
            'color' => $this->color ?? '#4F46E5',
            'widget_settings' => $this->widget_settings ?? [],
            'settings_updated_at' => $this->settings_updated_at ?? null,
            'website' => $this->website ?? '',
            'status' => $this->status ?? 'active',
            'description' => $this->description ?? '',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'agents_count' => $this->agents_count ?? 0,
            'chats_count' => $this->chats_count ?? 0,
            'tickets_count' => $this->tickets_count ?? 0,
        ];
    }
}
