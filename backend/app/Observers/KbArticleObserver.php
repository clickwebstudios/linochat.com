<?php

namespace App\Observers;

use App\Jobs\GenerateEmbeddingJob;
use App\Models\KbArticle;

class KbArticleObserver
{
    public function saved(KbArticle $article): void
    {
        // Generate embedding when article is published or content changes
        if ($article->is_published && ($article->wasChanged('content') || $article->wasChanged('title') || $article->wasChanged('is_published'))) {
            GenerateEmbeddingJob::dispatch($article->id)->delay(now()->addSeconds(5));
        }
    }

    public function created(KbArticle $article): void
    {
        // Also embed newly created published articles
        if ($article->is_published) {
            GenerateEmbeddingJob::dispatch($article->id)->delay(now()->addSeconds(5));
        }
    }
}
