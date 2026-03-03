<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price_monthly' => (float) $this->price_monthly,
            'price_annual' => (float) $this->price_annual,
            'features' => $this->features ?? [],
            'is_popular' => $this->is_popular,
        ];
    }
}
