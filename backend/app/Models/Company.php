<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'plan',
        'status',
        'notification_settings',
        'token_balance',
        'monthly_token_allowance',
        'tokens_used_this_cycle',
        'token_rollover',
        'token_cycle_reset_at',
        'stripe_customer_id',
        'stripe_subscription_id',
        'twilio_subaccount_sid',
        'twilio_auth_token',
        'messenger_page_id',
        'whatsapp_waba_id',
    ];

    protected $casts = [
        'notification_settings' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get projects owned by any user in this company.
     * Projects don't have company_id — they link via user_id (the admin owner).
     */
    public function projects()
    {
        $userIds = $this->users()->pluck('id');
        return Project::whereIn('user_id', $userIds);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function tokenTransactions(): HasMany
    {
        return $this->hasMany(TokenTransaction::class);
    }

    public function tokenPurchases(): HasMany
    {
        return $this->hasMany(TokenPurchase::class);
    }

    public function usageLimitNotifications(): HasMany
    {
        return $this->hasMany(UsageLimitNotification::class);
    }
}
