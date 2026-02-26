<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAvailabilitySetting extends Model
{
    use HasFactory;


    protected $fillable = [
        'user_id',
        'auto_accept_chats',
        'max_concurrent_chats',
    ];

    protected $casts = [
        'auto_accept_chats' => 'boolean',
        'max_concurrent_chats' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
