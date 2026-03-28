<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContactForm extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'slug',
        'fields',
        'is_active',
        'submit_button_text',
        'success_message',
    ];

    protected $casts = [
        'fields' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $form) {
            if (empty($form->slug)) {
                $base = Str::slug($form->name);
                $slug = $base . '-' . Str::lower(Str::random(6));
                while (static::where('slug', $slug)->exists()) {
                    $slug = $base . '-' . Str::lower(Str::random(6));
                }
                $form->slug = $slug;
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
