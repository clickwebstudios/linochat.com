<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Only create if not already present
        if (DB::table('oauth_clients')->where('name', 'Frubix')->exists()) {
            return;
        }

        $now = now();
        // Assign to the first superadmin, or first user
        $userId = DB::table('users')->where('role', 'superadmin')->value('id')
            ?? DB::table('users')->min('id')
            ?? 1;

        DB::table('oauth_clients')->insert([
            'user_id'       => $userId,
            'name'          => 'Frubix',
            'client_id'     => env('FRUBIX_OAUTH_CLIENT_ID', 'frubix_' . Str::random(32)),
            'client_secret' => env('FRUBIX_OAUTH_CLIENT_SECRET', Str::random(64)),
            'redirect_uri'  => env('FRUBIX_OAUTH_REDIRECT_URI', 'https://frubix.com/api/oauth/linochat/callback'),
            'scopes'        => json_encode(['chats:read', 'chats:write', 'projects:read', 'projects:write']),
            'is_active'     => true,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('oauth_clients')->where('name', 'Frubix')->delete();
    }
};
