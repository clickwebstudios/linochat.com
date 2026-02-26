<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KbCategory extends Model
{
    use HasFactory;


    protected $fillable = [
        'project_id',
        'name',
        'slug',
        'description',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function articles()
    {
        return $this->hasMany(KbArticle::class, 'category_id');
    }
}
