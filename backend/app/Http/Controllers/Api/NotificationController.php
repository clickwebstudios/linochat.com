<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Request;

class NotificationController extends Controller {
    public function index(Request $request) {
        $notifications = $request->user()->appNotifications()->latest()->paginate(50);
        $items = NotificationResource::collection($notifications->getCollection())->resolve();
        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function markRead(Request $request, AppNotification $notification) {
        $notification->update(['read_at' => now()]);
        return response()->json(['success' => true, 'data' => (new NotificationResource($notification))->resolve()]);
    }

    public function markAllRead(Request $request) {
        $request->user()->appNotifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true, 'message' => 'All notifications marked as read']);
    }
}
