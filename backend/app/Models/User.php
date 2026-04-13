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
        'company_id',
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
        'deactivated_reason',
        'password',
        'two_factor_enabled',
        'last_active_at',
        'join_date',
        'google_id',
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

    public function company()
    {
        return $this->belongsTo(Company::class);
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

    public function deviceTokens()
    {
        return $this->hasMany(DeviceToken::class);
    }

    // ── Company isolation helpers ───────────────────────────────────────

    /**
     * Resolve the "company owner" ID for this user.
     * Admin → own ID. Agent → the admin who owns their assigned projects.
     * Superadmin → null (has access to everything).
     */
    public function getCompanyOwnerId(): ?int
    {
        if ($this->isSuperadmin()) return null;
        if ($this->isAdmin()) return (int) $this->id;

        // Agent: find the admin who owns the projects this agent is assigned to
        $ownerId = Project::whereIn('id', $this->projects()->pluck('projects.id'))
            ->distinct()
            ->value('user_id');

        return $ownerId ? (int) $ownerId : null;
    }

    /**
     * Get ALL project IDs that belong to this user's company.
     * Used to scope every data query for complete company isolation.
     */
    public function getCompanyProjectIds(): \Illuminate\Support\Collection
    {
        if ($this->isSuperadmin()) return collect();

        $ownerId = $this->getCompanyOwnerId();
        if (!$ownerId) return collect();

        return Project::where('user_id', $ownerId)->pluck('id');
    }

    /**
     * Resolve project IDs for data queries.
     * Superadmin with companyId → that company's projects.
     * Superadmin without companyId, with superadminUnscoped=true → all projects (null = no filter).
     * Superadmin without companyId, default → own company's projects (safe default).
     * Regular user → their company's projects.
     */
    public function resolveProjectIds(?string $companyId = null, bool $superadminUnscoped = false): ?\Illuminate\Support\Collection
    {
        if ($this->isSuperadmin()) {
            if ($companyId) {
                return Project::where('user_id', $companyId)->pluck('id');
            }
            if ($superadminUnscoped) {
                return null;
            }
            // Default: scope to superadmin's own company
            $company = $this->company_id ? Company::find($this->company_id) : null;
            if ($company) {
                $userIds = $company->users()->pluck('id');
                return Project::whereIn('user_id', $userIds)->pluck('id');
            }
            return collect();
        }
        return $this->getCompanyProjectIds();
    }

    /**
     * Check if user can access a specific project (company-isolated).
     * Replaces scattered $hasAccess checks throughout controllers.
     */
    public function canAccessProject($project): bool
    {
        if ($this->isSuperadmin()) return true;
        if ((int) $project->user_id === (int) $this->id) return true;

        // Agent must be assigned AND project must belong to user's company
        $companyOwnerId = $this->getCompanyOwnerId();
        return $companyOwnerId
            && (int) $project->user_id === $companyOwnerId
            && $this->projects()->where('projects.id', $project->id)->exists();
    }
}
