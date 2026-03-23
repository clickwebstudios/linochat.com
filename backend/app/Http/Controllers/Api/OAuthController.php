<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OAuthAccessToken;
use App\Models\OAuthAuthorizationCode;
use App\Models\OAuthClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class OAuthController extends Controller
{
    // Available scopes with human-readable descriptions
    public const SCOPES = [
        'chats:read'     => 'View your chats and messages',
        'chats:write'    => 'Send messages to chats',
        'tickets:read'   => 'View your support tickets',
        'tickets:write'  => 'Create and update tickets on your behalf',
        'projects:read'  => 'View your projects',
        'knowledge:read' => 'Access your knowledge base articles',
        'users:read'     => 'View your team members',
    ];

    /**
     * GET /oauth/authorize
     * Returns client + scope info for the SPA to render the consent page.
     * The user must already be logged in (JWT) to reach this.
     */
    public function authorizeForm(Request $request)
    {
        $validated = $request->validate([
            'client_id'     => 'required|string',
            'redirect_uri'  => 'required|url',
            'response_type' => 'required|in:code',
            'scope'         => 'nullable|string',
            'state'         => 'nullable|string|max:256',
        ]);

        $client = OAuthClient::where('client_id', $validated['client_id'])
            ->where('is_active', true)
            ->first();

        if (! $client) {
            return response()->json(['success' => false, 'message' => 'Unknown client_id.'], 400);
        }

        if (! $this->redirectUriMatches($client->redirect_uri, $validated['redirect_uri'])) {
            return response()->json(['success' => false, 'message' => 'redirect_uri mismatch.'], 400);
        }

        $requestedScopes = $this->parseScopes($validated['scope'] ?? '');
        $allowedScopes   = $client->scopes ?? array_keys(self::SCOPES);
        $invalidScopes   = array_diff($requestedScopes, $allowedScopes, array_keys(self::SCOPES));

        if (! empty($invalidScopes)) {
            return response()->json(['success' => false, 'message' => 'Invalid scope(s): ' . implode(', ', $invalidScopes)], 400);
        }

        $scopeDescriptions = array_intersect_key(self::SCOPES, array_flip($requestedScopes));

        return response()->json([
            'success' => true,
            'data'    => [
                'client_name'  => $client->name,
                'client_id'    => $client->client_id,
                'redirect_uri' => $validated['redirect_uri'],
                'scopes'       => $scopeDescriptions,
                'state'        => $validated['state'] ?? null,
            ],
        ]);
    }

    /**
     * POST /oauth/authorize
     * User clicks Approve or Deny.
     */
    public function approveAuthorize(Request $request)
    {
        $validated = $request->validate([
            'client_id'     => 'required|string',
            'redirect_uri'  => 'required|url',
            'scope'         => 'nullable|string',
            'state'         => 'nullable|string|max:256',
            'approved'      => 'required|boolean',
        ]);

        $user   = Auth::user();
        $client = OAuthClient::where('client_id', $validated['client_id'])
            ->where('is_active', true)
            ->firstOrFail();

        if (! $this->redirectUriMatches($client->redirect_uri, $validated['redirect_uri'])) {
            return response()->json(['success' => false, 'message' => 'redirect_uri mismatch.'], 400);
        }

        $redirectUri = $validated['redirect_uri'];
        $state       = $validated['state'] ?? null;

        if (! $validated['approved']) {
            $url = $this->buildRedirectUrl($redirectUri, [
                'error'             => 'access_denied',
                'error_description' => 'The user denied access.',
                'state'             => $state,
            ]);
            return response()->json(['success' => true, 'redirect_to' => $url]);
        }

        $scopes = $this->parseScopes($validated['scope'] ?? '');

        $authCode = OAuthAuthorizationCode::create([
            'oauth_client_id' => $client->id,
            'user_id'         => $user->id,
            'code'            => Str::random(64),
            'scopes'          => $scopes,
            'state'           => $state,
            'expires_at'      => now()->addMinutes(10),
        ]);

        $url = $this->buildRedirectUrl($redirectUri, array_filter([
            'code'  => $authCode->code,
            'state' => $state,
        ]));

        return response()->json(['success' => true, 'redirect_to' => $url]);
    }

    /**
     * POST /oauth/token
     * Exchange authorization code for access token, or use client_credentials.
     */
    public function token(Request $request)
    {
        $grantType = $request->input('grant_type');

        return match ($grantType) {
            'authorization_code' => $this->handleAuthorizationCode($request),
            'client_credentials' => $this->handleClientCredentials($request),
            default              => response()->json([
                'error'             => 'unsupported_grant_type',
                'error_description' => 'Supported grant types: authorization_code, client_credentials',
            ], 400),
        };
    }

    /** POST /oauth/revoke — revoke an access token. */
    public function revoke(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $token = OAuthAccessToken::where('token', $request->input('token'))
            ->whereNull('revoked_at')
            ->first();

        if ($token) {
            $token->update(['revoked_at' => now()]);
        }

        // Always return 200 per RFC 7009
        return response()->json(['success' => true]);
    }

    /** GET /api/oauth/scopes — list available scopes. */
    public function scopes()
    {
        $scopes = collect(self::SCOPES)->map(fn ($desc, $id) => [
            'id'          => $id,
            'description' => $desc,
        ])->values();

        return response()->json(['success' => true, 'data' => $scopes]);
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private function handleAuthorizationCode(Request $request)
    {
        $data = $request->validate([
            'code'          => 'required|string',
            'client_id'     => 'required|string',
            'client_secret' => 'required|string',
            'redirect_uri'  => 'required|url',
        ]);

        $client = OAuthClient::where('client_id', $data['client_id'])
            ->where('client_secret', $data['client_secret'])
            ->where('is_active', true)
            ->first();

        if (! $client) {
            return response()->json(['error' => 'invalid_client'], 401);
        }

        $authCode = OAuthAuthorizationCode::where('code', $data['code'])
            ->where('oauth_client_id', $client->id)
            ->whereNull('used_at')
            ->first();

        if (! $authCode || ! $authCode->isValid()) {
            return response()->json(['error' => 'invalid_grant', 'error_description' => 'Authorization code is invalid or expired.'], 400);
        }

        if (! $this->redirectUriMatches($client->redirect_uri, $data['redirect_uri'])) {
            return response()->json(['error' => 'invalid_grant', 'error_description' => 'redirect_uri mismatch.'], 400);
        }

        // Mark code as used (one-time use)
        $authCode->update(['used_at' => now()]);

        $accessToken = $this->issueAccessToken($client, $authCode->user_id, $authCode->scopes ?? []);

        return response()->json($accessToken);
    }

    private function handleClientCredentials(Request $request)
    {
        $data = $request->validate([
            'client_id'     => 'required|string',
            'client_secret' => 'required|string',
        ]);

        $client = OAuthClient::where('client_id', $data['client_id'])
            ->where('client_secret', $data['client_secret'])
            ->where('is_active', true)
            ->first();

        if (! $client) {
            return response()->json(['error' => 'invalid_client'], 401);
        }

        // Client-credentials tokens are issued on behalf of the app owner
        $accessToken = $this->issueAccessToken($client, $client->user_id, $client->scopes ?? []);

        return response()->json($accessToken);
    }

    private function issueAccessToken(OAuthClient $client, int $userId, array $scopes): array
    {
        $expiresAt = now()->addDays(30);

        $token = OAuthAccessToken::create([
            'oauth_client_id' => $client->id,
            'user_id'         => $userId,
            'token'           => Str::random(80),
            'scopes'          => $scopes,
            'expires_at'      => $expiresAt,
        ]);

        return [
            'access_token' => $token->token,
            'token_type'   => 'Bearer',
            'expires_in'   => $expiresAt->diffInSeconds(now()),
            'scope'        => implode(' ', $scopes),
        ];
    }

    private function parseScopes(string $scope): array
    {
        return array_values(array_filter(explode(' ', trim($scope))));
    }

    private function redirectUriMatches(string $registered, string $requested): bool
    {
        // Strip trailing slash for comparison
        return rtrim($registered, '/') === rtrim($requested, '/');
    }

    private function buildRedirectUrl(string $base, array $params): string
    {
        $params = array_filter($params, fn ($v) => ! is_null($v));
        $sep    = str_contains($base, '?') ? '&' : '?';
        return $base . $sep . http_build_query($params);
    }
}
