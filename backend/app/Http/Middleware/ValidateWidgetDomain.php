<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts widget API access to the domain configured in the project's website field.
 * Allows subdomains: project "example.com" permits "www.example.com", "app.example.com".
 * Legacy projects with no website set are allowed from any domain.
 */
class ValidateWidgetDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $widgetId = $request->route('widget_id');
        if (!$widgetId) {
            return $next($request);
        }

        $project = Project::where('widget_id', $widgetId)->first();
        if (!$project) {
            return response()->json(['error' => 'Widget not found'], 404);
        }

        // Legacy projects with no website — allow all
        if (empty($project->website)) {
            return $next($request);
        }

        $requestDomain = $this->extractDomain($request->header('Origin'))
            ?? $this->extractDomain($request->header('Referer'));

        // No origin/referer (e.g. server-side requests) — allow
        if (!$requestDomain) {
            return $next($request);
        }

        $projectDomain = $this->extractDomain($project->website);
        if (!$projectDomain) {
            return $next($request);
        }

        // Check exact match or subdomain match
        if ($requestDomain === $projectDomain || str_ends_with($requestDomain, '.' . $projectDomain)) {
            return $next($request);
        }

        return response()->json(['error' => 'Domain not authorized'], 403);
    }

    /**
     * Extract bare domain from a URL: strips protocol, www., path, port.
     */
    private function extractDomain(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);
        if (!$host) {
            // Maybe it's just a bare domain
            $host = parse_url('https://' . $url, PHP_URL_HOST);
        }
        if (!$host) {
            return null;
        }

        $host = strtolower($host);

        // Strip www. prefix
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        return $host;
    }
}
