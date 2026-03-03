<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Article extends Model {
    use HasFactory;
    protected $fillable = ['author_id', 'title', 'category', 'category_id', 'status', 'excerpt', 'content', 'tags', 'views', 'helpful'];
    protected $casts = ['tags' => 'array'];
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
