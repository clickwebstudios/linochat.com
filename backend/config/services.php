<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'help_center' => [
        'project_id' => env('HELP_CENTER_PROJECT_ID'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', '/api/auth/google/callback'),
    ],

    'frubix' => [
        'url'           => env('FRUBIX_URL', 'https://frubix.com'),
        'client_id'     => env('FRUBIX_CLIENT_ID'),
        'client_secret' => env('FRUBIX_CLIENT_SECRET'),
        'redirect_uri'  => env('FRUBIX_REDIRECT_URI'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token'  => env('TWILIO_AUTH_TOKEN'),
    ],

    'sendgrid' => [
        'api_key' => env('SENDGRID_API_KEY'),
    ],

    'inbound_email' => [
        'secret' => env('INBOUND_EMAIL_SECRET'),
        'domain' => env('INBOUND_EMAIL_DOMAIN', 'inbound.linochat.com'),
    ],

    'stripe' => [
        'key'            => env('STRIPE_KEY'),
        'secret'         => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'price_ids'      => [
            'starter_monthly' => env('STRIPE_PRICE_STARTER_MONTHLY'),
            'starter_annual'  => env('STRIPE_PRICE_STARTER_ANNUAL'),
            'growth_monthly'  => env('STRIPE_PRICE_GROWTH_MONTHLY'),
            'growth_annual'   => env('STRIPE_PRICE_GROWTH_ANNUAL'),
            'scale_monthly'   => env('STRIPE_PRICE_SCALE_MONTHLY'),
            'scale_annual'    => env('STRIPE_PRICE_SCALE_ANNUAL'),
        ],
    ],

];
