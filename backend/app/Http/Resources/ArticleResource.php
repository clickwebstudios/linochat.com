<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'category_id' => $this->category_id,
            'status' => $this->status,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'tags' => $this->tags ?? [],
            'views' => $this->views,
            'helpful' => $this->helpful,
            'author_id' => $this->author_id,
            'author' => $this->whenLoaded('author', fn() => new UserResource($this->author)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
