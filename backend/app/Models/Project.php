<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'widget_id',
        'color',
        'widget_settings',
        'ai_settings',
        'settings_updated_at',
        'website',
        'status',
        'description',
    ];

    protected $casts = [
        'widget_settings' => 'array',
        'ai_settings'     => 'array',
        'settings_updated_at' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function agents()
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withTimestamps();
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function kbCategories()
    {
        return $this->hasMany(KbCategory::class);
    }

    public function aiSettingsVersions()
    {
        return $this->hasMany(AiSettingsVersion::class);
    }
}
