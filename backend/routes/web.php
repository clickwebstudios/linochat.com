<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WidgetEmbedController;
use App\Http\Controllers\WidgetLoaderController;

Route::get('/', function () {
    return view('welcome');
});

// Widget script and styles (CORS via WidgetCorsHeaders middleware)
Route::options('/widget', fn () => response('', 204)->withHeaders(['Access-Control-Allow-Origin' => '*', 'Access-Control-Allow-Methods' => 'GET, OPTIONS', 'Access-Control-Max-Age' => '86400']));
Route::options('/widget/', fn () => response('', 204)->withHeaders(['Access-Control-Allow-Origin' => '*', 'Access-Control-Allow-Methods' => 'GET, OPTIONS', 'Access-Control-Max-Age' => '86400']));
Route::get('/widget', [WidgetLoaderController::class, 'widget'])->middleware(\App\Http\Middleware\WidgetCorsHeaders::class);
Route::get('/widget/', [WidgetLoaderController::class, 'widget'])->middleware(\App\Http\Middleware\WidgetCorsHeaders::class);
Route::get('/widget/style.css', [WidgetLoaderController::class, 'style'])->middleware(\App\Http\Middleware\WidgetCorsHeaders::class);

// API Documentation
Route::get('/api/docs', function () {
    return redirect('/api-docs/index.html');
});

Route::get('/docs', function () {
    return redirect('/api-docs/index.html');
});

// Widget embed code endpoint
Route::get('/widget/{widget_id}/embed', [WidgetEmbedController::class, 'embed']);

