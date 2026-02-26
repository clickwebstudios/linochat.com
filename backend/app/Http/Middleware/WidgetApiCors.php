<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds CORS headers for widget API endpoints.
 * Uses config('cors.widget_allowed_origins') - ['*'] for all, or list specific domains.
 */
class WidgetApiCors
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->is('api/widget/*')) {
            return $next($request);
        }

        $origin = $this->resolveAllowedOrigin($request);

        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204)
                ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning')
                ->header('Access-Control-Max-Age', '86400');
            if ($origin) {
                $response->header('Access-Control-Allow-Origin', $origin);
            }
            return $response;
        }

        $response = $next($request);
        if ($origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Expose-Headers', 'Content-Type');
        }

        return $response;
    }

    private function resolveAllowedOrigin(Request $request): ?string
    {
        $allowed = config('cors.widget_allowed_origins', ['*']);
        if (in_array('*', $allowed, true)) {
            return '*';
        }
        $origin = $request->header('Origin');
        return $origin && in_array($origin, $allowed, true) ? $origin : null;
    }
}
