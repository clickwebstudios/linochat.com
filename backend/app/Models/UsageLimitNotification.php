<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageLimitNotification extends Model
{
    protected $fillable = [
        'company_id',
        'limit_type',
        'threshold',
        'billing_period_start',
        'sent_at',
    ];

    protected $casts = [
        'billing_period_start' => 'date',
        'sent_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public static function wasAlreadySent(int $companyId, string $limitType, string $threshold, Carbon $periodStart): bool
    {
        return static::where('company_id', $companyId)
            ->where('limit_type', $limitType)
            ->where('threshold', $threshold)
            ->where('billing_period_start', $periodStart->toDateString())
            ->exists();
    }
}
