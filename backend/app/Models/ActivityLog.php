<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = ['company_id', 'user_id', 'project_id', 'type', 'title', 'description'];

    public function company() { return $this->belongsTo(Company::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function project() { return $this->belongsTo(Project::class); }

    public static function log(string $type, string $title, ?string $description = null, array $context = []): self
    {
        return self::create([
            'company_id' => $context['company_id'] ?? null,
            'user_id' => $context['user_id'] ?? null,
            'project_id' => $context['project_id'] ?? null,
            'type' => $type,
            'title' => $title,
            'description' => $description,
        ]);
    }
}
