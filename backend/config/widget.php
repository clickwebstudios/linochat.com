<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Widget Configuration
    |--------------------------------------------------------------------------
    |
    | Values for the embedded chat widget. Cached with config:cache.
    |
    */

    'api_url' => env('APP_URL', 'http://localhost:8000'),
    'reverb_app_key' => env('REVERB_APP_KEY'),
    'reverb_app_secret' => env('REVERB_APP_SECRET'),
    'reverb_host' => env('REVERB_HOST', 'localhost'),
    'reverb_port' => env('REVERB_PORT', '8080'),
    'reverb_scheme' => env('REVERB_SCHEME', 'http'),

];
