<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /**
     * Register a push notification device token.
     */
    public function register(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:512',
            'platform' => 'required|in:ios,android,web',
        ]);

        $user = $request->user();

        // Upsert: update if token exists (might belong to different user after re-login)
        DeviceToken::updateOrCreate(
            ['token' => $request->input('token')],
            ['user_id' => $user->id, 'platform' => $request->input('platform'), 'active' => true]
        );

        return response()->json(['success' => true, 'message' => 'Device registered']);
    }

    /**
     * Unregister a device token (logout / opt-out).
     */
    public function unregister(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:512',
        ]);

        DeviceToken::where('token', $request->input('token'))
            ->where('user_id', $request->user()->id)
            ->update(['active' => false]);

        return response()->json(['success' => true, 'message' => 'Device unregistered']);
    }
}
