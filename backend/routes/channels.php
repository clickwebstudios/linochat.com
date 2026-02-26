<?php

use Illuminate\Support\Facades\Broadcast;

// Chat channel - accessible by widget (public) and agent (authenticated)
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    // Allow access if:
    // 1. User is authenticated and is the assigned agent
    // 2. Or this is a widget connection (we'll validate differently)
    
    if ($user) {
        return true; // Agent is authenticated
    }
    
    // For widget connections, we'll use a different approach
    // They can listen but we validate the customer_id separately
    return true;
});

// Agent dashboard channel - only authenticated agents (uses api guard for JWT)
Broadcast::channel('agent.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
}, ['guards' => ['api']]);

// Project channel for agent notifications (uses api guard for JWT)
Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    return $user->projects()->where('projects.id', $projectId)->exists() ||
           $user->ownedProjects()->where('id', $projectId)->exists();
}, ['guards' => ['api']]);
