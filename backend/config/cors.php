<?php

// return [

//     /*
//     |--------------------------------------------------------------------------
//     | Cross-Origin Resource Sharing (CORS) Configuration
//     |--------------------------------------------------------------------------
//     |
//     | Here you may configure your settings for cross-origin resource sharing
//     | or "CORS". This determines what cross-origin operations may execute
//     | in web browsers. You are free to adjust these settings as needed.
//     |
//     | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
//     |
//     */

//     'paths' => ['api/*', 'sanctum/csrf-cookie', 'widget', 'widget/*'],

//     'allowed_methods' => ['*'],

//     'allowed_origins' => ['*'],

//     // Allow widget to be embedded on any customer website (fallback when origin not in list)
//     'allowed_origins_patterns' => [
//         '#^https?://.+#',
//     ],

//     'allowed_headers' => ['*'],

//     'exposed_headers' => ['Authorization'],

//     'max_age' => 86400,

//     // Must be false when using * for widget cross-origin embedding
//     'supports_credentials' => false,

// ];

return [
    'paths' => ['api/*', 'widget', 'widget/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,

    'widget_allowed_origins' => ['*'],
];
