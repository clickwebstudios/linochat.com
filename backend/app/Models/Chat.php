<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;


    protected $fillable = [
        'project_id',
        'agent_id',
        'customer_email',
        'customer_name',
        'customer_id',
        'status',
        'ai_enabled',
        'subject',
        'priority',
        'last_message_at',
        'customer_last_seen_at',
        'metadata',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'customer_last_seen_at' => 'datetime',
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

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function transfers()
    {
        return $this->hasMany(ChatTransfer::class);
    }
}
