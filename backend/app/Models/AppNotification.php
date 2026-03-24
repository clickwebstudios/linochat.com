<?php
namespace App\Models;

use App\Events\NotificationCreated;
use App\Services\PushNotificationService;
use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model {
    protected $fillable = ['user_id', 'type', 'title', 'description', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function getIsReadAttribute(): bool { return $this->read_at !== null; }

    protected static function booted(): void
    {
        static::created(function (AppNotification $notification) {
            // WebSocket broadcast (real-time in browser)
            broadcast(new NotificationCreated($notification));

            // Push notification (mobile devices)
            try {
                PushNotificationService::sendToUsers(
                    [$notification->user_id],
                    $notification->title,
                    $notification->description ?? '',
                    ['type' => $notification->type, 'notification_id' => $notification->id]
                );
            } catch (\Throwable $e) {
                \Log::warning('Push notification failed', ['error' => $e->getMessage()]);
            }
        });
    }
}
