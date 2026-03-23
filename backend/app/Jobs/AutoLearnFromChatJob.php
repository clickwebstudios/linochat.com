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
        private int $chatId
    ) {}

    public function handle(): void
    {
        $chat = Chat::with(['messages', 'project'])->find($this->chatId);
        if (!$chat || !$chat->project) return;

        $project = $chat->project;
        $aiSettings = $project->ai_settings ?? [];

        if (!($aiSettings['auto_learn'] ?? false)) return;

        // Get conversation messages (customer + AI only, skip system)
        $messages = $chat->messages()
            ->whereIn('sender_type', ['customer', 'ai'])
            ->orderBy('created_at')
            ->limit(20)
            ->get();

        if ($messages->count() < 2) return; // Need at least 1 Q&A pair

        // Build conversation transcript
        $transcript = $messages->map(function ($msg) {
            $role = $msg->sender_type === 'customer' ? 'Customer' : 'AI';
            return "{$role}: {$msg->content}";
        })->join("\n\n");

        // Check if this is a substantial enough conversation to learn from
        $customerMessages = $messages->where('sender_type', 'customer');
        if ($customerMessages->count() < 1) return;

        $apiKey = config('openai.api_key');
        if (!$apiKey) return;

        try {
            $client = OpenAI::client($apiKey);

            $response = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a knowledge base specialist. Given a successfully resolved customer support conversation, extract the key question/topic and create a concise help article. Return JSON:
{
  "should_create": true/false,
  "title": "Article title (question form preferred)",
  "category": "one of: FAQ, Troubleshooting, How-To, Policies, General",
  "content": "Clear, well-structured answer in markdown. Include the resolution steps.",
  "tags": ["tag1", "tag2"]
}
Set should_create to false if the conversation is too generic, personal, or not useful as a knowledge article (e.g., just greetings, off-topic chat).',
                    ],
                    [
                        'role' => 'user',
                        'content' => "Company: {$project->name}\n\nConversation:\n{$transcript}",
                    ],
                ],
                'max_tokens' => 1000,
                'temperature' => 0.3,
            ]);

            $raw = $response->choices[0]->message->content ?? '{}';
            $parsed = json_decode($raw, true);

            if (!($parsed['should_create'] ?? false) || empty($parsed['title'])) {
                Log::info('AutoLearn: skipped — conversation not suitable for KB', ['chat_id' => $this->chatId]);
                return;
            }

            // Check for duplicate titles
            $existing = KbArticle::where('project_id', $project->id)
                ->where('title', 'LIKE', '%' . substr($parsed['title'], 0, 50) . '%')
                ->first();

            if ($existing) {
                Log::info('AutoLearn: similar article exists, skipping', ['chat_id' => $this->chatId, 'existing_id' => $existing->id]);
                return;
            }

            // Find or create category
            $category = $project->kbCategories()->firstOrCreate(
                ['name' => $parsed['category'] ?? 'FAQ'],
                ['slug' => \Illuminate\Support\Str::slug($parsed['category'] ?? 'faq')]
            );

            // Create draft KB article
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

            Log::info('AutoLearn: KB article created from resolved chat', [
                'chat_id' => $this->chatId,
                'title' => $parsed['title'],
                'project_id' => $project->id,
            ]);

        } catch (\Exception $e) {
            Log::error('AutoLearn failed', ['chat_id' => $this->chatId, 'error' => $e->getMessage()]);
        }
    }
}
