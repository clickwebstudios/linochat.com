<?php

namespace App\Observers;

use App\Jobs\AutoLearnFromChatJob;
use App\Models\Chat;

class ChatObserver
{
    public function updating(Chat $chat): void
    {
        if (!$chat->isDirty('status') || $chat->status !== 'closed') {
            return;
        }

        $chat->resolution_type = $chat->agent_id ? 'agent_resolved' : 'ai_resolved';
    }

    public function updated(Chat $chat): void
    {
        // Dispatch auto-learn for BOTH AI-resolved and agent-resolved chats
        if ($chat->wasChanged('status') && $chat->status === 'closed') {
            $project = $chat->project;
            if ($project && ($project->ai_settings['auto_learn'] ?? false)) {
                // Agent-resolved chats are higher quality — learn from them too
                AutoLearnFromChatJob::dispatch($chat->id, $chat->resolution_type ?? 'unknown')
                    ->delay(now()->addSeconds(10));
            }
        }
    }
}
