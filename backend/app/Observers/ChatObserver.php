<?php

namespace App\Observers;

use App\Jobs\AutoLearnFromChatJob;
use App\Models\Chat;

class ChatObserver
{
    public function updating(Chat $chat): void
    {
        // Only act when status changes to 'closed'
        if (!$chat->isDirty('status') || $chat->status !== 'closed') {
            return;
        }

        // Determine resolution type
        if ($chat->agent_id) {
            $chat->resolution_type = 'agent_resolved';
        } else {
            $chat->resolution_type = 'ai_resolved';
        }
    }

    public function updated(Chat $chat): void
    {
        // Dispatch auto-learn job when chat is AI-resolved
        if ($chat->wasChanged('status') && $chat->status === 'closed' && $chat->resolution_type === 'ai_resolved') {
            $project = $chat->project;
            if ($project && ($project->ai_settings['auto_learn'] ?? false)) {
                AutoLearnFromChatJob::dispatch($chat->id)->delay(now()->addSeconds(10));
            }
        }
    }
}
