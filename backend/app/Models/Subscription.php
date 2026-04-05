<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model {
    protected $fillable = ['company_id', 'plan_id', 'billing_cycle', 'status', 'stripe_subscription_id', 'started_at', 'ends_at'];
    protected $casts = ['started_at' => 'datetime', 'ends_at' => 'datetime'];
    public function company() { return $this->belongsTo(Company::class); }
    public function plan() { return $this->belongsTo(Plan::class); }
}
