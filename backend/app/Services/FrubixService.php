<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FrubixService
{
    /**
     * Try a request; on 401 refresh the token, persist it, and retry.
     */
    private static function requestWithRefresh(array $integrationConfig, callable $makeRequest, ?Project $project = null): \Illuminate\Http\Client\Response
    {
        $response = $makeRequest($integrationConfig['access_token']);

        if ($response->status() === 401 && ($integrationConfig['refresh_token'] ?? null)) {
            $newTokens = self::refreshToken($integrationConfig, $project);
            if ($newTokens) {
                $response = $makeRequest($newTokens['access_token']);
            }
        }

        return $response;
    }

    /**
     * Create a lead using OAuth access token.
     */
    public static function createLead(array $integrationConfig, array $leadData, ?Project $project = null): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        if (!($integrationConfig['access_token'] ?? null)) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = self::requestWithRefresh($integrationConfig, function ($token) use ($baseUrl, $leadData) {
            return Http::withToken($token)->post("{$baseUrl}/api/v1/leads", $leadData);
        }, $project);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to create Frubix lead: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Search clients by phone or email.
     */
    public static function searchClients(array $integrationConfig, array $params, ?Project $project = null): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        if (!($integrationConfig['access_token'] ?? null)) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = self::requestWithRefresh($integrationConfig, function ($token) use ($baseUrl, $params) {
            return Http::withToken($token)->get("{$baseUrl}/api/v1/clients", $params);
        }, $project);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to search Frubix clients: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Get schedule entries with optional filters.
     */
    public static function getSchedule(array $integrationConfig, array $params, ?Project $project = null): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        if (!($integrationConfig['access_token'] ?? null)) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = self::requestWithRefresh($integrationConfig, function ($token) use ($baseUrl, $params) {
            return Http::withToken($token)->get("{$baseUrl}/api/v1/schedule", $params);
        }, $project);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to get Frubix schedule: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Create a new appointment.
     */
    public static function createAppointment(array $integrationConfig, array $data, ?Project $project = null): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        if (!($integrationConfig['access_token'] ?? null)) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = self::requestWithRefresh($integrationConfig, function ($token) use ($baseUrl, $data) {
            return Http::withToken($token)->post("{$baseUrl}/api/v1/schedule", $data);
        }, $project);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to create Frubix appointment: ' . $response->body());
        }

        return $response->json('data') ?? $response->json();
    }

    /**
     * Update an existing appointment.
     */
    public static function updateAppointment(array $integrationConfig, int $id, array $data, ?Project $project = null): array
    {
        $baseUrl = rtrim($integrationConfig['url'] ?? 'https://frubix.com', '/');

        if (!($integrationConfig['access_token'] ?? null)) {
            throw new \RuntimeException('Frubix access token not configured');
        }

        $response = self::requestWithRefresh($integrationConfig, function ($token) use ($baseUrl, $id, $data) {
            return Http::withToken($token)->patch("{$baseUrl}/api/v1/schedule/{$id}", $data);
        }, $project);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to update Frubix appointment: ' . $response->body());
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
     * Refresh an expired access token and persist new tokens to the project.
     */
    public static function refreshToken(array $integrationConfig, ?Project $project = null): ?array
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
                $tokens = $response->json();

                // Persist refreshed tokens back to the project
                if ($project) {
                    $integrations = $project->integrations ?? [];
                    $integrations['frubix'] = array_merge(
                        $integrations['frubix'] ?? [],
                        [
                            'access_token'  => $tokens['access_token'],
                            'refresh_token' => $tokens['refresh_token'] ?? $integrationConfig['refresh_token'],
                        ]
                    );
                    $project->update(['integrations' => $integrations]);
                    Log::info('Frubix tokens refreshed and persisted', ['project_id' => $project->id]);
                }

                return $tokens;
            }
        } catch (\Exception $e) {
            Log::error('Frubix token refresh failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
