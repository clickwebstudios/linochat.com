<?php

namespace App\Models;

use App\Observers\KbArticleObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(KbArticleObserver::class)]
class KbArticle extends Model
{
    use HasFactory;


    protected $fillable = [
        'category_id',
        'project_id',
        'author_id',
        'title',
        'slug',
        'content',
        'status',
        'is_published',
        'views',
        'views_count',
        'helpful_count',
        'not_helpful_count',
        'source_url',
        'is_ai_generated',
        'embedding',
    ];

    protected $casts = [
        'embedding' => 'array',
        'views_count' => 'integer',
        'helpful_count' => 'integer',
        'not_helpful_count' => 'integer',
        'is_ai_generated' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(KbCategory::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
