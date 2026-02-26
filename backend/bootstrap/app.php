<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
               $middleware->prepend(\App\Http\Middleware\WidgetCorsHeaders::class);


        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
        
        // Force JSON responses for all API routes
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON response for all API exceptions
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*') || $request->wantsJson();
        });
        
        // Custom JSON response for validation errors
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        });
        
        // Custom JSON response for authentication errors
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        });
        
        // Custom JSON response for not found (except widget assets — they need JS/CSS for ORB)
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/widget-assets/widget.js') || $request->is('api/widget-assets/style.css')
                || $request->is('widget') || $request->is('widget/style.css')) {
                $isCss = str_contains($request->path(), 'style.css');
                return response($isCss ? '/* Not found */' : '// Not found', 404)
                    ->header('Content-Type', $isCss ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8')
                    ->header('Cross-Origin-Resource-Policy', 'cross-origin');
            }
            return response()->json([
                'success' => false,
                'message' => 'Resource not found',
            ], 404);
        });
        
        // Custom JSON response for method not allowed
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Method not allowed',
            ], 405);
        });
        
        // Generic JSON response for any other exception in API
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                $statusCode = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException
                    ? $e->getStatusCode()
                    : 500;

                $response = response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'error' => class_basename($e),
                ], $statusCode);

                if ($request->is('widget*') || $request->is('api/widget*')) {
                    $response->header('Access-Control-Allow-Origin', '*');
                }

                return $response;
            }
        });
    })->create();
