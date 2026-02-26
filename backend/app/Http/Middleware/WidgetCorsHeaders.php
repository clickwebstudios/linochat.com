<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds CORS headers for widget script/CSS responses.
 * Required for cross-origin embedding on customer sites (crossOrigin="anonymous").
 * Uses config('cors.widget_allowed_origins') - ['*'] for all, or list specific domains.
 */
class WidgetCorsHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $isWidget = $request->is('widget') || $request->is('widget/') || $request->is('widget/*')
            || $request->is('api/widget-assets/*') || $request->is('widget/style.css');

        if (!$isWidget) {
            return $next($request);
        }

        $origin = $this->resolveAllowedOrigin($request);

        if ($request->isMethod('OPTIONS')) {
            $headers = [
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Max-Age' => '86400',
                'Cross-Origin-Resource-Policy' => 'cross-origin',
                'X-Content-Type-Options' => 'nosniff',
            ];
            if ($origin) {
                $headers['Access-Control-Allow-Origin'] = $origin;
            }
            return response('', 204)->withHeaders($headers);
        }

        $response = $next($request);

        if ($origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        $response->headers->set('Access-Control-Max-Age', '86400');
        $response->headers->set('Cross-Origin-Resource-Policy', 'cross-origin');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Vary', 'Origin'); // Prevent caches from serving wrong CORS
        $response->headers->remove('Set-Cookie'); // Avoid credential confusion in cross-origin
        if (!str_contains($request->path(), 'style.css')) {
            $response->headers->set('Content-Type', 'application/javascript; charset=utf-8');
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
