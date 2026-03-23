<?php

namespace App\Jobs;

use App\Models\KbArticle;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use OpenAI;

class GenerateEmbeddingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(
        private int $articleId
    ) {}

    public function handle(): void
    {
        $article = KbArticle::find($this->articleId);
        if (!$article) return;

        $apiKey = config('openai.api_key');
        if (!$apiKey) return;

        // Build text to embed: title + content (truncated)
        $text = $article->title . "\n\n" . strip_tags($article->content ?? '');
        $text = substr($text, 0, 8000); // Stay within token budget

        try {
            $client = OpenAI::client($apiKey);

            $response = $client->embeddings()->create([
                'model' => 'text-embedding-3-small',
                'input' => $text,
            ]);

            $embedding = $response->embeddings[0]->embedding;

            $article->update(['embedding' => $embedding]);

            Log::info('Embedding generated for KB article', [
                'article_id' => $article->id,
                'dimensions' => count($embedding),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to generate embedding', [
                'article_id' => $this->articleId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
