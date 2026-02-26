<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'customer_id',
        'customer_name',
        'from_agent_id',
        'to_agent_id',
        'project_id',
        'reason',
        'notes',
        'status',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function fromAgent()
    {
        return $this->belongsTo(User::class, 'from_agent_id');
    }

    public function toAgent()
    {
        return $this->belongsTo(User::class, 'to_agent_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
