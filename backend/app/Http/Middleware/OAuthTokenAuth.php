<?php

namespace App\Http\Middleware;

use App\Models\OAuthAccessToken;
use Closure;
use Illuminate\Http\Request;

/**
 * Authenticates requests made by third-party apps using OAuth access tokens.
 * Attaches the resolved User and token scopes to the request.
 */
class OAuthTokenAuth
{
    public function handle(Request $request, Closure $next, string ...$requiredScopes)
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return response()->json(['error' => 'missing_token'], 401);
        }

        $token = OAuthAccessToken::where('token', $bearerToken)
            ->whereNull('revoked_at')
            ->with('user')
            ->first();

        if (! $token || ! $token->isValid()) {
            return response()->json(['error' => 'invalid_token', 'error_description' => 'Token is expired or revoked.'], 401);
        }

        // Check required scopes
        $tokenScopes = $token->scopes ?? [];
        foreach ($requiredScopes as $scope) {
            if (! in_array($scope, $tokenScopes, true)) {
                return response()->json([
                    'error'             => 'insufficient_scope',
                    'error_description' => "Token missing required scope: {$scope}",
                ], 403);
            }
        }

        // Make user available via auth() and $request->user()
        auth()->setUser($token->user);
        $request->attributes->set('oauth_token', $token);
        $request->attributes->set('oauth_scopes', $tokenScopes);

        return $next($request);
    }
}
