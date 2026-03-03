<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class WidgetCors
{
    public function handle(Request $request, Closure $next)
    {
        // Handle CORS preflight
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin',  '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With')
                ->header('Access-Control-Max-Age',       '86400');
        }

        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin',  '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');

        return $response;
    }
}
