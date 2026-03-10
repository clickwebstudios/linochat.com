<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingDocument extends Model
{
    protected $fillable = [
        'project_id',
        'original_name',
        'file_path',
        'file_size',
        'file_type',
        'status',
        'kb_article_id',
        'error_message',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function kbArticle()
    {
        return $this->belongsTo(KbArticle::class, 'kb_article_id');
    }
}
