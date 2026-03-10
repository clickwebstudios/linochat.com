<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FrubixService
{
    private string $baseUrl;
    private string $email;
    private string $password;

    public function __construct(string $baseUrl, string $email, string $password)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->email = $email;
        $this->password = $password;
    }

    public static function fromProjectIntegrations(array $integrations): ?self
    {
        $frubix = $integrations['frubix'] ?? null;

        if (!$frubix || empty($frubix['enabled']) || empty($frubix['email']) || empty($frubix['password'])) {
            return null;
        }

        return new self(
            $frubix['url'] ?? 'https://frubix.com',
            $frubix['email'],
            $frubix['password'],
        );
    }

    private function getAccessToken(): string
    {
        $cacheKey = 'frubix_token_' . md5($this->email);

        return Cache::remember($cacheKey, now()->addMinutes(55), function () {
            $response = Http::post("{$this->baseUrl}/api/auth/login", [
                'email'    => $this->email,
                'password' => $this->password,
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Frubix auth failed: ' . $response->body());
            }

            return $response->json('data.token') ?? $response->json('token');
        });
    }

    public function testConnection(): bool
    {
        try {
            // Clear cached token to force fresh login
            Cache::forget('frubix_token_' . md5($this->email));
            $this->getAccessToken();
            return true;
        } catch (\Throwable $e) {
            Log::warning('Frubix connection test failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function createLead(array $data): array
    {
        $token = $this->getAccessToken();

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/api/leads", $data);

        if (!$response->successful()) {
            // Token might be expired, clear cache and retry once
            if ($response->status() === 401) {
                Cache::forget('frubix_token_' . md5($this->email));
                $token = $this->getAccessToken();
                $response = Http::withToken($token)
                    ->post("{$this->baseUrl}/api/leads", $data);
            }

            if (!$response->successful()) {
                throw new \RuntimeException('Failed to create Frubix lead: ' . $response->body());
            }
        }

        return $response->json('data') ?? $response->json();
    }
}
