<?php

namespace App\Jobs;

use App\Events\ChatStatusUpdated;
use App\Events\MessageSent;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatInactivityJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 120;

    public function handle(): void
    {
        $projects = Project::all()->filter(function (Project $project) {
            $inactivity = $project->widget_settings['inactivity'] ?? null;
            return $inactivity && ($inactivity['enabled'] ?? false);
        });

        $followUpCount = 0;
        $autoCloseCount = 0;

        foreach ($projects as $project) {
            $settings = $project->widget_settings['inactivity'];
            $delayMinutes = (int) ($settings['follow_up_delay_minutes'] ?? 1);
            $followUpMessage = $settings['follow_up_message'] ?? 'Are you still here? Let me know if you need any more help.';

            // Step 1: Send follow-up to silent chats
            $threshold = now()->subMinutes($delayMinutes);
            $maxAge = now()->subHours(24);

            $chatsNeedingFollowUp = Chat::where('project_id', $project->id)
                ->whereIn('status', ['active', 'waiting', 'ai_handling'])
                ->whereNull('follow_up_sent_at')
                ->where('last_message_at', '<=', $threshold)
                ->where('last_message_at', '>=', $maxAge)
                ->whereHas('lastMessage', function ($q) {
                    $q->where('sender_type', '!=', 'customer');
                })
                ->get();

            foreach ($chatsNeedingFollowUp as $chat) {
                try {
                    $message = ChatMessage::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'ai',
                        'content' => $followUpMessage,
                        'is_ai' => true,
                    ]);

                    $chat->update([
                        'follow_up_sent_at' => now(),
                        'last_message_at' => now(),
                    ]);

                    broadcast(new MessageSent($message));
                    $followUpCount++;
                } catch (\Throwable $e) {
                    Log::error("ChatInactivityJob: follow-up failed for chat {$chat->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Step 2: Auto-close chats that received follow-up but customer still silent
            $autoCloseEnabled = $settings['auto_close_enabled'] ?? false;
            if (!$autoCloseEnabled) {
                continue;
            }

            $autoCloseMinutes = (int) ($settings['auto_close_delay_minutes'] ?? 5);
            $autoCloseMessage = $settings['auto_close_message'] ?? 'This chat has been closed due to inactivity. Feel free to start a new conversation anytime!';
            $autoCloseThreshold = now()->subMinutes($autoCloseMinutes);

            $chatsToClose = Chat::where('project_id', $project->id)
                ->whereIn('status', ['active', 'waiting', 'ai_handling'])
                ->whereNotNull('follow_up_sent_at')
                ->where('follow_up_sent_at', '<=', $autoCloseThreshold)
                ->whereHas('lastMessage', function ($q) {
                    $q->where('sender_type', '!=', 'customer');
                })
                ->get();

            foreach ($chatsToClose as $chat) {
                try {
                    $message = ChatMessage::create([
                        'chat_id' => $chat->id,
                        'sender_type' => 'system',
                        'content' => $autoCloseMessage,
                    ]);

                    $chat->update([
                        'status' => 'closed',
                        'follow_up_sent_at' => null,
                    ]);

                    broadcast(new MessageSent($message));
                    broadcast(new ChatStatusUpdated($chat->id, 'closed'));
                    $autoCloseCount++;
                } catch (\Throwable $e) {
                    Log::error("ChatInactivityJob: auto-close failed for chat {$chat->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        if ($followUpCount > 0 || $autoCloseCount > 0) {
            Log::info("ChatInactivityJob: sent {$followUpCount} follow-ups, auto-closed {$autoCloseCount} chats");
        }
    }
}
