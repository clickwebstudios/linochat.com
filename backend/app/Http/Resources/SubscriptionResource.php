<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'plan_id' => $this->plan_id,
            'billing_cycle' => $this->billing_cycle,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'ends_at' => $this->ends_at,
            'renews_at' => $this->renews_at,
            'downgrade_selected_at' => $this->downgrade_selected_at,
            'plan' => new PlanResource($this->plan),
        ];
    }
}
