<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'action_type',
        'tokens_amount',
        'balance_after',
        'reference_id',
        'metadata',
    ];

    protected $casts = [
        'metadata'      => 'array',
        'tokens_amount' => 'integer',
        'balance_after' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
