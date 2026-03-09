<?php
namespace App\Models;

use App\Events\NotificationCreated;
use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model {
    protected $fillable = ['user_id', 'type', 'title', 'description', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function getIsReadAttribute(): bool { return $this->read_at !== null; }

    protected static function booted(): void
    {
        static::created(function (AppNotification $notification) {
            broadcast(new NotificationCreated($notification));
        });
    }
}
