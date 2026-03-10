<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiSettingsVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'settings',
        'status',
        'version_number',
        'published_at',
        'published_by',
        'created_by',
    ];

    protected $casts = [
        'settings' => 'array',
        'published_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }
}
