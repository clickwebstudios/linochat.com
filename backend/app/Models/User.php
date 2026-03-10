<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'first_name',
        'last_name',
        'company_name',
        'email',
        'phone',
        'location',
        'country',
        'bio',
        'avatar_url',
        'role',
        'status',
        'password',
        'two_factor_enabled',
        'last_active_at',
        'join_date',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'last_active_at' => 'datetime',
        ];
    }

    public function getNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withTimestamps();
    }

    public function ownedProjects()
    {
        return $this->hasMany(Project::class, 'user_id');
    }

    public function chats()
    {
        return $this->hasMany(Chat::class, 'agent_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function appNotifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    public function notificationPreferences()
    {
        return $this->hasOne(UserNotificationPreference::class);
    }

    public function availabilitySettings()
    {
        return $this->hasOne(UserAvailabilitySetting::class);
    }

    public function kbArticles()
    {
        return $this->hasMany(KbArticle::class, 'author_id');
    }

    public function incomingTransferRequests()
    {
        return $this->hasMany(ChatTransfer::class, 'to_agent_id');
    }

    public function outgoingTransferRequests()
    {
        return $this->hasMany(ChatTransfer::class, 'from_agent_id');
    }
}
