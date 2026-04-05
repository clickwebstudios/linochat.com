<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * View/reply/update/escalate — assigned agent, any project member, owner, or superadmin.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        return $user->isSuperadmin()
            || (int) $ticket->assigned_to === (int) $user->id
            || $user->projects()->where('projects.id', $ticket->project_id)->exists()
            || $user->ownedProjects()->where('id', $ticket->project_id)->exists();
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    public function reply(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    public function escalate(User $user, Ticket $ticket): bool
    {
        return $this->view($user, $ticket);
    }

    /**
     * Assign — project member or owner (not just assigned agent).
     */
    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->isSuperadmin()
            || $user->projects()->where('projects.id', $ticket->project_id)->exists()
            || $user->ownedProjects()->where('id', $ticket->project_id)->exists();
    }

    /**
     * Delete — only project owner or superadmin.
     */
    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->isSuperadmin()
            || $user->ownedProjects()->where('id', $ticket->project_id)->exists();
    }
}
