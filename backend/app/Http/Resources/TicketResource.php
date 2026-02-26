<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'customer_email' => $this->customer_email ?? '',
            'customer_name' => $this->customer_name ?? '',
            'subject' => $this->subject ?? '',
            'description' => $this->description ?? '',
            'priority' => $this->priority ?? 'medium',
            'category' => $this->category ?? '',
            'status' => $this->status ?? 'open',
            'assigned_to' => $this->assigned_to ?? null,
            'resolved_at' => $this->resolved_at ?? null,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'project' => [
                'id' => $this->project->id ?? null,
                'name' => $this->project->name ?? '',
            ],
            'assigned_agent' => $this->assignedAgent ? [
                'id' => $this->assignedAgent->id,
                'first_name' => $this->assignedAgent->first_name ?? '',
                'last_name' => $this->assignedAgent->last_name ?? '',
                'email' => $this->assignedAgent->email ?? '',
            ] : null,
        ];
    }
}
