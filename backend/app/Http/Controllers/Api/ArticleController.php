<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Http\Resources\ArticleResource;
use Illuminate\Http\Request;

class ArticleController extends Controller {
    public function index(Request $request) {
        $articles = Article::query()
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->search, fn($q, $v) => $q->where('title', 'like', "%$v%"))
            ->with('author')
            ->latest()
            ->paginate(50);
        return ArticleResource::collection($articles);
    }
    public function show(Article $article) { return new ArticleResource($article->load('author')); }
    public function store(Request $request) {
        $data = $request->validate(['title' => 'required|string', 'category' => 'nullable|string', 'category_id' => 'nullable|string', 'status' => 'sometimes|in:published,draft', 'excerpt' => 'nullable|string', 'content' => 'nullable|string', 'tags' => 'nullable|array']);
        $article = Article::create(array_merge($data, ['author_id' => $request->user()->id]));
        return new ArticleResource($article->load('author'));
    }
    public function update(Request $request, Article $article) {
        $article->update($request->validate(['title' => 'sometimes|string', 'category' => 'nullable|string', 'status' => 'sometimes|in:published,draft', 'excerpt' => 'nullable|string', 'content' => 'nullable|string', 'tags' => 'nullable|array']));
        return new ArticleResource($article->load('author'));
    }
    public function destroy(Article $article) { $article->delete(); return response()->json(['message' => 'Article deleted']); }
}
