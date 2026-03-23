<?php

namespace App\Jobs;

use App\Models\Chat;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Scheduled daily job: reviews all resolved chats from the last 24h
 * and dispatches AutoLearnFromChatJob for each eligible conversation.
 *
 * Register in app/Console/Kernel.php:
 *   $schedule->job(new DailyAutoLearnJob)->dailyAt('03:00');
 */
class DailyAutoLearnJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    public function handle(): void
    {
        $since = now()->subHours(24);

        // Get all projects with auto_learn enabled
        $projects = Project::all()->filter(function ($project) {
            return ($project->ai_settings['auto_learn'] ?? false);
        });

        if ($projects->isEmpty()) {
            Log::info('DailyAutoLearn: no projects with auto_learn enabled');
            return;
        }

        $projectIds = $projects->pluck('id');
        $dispatched = 0;

        // Find closed chats from last 24h that haven't been learned from yet
        $chats = Chat::whereIn('project_id', $projectIds)
            ->where('status', 'closed')
            ->where('updated_at', '>=', $since)
            ->whereNotNull('resolution_type')
            ->whereDoesntHave('messages', function ($q) {
                // Skip chats that already generated KB articles (check metadata)
                $q->where('metadata->auto_learned', true);
            })
            ->withCount('messages')
            ->having('messages_count', '>=', 3) // At least 3 messages (meaningful conversation)
            ->get();

        foreach ($chats as $chat) {
            AutoLearnFromChatJob::dispatch($chat->id, $chat->resolution_type)
                ->delay(now()->addSeconds($dispatched * 5)); // Stagger to avoid rate limits
            $dispatched++;
        }

        Log::info('DailyAutoLearn: dispatched jobs', [
            'projects' => $projectIds->count(),
            'chats_processed' => $dispatched,
        ]);
    }
}
