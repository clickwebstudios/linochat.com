<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class FrubixService
{
    private function getAccessToken(string $url, string $clientId, string $clientSecret): string
    {
        $cacheKey = "frubix_token_{$clientId}";

        return Cache::remember($cacheKey, now()->addMinutes(55), function () use ($url, $clientId, $clientSecret) {
            $response = Http::asForm()->post(rtrim($url, '/') . '/oauth/token', [
                'grant_type'    => 'client_credentials',
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
                'scope'         => 'leads:read leads:write',
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Failed to get Frubix access token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    public function testConnection(string $url, string $clientId, string $clientSecret): bool
    {
        try {
            $this->getAccessToken($url, $clientId, $clientSecret);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function createLead(string $url, string $clientId, string $clientSecret, array $data): array
    {
        $token = $this->getAccessToken($url, $clientId, $clientSecret);

        $response = Http::withToken($token)
            ->post(rtrim($url, '/') . '/api/v1/leads', $data);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to create Frubix lead: ' . $response->body());
        }

        return $response->json('data');
    }
}
