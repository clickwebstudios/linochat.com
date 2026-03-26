<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use Illuminate\Http\Request;

class HelpController extends Controller
{
    /**
     * Get the help center project ID.
     */
    private function helpProjectId(): ?int
    {
        $id = config('services.help_center.project_id', env('HELP_CENTER_PROJECT_ID'));
        return $id ? (int) $id : null;
    }

    /**
     * List categories with article counts.
     */
    public function categories()
    {
        $projectId = $this->helpProjectId();
        if (!$projectId) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $categories = KbCategory::where('project_id', $projectId)
            ->withCount(['articles' => fn ($q) => $q->where('is_published', true)])
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'articles_count' => $c->articles_count,
            ]);

        return response()->json(['success' => true, 'data' => $categories]);
    }

    /**
     * List published articles with optional category filter.
     */
    public function articles(Request $request)
    {
        $projectId = $this->helpProjectId();
        if (!$projectId) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $query = KbArticle::whereHas('category', fn ($q) => $q->where('project_id', $projectId))
            ->where('is_published', true)
            ->with('category:id,name,slug');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->input('category')));
        }

        $articles = $query->orderByDesc('views_count')
            ->limit(50)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'excerpt' => \Str::limit(strip_tags($a->content), 150),
                'category' => $a->category?->name,
                'category_slug' => $a->category?->slug,
                'views' => $a->views_count ?? 0,
                'helpful' => $a->helpful_count ?? 0,
                'created_at' => $a->created_at,
            ]);

        return response()->json(['success' => true, 'data' => $articles]);
    }

    /**
     * Get single article by slug.
     */
    public function show(string $slug)
    {
        $projectId = $this->helpProjectId();
        if (!$projectId) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $article = KbArticle::whereHas('category', fn ($q) => $q->where('project_id', $projectId))
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with('category:id,name,slug')
            ->first();

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        // Increment view count
        $article->increment('views_count');

        // Get related articles from same category
        $related = KbArticle::where('category_id', $article->category_id)
            ->where('id', '!=', $article->id)
            ->where('is_published', true)
            ->limit(3)
            ->get(['id', 'title', 'slug']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'category' => $article->category?->name,
                'category_slug' => $article->category?->slug,
                'views' => $article->views_count,
                'helpful_count' => $article->helpful_count ?? 0,
                'not_helpful_count' => $article->not_helpful_count ?? 0,
                'created_at' => $article->created_at,
                'updated_at' => $article->updated_at,
                'related' => $related,
            ],
        ]);
    }

    /**
     * Submit feedback on an article.
     */
    public function feedback(Request $request, int $id)
    {
        $request->validate(['helpful' => 'required|boolean']);

        $article = KbArticle::find($id);
        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        if ($request->input('helpful')) {
            $article->increment('helpful_count');
        } else {
            $article->increment('not_helpful_count');
        }

        return response()->json(['success' => true, 'message' => 'Thank you for your feedback']);
    }

    /**
     * Search published help articles.
     */
    public function search(Request $request)
    {
        $request->validate(['query' => 'required|string|min:2|max:200']);

        $projectId = $this->helpProjectId();
        if (!$projectId) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $query = $request->input('query');

        $articles = KbArticle::whereHas('category', fn ($q) => $q->where('project_id', $projectId))
            ->where('is_published', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('content', 'like', "%{$query}%");
            })
            ->with('category:id,name,slug')
            ->limit(20)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'excerpt' => \Str::limit(strip_tags($a->content), 150),
                'category' => $a->category?->name,
                'category_slug' => $a->category?->slug,
            ]);

        return response()->json(['success' => true, 'data' => $articles]);
    }
}
