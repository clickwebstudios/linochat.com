<?php

namespace App\Models;

use App\Observers\ChatObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(ChatObserver::class)]
class Chat extends Model
{
    use HasFactory;


    protected $fillable = [
        'project_id',
        'agent_id',
        'customer_email',
        'customer_name',
        'customer_id',
        'channel',
        'status',
        'ai_enabled',
        'subject',
        'priority',
        'last_message_at',
        'customer_last_seen_at',
        'metadata',
        'resolution_type',
        'follow_up_sent_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'customer_last_seen_at' => 'datetime',
        'follow_up_sent_at' => 'datetime',
        'metadata' => 'array',
        'ai_enabled' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function assignedTo(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'agent_id');
    }

    public function lastMessage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\ChatMessage::class)->latestOfMany();
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function transfers()
    {
        return $this->hasMany(ChatTransfer::class);
    }
}
