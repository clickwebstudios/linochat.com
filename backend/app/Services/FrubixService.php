<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FrubixService
{
    /**
     * Create a lead using OAuth access token.
     */
    public static function createLead(array $integrationConfig, array $leadData): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        // Try with current access token
        $response = Http::withToken($accessToken)
            ->post("{$baseUrl}/api/v1/leads", $leadData);

        // If 401, try refreshing the token
        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->post("{$baseUrl}/api/v1/leads", $leadData);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to create Frubix lead: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Exchange authorization code for tokens.
     */
    public static function exchangeCode(string $baseUrl, string $clientId, string $clientSecret, string $code, string $redirectUri): array
    {
        $response = Http::asForm()->post(rtrim($baseUrl, '/') . '/oauth/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri'  => $redirectUri,
            'code'          => $code,
        ]);

        if (!$response->successful()) {
            Log::error('Frubix token exchange failed', ['body' => $response->body()]);
            throw new \RuntimeException('Failed to exchange Frubix authorization code');
        }

        return $response->json();
    }

    /**
     * Refresh an expired access token.
     */
    public static function refreshToken(array $integrationConfig): ?array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        try {
            $response = Http::asForm()->post("{$baseUrl}/oauth/token", [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $integrationConfig['refresh_token'],
                'client_id'     => config('services.frubix.client_id'),
                'client_secret' => config('services.frubix.client_secret'),
            ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error('Frubix token refresh failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
