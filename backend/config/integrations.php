<?php

/*
 | Platform integration registry.
 |
 | Each entry defines a superadmin-editable integration. The PlatformIntegrationsController
 | uses this to render config forms, validate input, and encrypt secret fields. The
 | IntegrationConfigServiceProvider merges saved values into config($config_path) at boot
 | so existing code that reads `config('services.stripe.secret')` transparently picks up
 | the DB override when one is set.
 |
 | Field types: text | password | textarea | number | url | email
 | Secret fields are encrypted at rest and returned masked (last 4 chars only).
 */

return [

    'openai' => [
        'name' => 'OpenAI',
        'description' => 'Powers AI chat responses, auto-learning, and knowledge base embeddings.',
        'category' => 'ai',
        'icon' => 'Sparkles',
        'docs_url' => 'https://platform.openai.com/api-keys',
        'config_path' => 'openai',
        'fields' => [
            ['key' => 'api_key', 'label' => 'API Key', 'type' => 'password', 'secret' => true, 'required' => true, 'placeholder' => 'sk-...'],
            ['key' => 'organization', 'label' => 'Organization ID (optional)', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => 'org-...'],
        ],
    ],

    'stripe' => [
        'name' => 'Stripe',
        'description' => 'Subscriptions, billing, and token purchases.',
        'category' => 'payments',
        'icon' => 'CreditCard',
        'docs_url' => 'https://dashboard.stripe.com/apikeys',
        'config_path' => 'services.stripe',
        'fields' => [
            ['key' => 'key', 'label' => 'Publishable Key', 'type' => 'text', 'secret' => false, 'required' => true, 'placeholder' => 'pk_live_... or pk_test_...'],
            ['key' => 'secret', 'label' => 'Secret Key', 'type' => 'password', 'secret' => true, 'required' => true, 'placeholder' => 'sk_live_... or sk_test_...'],
            ['key' => 'webhook_secret', 'label' => 'Webhook Signing Secret', 'type' => 'password', 'secret' => true, 'required' => false, 'placeholder' => 'whsec_...'],
        ],
    ],

    'reverb' => [
        'name' => 'Reverb / Pusher',
        'description' => 'WebSocket broadcasting for realtime chat.',
        'category' => 'realtime',
        'icon' => 'Radio',
        'docs_url' => 'https://laravel.com/docs/reverb',
        'config_path' => 'broadcasting.connections.reverb',
        'fields' => [
            ['key' => 'app_id', 'label' => 'App ID', 'type' => 'text', 'secret' => false, 'required' => true],
            ['key' => 'key', 'label' => 'App Key', 'type' => 'text', 'secret' => false, 'required' => true],
            ['key' => 'secret', 'label' => 'App Secret', 'type' => 'password', 'secret' => true, 'required' => true],
            ['key' => 'options.host', 'label' => 'Host', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => 'linochat.com'],
            ['key' => 'options.port', 'label' => 'Port', 'type' => 'number', 'secret' => false, 'required' => false, 'placeholder' => '443'],
            ['key' => 'options.scheme', 'label' => 'Scheme', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => 'https'],
        ],
    ],

    'twilio' => [
        'name' => 'Twilio',
        'description' => 'SMS and voice messaging for customer conversations.',
        'category' => 'sms',
        'icon' => 'MessageCircle',
        'docs_url' => 'https://console.twilio.com/',
        'config_path' => 'twilio',
        'fields' => [
            ['key' => 'account_sid', 'label' => 'Account SID', 'type' => 'text', 'secret' => false, 'required' => true, 'placeholder' => 'AC...'],
            ['key' => 'auth_token', 'label' => 'Auth Token', 'type' => 'password', 'secret' => true, 'required' => true],
        ],
    ],

    'sendgrid' => [
        'name' => 'SendGrid',
        'description' => 'Transactional email (invites, verification, notifications).',
        'category' => 'email',
        'icon' => 'Mail',
        'docs_url' => 'https://app.sendgrid.com/settings/api_keys',
        'config_path' => 'services.sendgrid',
        'fields' => [
            ['key' => 'api_key', 'label' => 'API Key', 'type' => 'password', 'secret' => true, 'required' => true, 'placeholder' => 'SG.xxxxx'],
        ],
    ],

    'postmark' => [
        'name' => 'Postmark',
        'description' => 'Alternative transactional email provider.',
        'category' => 'email',
        'icon' => 'Mail',
        'docs_url' => 'https://account.postmarkapp.com/',
        'config_path' => 'services.postmark',
        'fields' => [
            ['key' => 'key', 'label' => 'Server API Token', 'type' => 'password', 'secret' => true, 'required' => true],
        ],
    ],

    'resend' => [
        'name' => 'Resend',
        'description' => 'Alternative transactional email provider.',
        'category' => 'email',
        'icon' => 'Mail',
        'docs_url' => 'https://resend.com/api-keys',
        'config_path' => 'services.resend',
        'fields' => [
            ['key' => 'key', 'label' => 'API Key', 'type' => 'password', 'secret' => true, 'required' => true, 'placeholder' => 're_...'],
        ],
    ],

    'ses' => [
        'name' => 'AWS SES',
        'description' => 'Amazon SES for high-volume email delivery.',
        'category' => 'email',
        'icon' => 'Cloud',
        'docs_url' => 'https://console.aws.amazon.com/ses/',
        'config_path' => 'services.ses',
        'fields' => [
            ['key' => 'key', 'label' => 'Access Key ID', 'type' => 'text', 'secret' => false, 'required' => true],
            ['key' => 'secret', 'label' => 'Secret Access Key', 'type' => 'password', 'secret' => true, 'required' => true],
            ['key' => 'region', 'label' => 'Region', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => 'us-east-1'],
        ],
    ],

    'inbound_email' => [
        'name' => 'Inbound Email',
        'description' => 'Receive customer replies via SendGrid Inbound Parse.',
        'category' => 'email',
        'icon' => 'Inbox',
        'docs_url' => 'https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook',
        'config_path' => 'services.inbound_email',
        'fields' => [
            ['key' => 'secret', 'label' => 'Webhook Secret', 'type' => 'password', 'secret' => true, 'required' => true],
            ['key' => 'domain', 'label' => 'Inbound Domain', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => 'inbound.linochat.com'],
        ],
    ],

    'slack' => [
        'name' => 'Slack',
        'description' => 'Internal alerts (new signups, errors, daily summaries).',
        'category' => 'chat',
        'icon' => 'Hash',
        'docs_url' => 'https://api.slack.com/apps',
        'config_path' => 'services.slack.notifications',
        'fields' => [
            ['key' => 'bot_user_oauth_token', 'label' => 'Bot User OAuth Token', 'type' => 'password', 'secret' => true, 'required' => true, 'placeholder' => 'xoxb-...'],
            ['key' => 'channel', 'label' => 'Default Channel', 'type' => 'text', 'secret' => false, 'required' => false, 'placeholder' => '#alerts'],
        ],
    ],

    'google' => [
        'name' => 'Google OAuth',
        'description' => 'Sign in with Google for agents and customers.',
        'category' => 'oauth',
        'icon' => 'KeyRound',
        'docs_url' => 'https://console.cloud.google.com/apis/credentials',
        'config_path' => 'services.google',
        'fields' => [
            ['key' => 'client_id', 'label' => 'Client ID', 'type' => 'text', 'secret' => false, 'required' => true],
            ['key' => 'client_secret', 'label' => 'Client Secret', 'type' => 'password', 'secret' => true, 'required' => true],
            ['key' => 'redirect', 'label' => 'Redirect URI', 'type' => 'url', 'secret' => false, 'required' => false, 'placeholder' => 'https://linochat.com/api/auth/google/callback'],
        ],
    ],

    'frubix' => [
        'name' => 'Frubix CRM',
        'description' => 'Bi-directional sync with Frubix CRM contacts and tickets.',
        'category' => 'crm',
        'icon' => 'Link2',
        'docs_url' => 'https://frubix.com',
        'config_path' => 'services.frubix',
        'fields' => [
            ['key' => 'url', 'label' => 'Frubix URL', 'type' => 'url', 'secret' => false, 'required' => false, 'placeholder' => 'https://frubix.com'],
            ['key' => 'client_id', 'label' => 'Client ID', 'type' => 'text', 'secret' => false, 'required' => true],
            ['key' => 'client_secret', 'label' => 'Client Secret', 'type' => 'password', 'secret' => true, 'required' => true],
            ['key' => 'redirect_uri', 'label' => 'Redirect URI', 'type' => 'url', 'secret' => false, 'required' => false],
        ],
    ],

];
