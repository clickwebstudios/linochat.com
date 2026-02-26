<?php

namespace App\Providers;

use App\Broadcasting\SafePusherBroadcaster;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use SafePusherBroadcaster for reverb so connection failures (e.g. Reverb not running)
        // are logged instead of failing queue jobs
        Broadcast::extend('reverb', function ($app, $config) {
            $pusher = $app->make(\Illuminate\Broadcasting\BroadcastManager::class)->pusher($config);

            return new SafePusherBroadcaster($pusher);
        });

        // Use api middleware for JWT auth (Echo sends Bearer token)
        Broadcast::routes(['middleware' => ['api', 'auth:api']]);

        require base_path('routes/channels.php');
    }
}
