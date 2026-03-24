<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    public function toArray($request)
    {
        $unreadCount = $this->messages()
            ->whereIn('sender_type', ['customer', 'ai'])
            ->whereNull('read_at')
            ->count();

        $latestMessage = $this->relationLoaded('messages') && $this->messages->isNotEmpty()
            ? $this->messages->first()->content
            : null;
        $preview = $latestMessage
            ? (strlen($latestMessage) > 60 ? substr($latestMessage, 0, 60) . '…' : $latestMessage)
            : null;

        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'agent_id' => $this->agent_id,
            'agent_name' => $this->relationLoaded('agent') && $this->agent ? $this->agent->name : null,
            'customer_email' => $this->customer_email ?? '',
            'customer_name' => $this->customer_name ?? '',
            'customer_id' => $this->customer_id ?? '',
            'status' => $this->status ?? 'active',
            'subject' => $this->subject ?? '',
            'priority' => $this->priority ?? 'medium',
            'metadata' => $this->metadata ?? [],
            'last_message_at' => $this->last_message_at,
            'customer_last_seen_at' => $this->customer_last_seen_at?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'unread_count' => $unreadCount,
            'preview' => $preview,
            'has_frubix' => (bool) ($this->project?->integrations['frubix_managed']['enabled'] ?? $this->project?->integrations['frubix']['enabled'] ?? false),
            'project' => [
                'id' => $this->project->id,
                'name' => $this->project->name ?? '',
                'widget_id' => $this->project->widget_id ?? '',
                'color' => $this->project->color ?? '#4F46E5',
            ],
            'messages' => $this->messages->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'chat_id' => $msg->chat_id,
                    'sender_type' => $msg->sender_type ?? 'agent',
                    'sender_id' => $msg->sender_id ?? '',
                    'content' => $msg->content ?? '',
                    'is_ai' => $msg->is_ai ?? false,
                    'metadata' => $msg->metadata ?? [],
                    'created_at' => $msg->created_at,
                    'read_at' => $msg->read_at?->toIso8601String(),
                ];
            }),
        ];
    }
}
