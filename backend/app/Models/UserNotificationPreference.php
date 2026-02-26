<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotificationPreference extends Model
{
    use HasFactory;


    protected $fillable = [
        'user_id',
        'email_notifications',
        'desktop_notifications',
        'sound_alerts',
        'weekly_summary',
    ];

    protected $casts = [
        'email_notifications' => 'boolean',
        'desktop_notifications' => 'boolean',
        'sound_alerts' => 'boolean',
        'weekly_summary' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
