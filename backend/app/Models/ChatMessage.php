<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;


    protected $fillable = [
        'chat_id',
        'sender_type',
        'sender_id',
        'content',
        'is_ai',
        'metadata',
        'read_at',
        'feedback',
    ];

    protected $casts = [
        'is_ai' => 'boolean',
        'metadata' => 'array',
        'read_at' => 'datetime',
    ];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }
}
