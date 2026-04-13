<?php

namespace App\Policies;

use App\Models\Chat;
use App\Models\User;

class ChatPolicy
{
    /**
     * View/send message/close — assigned agent, any project member, owner, or superadmin.
     */
    public function view(User $user, Chat $chat): bool
    {
        return $user->isSuperadmin()
            || (int) $chat->agent_id === (int) $user->id
            || $user->projects()->where('projects.id', $chat->project_id)->exists()
            || $user->ownedProjects()->where('id', $chat->project_id)->exists();
    }

    public function sendMessage(User $user, Chat $chat): bool
    {
        return $this->view($user, $chat);
    }

    public function close(User $user, Chat $chat): bool
    {
        return $this->view($user, $chat);
    }

    public function toggleAi(User $user, Chat $chat): bool
    {
        return $this->view($user, $chat);
    }

    public function delete(User $user, Chat $chat): bool
    {
        // Only admins (project owners) and superadmins can delete chats
        return $user->isSuperadmin()
            || ($user->isAdmin() && $user->ownedProjects()->where('id', $chat->project_id)->exists());
    }
}
