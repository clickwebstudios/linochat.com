<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Plan extends Model {
    use HasFactory;
    protected $fillable = ['name', 'price_monthly', 'price_annual', 'features', 'is_popular'];
    protected $casts = ['features' => 'array', 'is_popular' => 'boolean', 'price_monthly' => 'decimal:2', 'price_annual' => 'decimal:2'];
    public function subscriptions() { return $this->hasMany(Subscription::class); }
}
