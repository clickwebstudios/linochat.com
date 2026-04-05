<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * View — owner, assigned agent, or superadmin.
     */
    public function view(User $user, Project $project): bool
    {
        return $user->isSuperadmin()
            || (int) $project->user_id === (int) $user->id
            || $user->projects()->where('projects.id', $project->id)->exists();
    }

    /**
     * Manage (update, delete, invite/remove agents) — only owner or superadmin.
     */
    public function manage(User $user, Project $project): bool
    {
        return $user->isSuperadmin()
            || (int) $project->user_id === (int) $user->id;
    }
}
