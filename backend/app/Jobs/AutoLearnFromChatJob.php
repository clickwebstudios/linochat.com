<?php

namespace App\Jobs;

use App\Models\Chat;
use App\Models\KbArticle;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use OpenAI;

class AutoLearnFromChatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;

    public function __construct(
        private int $chatId,
        private string $resolutionType = 'unknown'
    ) {}

    public function handle(): void
    {
        $chat = Chat::with(['messages', 'project'])->find($this->chatId);
        if (!$chat || !$chat->project) return;

        $project = $chat->project;
        if (!($project->ai_settings['auto_learn'] ?? false)) return;

        // Get all conversation messages (customer + AI + agent, skip system)
        $messages = $chat->messages()
            ->whereIn('sender_type', ['customer', 'ai', 'agent'])
            ->orderBy('created_at')
            ->limit(30)
            ->get();

        if ($messages->count() < 2) return;

        // Detect agent corrections: agent message right after AI message
        $corrections = [];
        $prevMsg = null;
        foreach ($messages as $msg) {
            if ($prevMsg && $prevMsg->sender_type === 'ai' && $msg->sender_type === 'agent') {
                $corrections[] = [
                    'ai_said' => $prevMsg->content,
                    'agent_corrected' => $msg->content,
                ];
                // Flag the AI message metadata
                $prevMsg->update(['metadata' => array_merge($prevMsg->metadata ?? [], ['agent_corrected' => true])]);
            }
            $prevMsg = $msg;
        }

        // Build transcript
        $transcript = $messages->map(function ($msg) {
            $role = match ($msg->sender_type) {
                'customer' => 'Customer',
                'ai' => 'AI',
                'agent' => 'Agent',
                default => 'System',
            };
            return "{$role}: {$msg->content}";
        })->join("\n\n");

        $customerMessages = $messages->where('sender_type', 'customer');
        if ($customerMessages->count() < 1) return;

        $apiKey = config('openai.api_key');
        if (!$apiKey) return;

        // Build context about the conversation type
        $extraContext = '';
        if ($this->resolutionType === 'agent_resolved') {
            $extraContext = "\nNote: This chat was handled by a human agent. The agent's responses are the authoritative answers — prioritize learning from what the AGENT said, not the AI.\n";
        }
        if (!empty($corrections)) {
            $correctionText = collect($corrections)->map(fn($c) => "- AI said: \"{$c['ai_said']}\"\n  Agent corrected to: \"{$c['agent_corrected']}\"")->join("\n");
            $extraContext .= "\nAgent corrections detected (AI was wrong, agent provided correct answer):\n{$correctionText}\n";
        }

        try {
            $client = OpenAI::client($apiKey);

            $response = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a knowledge base specialist. Given a resolved customer support conversation, extract useful Q&A and create a concise help article. If agent corrections are present, the agent\'s answer is the correct one — create the article based on the agent\'s response, not the AI\'s. Return JSON:
{
  "should_create": true/false,
  "title": "Article title (question form preferred)",
  "category": "one of: FAQ, Troubleshooting, How-To, Policies, General",
  "content": "Clear, well-structured answer in markdown. Include the resolution steps.",
  "tags": ["tag1", "tag2"]
}
Set should_create to false if the conversation is too generic, personal, or not useful as a knowledge article.',
                    ],
                    [
                        'role' => 'user',
                        'content' => "Company: {$project->name}\n{$extraContext}\nConversation:\n{$transcript}",
                    ],
                ],
                'max_tokens' => 1000,
                'temperature' => 0.3,
            ]);

            $raw = $response->choices[0]->message->content ?? '{}';
            $parsed = json_decode($raw, true);

            if (!($parsed['should_create'] ?? false) || empty($parsed['title'])) {
                Log::info('AutoLearn: skipped', ['chat_id' => $this->chatId, 'type' => $this->resolutionType]);
                return;
            }

            // Check for duplicate titles
            $existing = KbArticle::where('project_id', $project->id)
                ->where('title', 'LIKE', '%' . substr($parsed['title'], 0, 50) . '%')
                ->first();

            if ($existing) {
                Log::info('AutoLearn: similar article exists', ['chat_id' => $this->chatId, 'existing_id' => $existing->id]);
                return;
            }

            $category = $project->kbCategories()->firstOrCreate(
                ['name' => $parsed['category'] ?? 'FAQ'],
                ['slug' => \Illuminate\Support\Str::slug($parsed['category'] ?? 'faq')]
            );

            KbArticle::create([
                'project_id' => $project->id,
                'category_id' => $category->id,
                'title' => $parsed['title'],
                'content' => $parsed['content'] ?? '',
                'slug' => \Illuminate\Support\Str::slug($parsed['title']),
                'status' => 'draft',
                'is_published' => false,
                'is_ai_generated' => true,
                'source_url' => null,
                'author_id' => null,
            ]);

            Log::info('AutoLearn: KB article created', [
                'chat_id' => $this->chatId,
                'type' => $this->resolutionType,
                'corrections' => count($corrections),
                'title' => $parsed['title'],
                'project_id' => $project->id,
            ]);

        } catch (\Exception $e) {
            Log::error('AutoLearn failed', ['chat_id' => $this->chatId, 'error' => $e->getMessage()]);
        }
    }
}
