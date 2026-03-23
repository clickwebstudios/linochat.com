<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    protected $fillable = [
        'project_id', 'chat_id', 'model',
        'input_tokens', 'output_tokens',
        'base_cost', 'charged_cost',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }
}
