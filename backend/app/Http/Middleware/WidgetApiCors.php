<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds CORS headers for widget API endpoints.
 * When a project has a website configured, restricts Access-Control-Allow-Origin
 * to that domain instead of returning '*'.
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
        $origin = $request->header('Origin');

        // Try to resolve per-project origin from the widget_id route param
        $widgetId = $request->route('widget_id');
        if ($widgetId && $origin) {
            $project = Project::where('widget_id', $widgetId)->first();
            if ($project && !empty($project->website)) {
                $projectHost = parse_url($project->website, PHP_URL_HOST);
                if (!$projectHost) {
                    $projectHost = parse_url('https://' . $project->website, PHP_URL_HOST);
                }
                if ($projectHost) {
                    $projectHost = strtolower($projectHost);
                    if (str_starts_with($projectHost, 'www.')) {
                        $projectHost = substr($projectHost, 4);
                    }

                    $originHost = strtolower(parse_url($origin, PHP_URL_HOST) ?? '');
                    if (str_starts_with($originHost, 'www.')) {
                        $originHost = substr($originHost, 4);
                    }

                    // Return the actual origin if it matches the project domain (or is a subdomain)
                    if ($originHost === $projectHost || str_ends_with($originHost, '.' . $projectHost)) {
                        return $origin;
                    }

                    // Mismatch — don't set CORS header (browser will block)
                    return null;
                }
            }
        }

        // Fallback: config-based or wildcard
        $allowed = config('cors.widget_allowed_origins', ['*']);
        if (in_array('*', $allowed, true)) {
            return '*';
        }
        return $origin && in_array($origin, $allowed, true) ? $origin : null;
    }
}
