<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send push notification to specific user IDs.
     */
    public static function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        if (empty($userIds)) return;

        $tokens = DeviceToken::whereIn('user_id', $userIds)
            ->where('active', true)
            ->pluck('token')
            ->unique()
            ->values()
            ->all();

        if (empty($tokens)) return;

        static::sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Send push notification to Expo push tokens.
     */
    public static function sendToTokens(array $tokens, string $title, string $body, array $data = []): void
    {
        // Expo accepts batches of up to 100 notifications
        $messages = [];
        foreach ($tokens as $token) {
            // Only send to valid Expo push tokens
            if (!str_starts_with($token, 'ExponentPushToken[') && !str_starts_with($token, 'ExpoPushToken[')) {
                continue;
            }
            $messages[] = [
                'to' => $token,
                'title' => $title,
                'body' => mb_substr($body, 0, 200),
                'sound' => 'default',
                'data' => $data,
                'priority' => 'high',
                'channelId' => 'default',
            ];
        }

        if (empty($messages)) return;

        // Send in batches of 100
        foreach (array_chunk($messages, 100) as $batch) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])
                    ->post(self::EXPO_PUSH_URL, $batch);

                if (!$response->successful()) {
                    Log::warning('Expo push failed', ['status' => $response->status(), 'body' => $response->body()]);
                }

                // Mark invalid tokens as inactive
                $responseData = $response->json('data') ?? [];
                foreach ($responseData as $i => $result) {
                    if (($result['status'] ?? '') === 'error' && ($result['details']['error'] ?? '') === 'DeviceNotRegistered') {
                        DeviceToken::where('token', $batch[$i]['to'])->update(['active' => false]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Expo push exception', ['error' => $e->getMessage()]);
            }
        }
    }
}
