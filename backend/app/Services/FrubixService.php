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
     * Search clients by phone or email.
     */
    public static function searchClients(array $integrationConfig, array $params): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = Http::withToken($accessToken)
            ->get("{$baseUrl}/api/v1/clients", $params);

        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->get("{$baseUrl}/api/v1/clients", $params);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to search Frubix clients: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Get schedule entries with optional filters.
     */
    public static function getSchedule(array $integrationConfig, array $params): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = Http::withToken($accessToken)
            ->get("{$baseUrl}/api/v1/schedule", $params);

        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->get("{$baseUrl}/api/v1/schedule", $params);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to get Frubix schedule: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Create a new appointment.
     */
    public static function createAppointment(array $integrationConfig, array $data): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = Http::withToken($accessToken)
            ->post("{$baseUrl}/api/v1/schedule", $data);

        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->post("{$baseUrl}/api/v1/schedule", $data);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to create Frubix appointment: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Update an existing appointment.
     */
    public static function updateAppointment(array $integrationConfig, int $id, array $data): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = Http::withToken($accessToken)
            ->patch("{$baseUrl}/api/v1/schedule/{$id}", $data);

        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->patch("{$baseUrl}/api/v1/schedule/{$id}", $data);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to update Frubix appointment: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Send a message to Frubix.
     */
    public static function sendMessage(array $integrationConfig, array $data): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
        $accessToken = $integrationConfig['access_token'] ?? null;
        $refreshToken = $integrationConfig['refresh_token'] ?? null;

        if (!$accessToken) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = Http::withToken($accessToken)
            ->post("{$baseUrl}/api/v1/messages", $data);

        if ($response->status() === 401 && $refreshToken) {
            $newTokens = self::refreshToken($integrationConfig);
            if ($newTokens) {
                $response = Http::withToken($newTokens['access_token'])
                    ->post("{$baseUrl}/api/v1/messages", $data);
            }
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to send Frubix message: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Get the connected company/organization info from the OAuth token.
     */
    public static function getCompanyInfo(array $integrationConfig): ?array
    {
        $accessToken = $integrationConfig['access_token'] ?? null;
        if (!$accessToken) return null;

        try {
            $parts = explode('.', $accessToken);
            if (count($parts) !== 3) return null;

            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
            $clientId = $payload['aud'] ?? null;
            if (is_array($clientId)) $clientId = $clientId[0] ?? null;

            if (!$clientId) return null;

            // Look up the OAuth client to find the company owner
            $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');
            $response = Http::withToken($accessToken)
                ->get("{$baseUrl}/api/v1/company");

            if ($response->successful()) {
                $data = $response->json('data') ?? $response->json();
                return [
                    'company_name' => $data['name'] ?? $data['company_name'] ?? null,
                    'company_id' => $data['id'] ?? $data['company_id'] ?? null,
                    'user_name' => $data['user_name'] ?? null,
                    'user_email' => $data['user_email'] ?? null,
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Failed to fetch Frubix company info', ['error' => $e->getMessage()]);
        }

        return null;
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
