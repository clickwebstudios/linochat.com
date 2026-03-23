<?php

use App\Models\OAuthClient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Only create if not already present
        if (OAuthClient::where('name', 'Frubix')->exists()) {
            return;
        }

        OAuthClient::create([
            'name'          => 'Frubix',
            'client_id'     => env('FRUBIX_OAUTH_CLIENT_ID', 'frubix_' . Str::random(32)),
            'client_secret' => env('FRUBIX_OAUTH_CLIENT_SECRET', Str::random(64)),
            'redirect_uri'  => env('FRUBIX_OAUTH_REDIRECT_URI', 'https://frubix.com/api/oauth/linochat/callback'),
            'scopes'        => ['chats:read', 'chats:write', 'projects:read', 'projects:write'],
            'is_active'     => true,
        ]);
    }

    public function down(): void
    {
        OAuthClient::where('name', 'Frubix')->delete();
    }
};
