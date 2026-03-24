<?php

use App\Models\Project;
use Illuminate\Support\Facades\Broadcast;

// Chat channel - accessible by widget (public) and agent (authenticated)
// Agents can only listen to chats from their own company's projects
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    if (!$user) return true; // Widget connections validated separately

    $chat = \App\Models\Chat::find($chatId);
    if (!$chat) return false;

    // Superadmin can listen to any chat
    if ($user->role === 'superadmin') return true;

    // User must own the project or be assigned to it
    $project = Project::find($chat->project_id);
    if (!$project) return false;

    return (string) $project->user_id === (string) $user->id
        || $user->projects()->where('projects.id', $project->id)
               ->where('projects.user_id', $project->user_id)->exists();
});

// Agent dashboard channel - only authenticated agents (uses api guard for JWT)
Broadcast::channel('agent.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
}, ['guards' => ['api']]);

// Project channel for agent notifications (uses api guard for JWT)
// Verify user belongs to the same company (project owner) to prevent cross-company leakage
Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    if ($user->role === 'superadmin') return true;

    $project = Project::find($projectId);
    if (!$project) return false;

    // User is the project owner
    if ((string) $project->user_id === (string) $user->id) return true;

    // User is assigned to this project AND is part of the same company
    return $user->projects()
        ->where('projects.id', $projectId)
        ->where('projects.user_id', $project->user_id)
        ->exists();
}, ['guards' => ['api']]);
