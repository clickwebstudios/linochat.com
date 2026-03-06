<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\Request;

class NotificationController extends Controller {
    public function index(Request $request) {
        $notifications = $request->user()->notifications()->latest()->paginate(50);
        $items = NotificationResource::collection($notifications->getCollection())->resolve();
        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }
    public function markRead(Request $request, AppNotification $notification) {
        $notification->update(['read_at' => now()]);
        return new NotificationResource($notification);
    }
    public function markAllRead(Request $request) {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
