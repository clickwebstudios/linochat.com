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
        'integrations',
        'settings_updated_at',
        'website',
        'status',
        'description',
        'is_active',
    ];

    protected $casts = [
        'widget_settings' => 'array',
        'ai_settings'     => 'array',
        'integrations'    => 'array',
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

    /**
     * Get agent IDs scoped to this project's company (owner).
     * Returns only agents who are assigned to projects owned by the same admin,
     * plus the project owner themselves. Prevents cross-company notification leakage.
     */
    public function getCompanyAgentIds(): \Illuminate\Support\Collection
    {
        $ownerId = $this->user_id;

        // Get agents assigned to THIS project who also belong to projects owned by the same owner
        $agentIds = $this->agents()
            ->whereHas('projects', fn ($q) => $q->where('projects.user_id', $ownerId))
            ->pluck('users.id');

        return $agentIds->push($ownerId)->unique()->filter()->values();
    }
}
