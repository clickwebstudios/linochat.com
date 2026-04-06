<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name ?? '',
            'last_name' => $this->last_name ?? '',
            'email' => $this->email ?? '',
            'phone' => $this->phone ?? '',
            'location' => $this->location ?? '',
            'country' => $this->country ?? '',
            'bio' => $this->bio ?? '',
            'avatar_url' => $this->avatar_url ?? '',
            'role' => $this->role ?? 'agent',
            'company_plan' => $this->company?->plan ?? 'Free',
            'status' => $this->status ?? 'Active',
            'two_factor_enabled' => $this->two_factor_enabled ?? false,
            'last_active_at' => $this->last_active_at ?? null,
            'join_date' => $this->join_date ?? $this->created_at?->toDateString(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
