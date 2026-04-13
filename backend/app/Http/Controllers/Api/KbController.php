<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateKbFromWebsiteJob;
use App\Models\KbCategory;
use App\Models\KbArticle;
use App\Models\Project;
use App\Services\KbGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KbController extends Controller
{
    /**
     * Get categories for project
     */
    public function categories(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        
        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $categories = KbCategory::where('project_id', $project_id)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get articles for category
     */
    public function articles(Request $request, string $project_id, string $category_id)
    {
        $user = auth('api')->user();
        
        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $articles = KbArticle::where('category_id', $category_id)
            ->whereHas('category', fn ($q) => $q->where('project_id', $project_id))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'category_id' => $article->category_id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'content' => $article->content,
                    'is_published' => (bool) $article->is_published,
                    'views_count' => $article->views_count,
                    'helpful_count' => $article->helpful_count,
                    'created_at' => $article->created_at?->toISOString(),
                    'updated_at' => $article->updated_at?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $articles,
        ]);
    }

    /**
     * Get single article
     */
    public function article(Request $request, string $project_id, string $article_id)
    {
        $user = auth('api')->user();
        
        $article = KbArticle::where('id', $article_id)
            ->whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->first();

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $article,
        ]);
    }

    /**
     * Create category
     */
    public function createCategory(Request $request, string $project_id)
    {
        $user = auth('api')->user();

        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn ($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = KbCategory::create([
            'project_id' => $project_id,
            'name' => $validated['name'],
            'slug' => \Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
        ], 201);
    }

    /**
     * Create article
     */
    public function createArticle(Request $request, string $project_id, string $category_id)
    {
        $user = auth('api')->user();
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_published' => 'boolean',
        ]);

        $article = KbArticle::create([
            'category_id' => $category_id,
            'project_id' => $project_id,
            'author_id' => $user?->id ?? 1,
            'title' => $validated['title'],
            'slug' => \Str::slug($validated['title']),
            'content' => $validated['content'],
            'is_published' => $validated['is_published'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $article,
        ], 201);
    }

    /**
     * Update article
     */
    public function updateArticle(Request $request, string $project_id, string $article_id)
    {
        $user = auth('api')->user();

        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $article = KbArticle::where('id', $article_id)
            ->whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->first();

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'is_published' => 'sometimes|boolean',
            'category_id' => 'sometimes|exists:kb_categories,id',
        ]);

        // Update slug if title changed
        if (isset($validated['title'])) {
            $validated['slug'] = \Str::slug($validated['title']);
        }

        // Handle status field for consistency
        if (isset($validated['is_published'])) {
            $validated['status'] = $validated['is_published'] ? 'published' : 'draft';
        }

        $article->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Article updated successfully',
            'data' => $article->fresh(),
        ]);
    }

    /**
     * Delete article
     */
    public function deleteArticle(Request $request, string $project_id, string $article_id)
    {
        $user = auth('api')->user();

        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $article = KbArticle::where('id', $article_id)
            ->whereHas('category', fn($q) => $q->where('project_id', $project_id))
            ->first();

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully',
        ]);
    }

    /**
     * Get single article by ID (looks up project from category)
     */
    public function articleById(Request $request, string $article_id)
    {
        $user = auth('api')->user();

        $article = KbArticle::with('category')
            ->where('id', $article_id)
            ->first();

        if (!$article || !$article->category) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($article->category->project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $article->category->project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Article not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'category_id' => $article->category_id,
                'category' => $article->category ? ['id' => $article->category->id, 'name' => $article->category->name] : null,
                'is_published' => (bool) $article->is_published,
                'views_count' => $article->views_count,
                'helpful_count' => $article->helpful_count,
                'created_at' => $article->created_at?->toISOString(),
                'updated_at' => $article->updated_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get all articles for project
     */
    public function allArticles(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        
        // Superadmin can access any project
        if ($user->role === 'superadmin') {
            $project = Project::find($project_id);
        } else {
            // Check access for regular users
            $project = Project::where('id', $project_id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
                })
                ->first();
        }

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $articles = KbArticle::whereHas('category', function($q) use ($project_id) {
                $q->where('project_id', $project_id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $articles,
        ]);
    }

    /**
     * Generate KB articles from project website
     */
    public function generateFromWebsite(Request $request, string $project_id, KbGeneratorService $kbGenerator)
    {
        $user = auth('api')->user();

        // Check access - только владелец может генерировать KB
        $project = Project::where('id', $project_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
            })
            ->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        // Проверяем, что у проекта есть website
        if (empty($project->website)) {
            return response()->json([
                'success' => false,
                'message' => 'Project has no website URL configured',
            ], 422);
        }

        // Определяем режим выполнения (sync или async)
        $async = $request->input('async', true);

        if ($async) {
            // Запускаем в очереди
            GenerateKbFromWebsiteJob::dispatch($project, $user->id);

            Log::info('KB generation job dispatched', [
                'project_id' => $project->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'KB generation started. This may take a few minutes.',
                'data' => [
                    'status' => 'processing',
                    'project_id' => $project->id,
                ],
            ]);
        }

        // Синхронный режим (для тестирования)
        $result = $kbGenerator->generateFromWebsite($project->id, $project->website, $user->id);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'KB articles generated successfully',
                'data' => $result['data'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Failed to generate KB articles',
        ], 500);
    }

    /**
     * Get KB generation status for project
     */
    public function generationStatus(Request $request, string $project_id, KbGeneratorService $kbGenerator)
    {
        $user = auth('api')->user();

        // Check access
        $project = Project::where('id', $project_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
            })
            ->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $status = $kbGenerator->getGenerationStatus($project->id);

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Delete AI-generated articles
     */
    public function deleteAiArticles(Request $request, string $project_id, KbGeneratorService $kbGenerator)
    {
        $user = auth('api')->user();

        // Check access - только владелец может удалять
        $project = Project::where('id', $project_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found or unauthorized'], 404);
        }

        $deletedCount = $kbGenerator->deleteAiGeneratedArticles($project->id);

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deletedCount} AI-generated articles",
            'data' => [
                'deleted_count' => $deletedCount,
            ],
        ]);
    }

    /**
     * Generate a single KB article from URL or description
     * POST /api/projects/{project_id}/kb/categories/{category_id}/generate-article
     */
    public function generateSingleArticle(Request $request, string $project_id, string $category_id, KbGeneratorService $kbGenerator)
    {
        $user = auth('api')->user();

        // Check access
        $project = Project::where('id', $project_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
            })
            ->first();

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        // Validate request
        $validated = $request->validate([
            'source_type' => 'required|string|in:url,description',
            'source' => 'required|string|min:3|max:10000',
        ]);

        $result = $kbGenerator->generateSingleArticle(
            (int) $project_id,
            $category_id,
            $validated['source_type'],
            $validated['source'],
            $user->id
        );

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Article generated successfully',
                'data' => $result['data'],
            ], 201);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Failed to generate article',
        ], 500);
    }

    /**
     * Search KB articles for AI context
     * POST /api/projects/{project_id}/kb/search
     */
    public function search(Request $request, string $project_id)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:1|max:500',
            'limit' => 'integer|min:1|max:10',
        ]);

        $query = $validated['query'];
        $limit = $validated['limit'] ?? 3;

        // Pre-filter articles with DB LIKE to avoid loading entire table into memory
        $articles = KbArticle::whereHas('category', function ($q) use ($project_id) {
                $q->where('project_id', $project_id);
            })
            ->where('is_published', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', '%' . $query . '%')
                  ->orWhere('content', 'like', '%' . $query . '%');
            })
            ->with('category')
            ->limit(100)
            ->get();

        if ($articles->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'query' => $query,
                    'results' => [],
                    'count' => 0,
                ],
            ]);
        }

        // Search scoring
        $queryLower = strtolower($query);
        $queryWords = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $queryLower)));
        $stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our'];
        $queryWords = array_filter($queryWords, fn($w) => strlen($w) > 2 && !in_array($w, $stopWords));
        
        $results = [];

        foreach ($articles as $article) {
            $score = 0;
            $title = strtolower($article->title);
            $content = strtolower(strip_tags($article->content));
            $category = strtolower($article->category->name ?? '');
            
            // Title matching (high weight)
            foreach ($queryWords as $word) {
                if (strpos($title, $word) !== false) {
                    $score += 10;
                }
            }
            
            // Category matching (medium weight)
            foreach ($queryWords as $word) {
                if (strpos($category, $word) !== false) {
                    $score += 5;
                }
            }
            
            // Content matching
            foreach ($queryWords as $word) {
                $count = substr_count($content, $word);
                if ($count > 0) {
                    $score += min($count * 2, 10); // Cap at 10 points per word
                }
            }
            
            // Exact phrase match (very high weight)
            if (strpos($title, $queryLower) !== false) {
                $score += 20;
            }
            if (strpos($content, $queryLower) !== false) {
                $score += 10;
            }
            
            if ($score > 0) {
                $results[] = [
                    'article' => [
                        'id' => $article->id,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'category' => $article->category ? [
                            'id' => $article->category->id,
                            'name' => $article->category->name,
                        ] : null,
                        'excerpt' => substr(strip_tags($article->content), 0, 200) . '...',
                        'views_count' => $article->views_count,
                        'is_published' => $article->is_published,
                    ],
                    'score' => $score,
                ];
            }
        }

        // Sort by score and limit results
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);
        $results = array_slice($results, 0, $limit);

        return response()->json([
            'success' => true,
            'data' => [
                'query' => $query,
                'results' => $results,
                'count' => count($results),
            ],
        ]);
    }
}
