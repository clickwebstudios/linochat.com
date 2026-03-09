<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OAuthClient;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OAuthClientController extends Controller
{
    /** List all OAuth apps registered by the authenticated user. */
    public function index(Request $request)
    {
        $clients = $request->user()
            ->hasMany(OAuthClient::class, 'user_id')
            ->get()
            ->makeVisible('client_secret'); // expose for the owner

        // Manually query to keep it simple
        $clients = OAuthClient::where('user_id', $request->user()->id)
            ->withCount('accessTokens')
            ->get()
            ->makeVisible('client_secret');

        return response()->json(['success' => true, 'data' => $clients]);
    }

    /** Register a new OAuth application. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'redirect_uri' => 'required|url|max:500',
            'scopes'       => 'nullable|array',
            'scopes.*'     => 'string|in:chats:read,tickets:read,tickets:write,projects:read,knowledge:read,users:read',
        ]);

        $client = OAuthClient::create([
            'user_id'       => $request->user()->id,
            'name'          => $data['name'],
            'client_id'     => Str::random(32),
            'client_secret' => Str::random(48),
            'redirect_uri'  => $data['redirect_uri'],
            'scopes'        => $data['scopes'] ?? ['chats:read'],
        ]);

        return response()->json([
            'success' => true,
            'data'    => $client->makeVisible('client_secret'),
        ], 201);
    }

    /** Show a single client (owner only). */
    public function show(Request $request, OAuthClient $client)
    {
        $this->authorizeClient($request, $client);

        return response()->json([
            'success' => true,
            'data'    => $client->makeVisible('client_secret')
                ->loadCount('accessTokens'),
        ]);
    }

    /** Rotate the client secret. */
    public function rotateSecret(Request $request, OAuthClient $client)
    {
        $this->authorizeClient($request, $client);

        $client->update(['client_secret' => Str::random(48)]);

        // Revoke all existing tokens when secret is rotated
        $client->accessTokens()->whereNull('revoked_at')->update([
            'revoked_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $client->fresh()->makeVisible('client_secret'),
            'message' => 'Secret rotated. All existing access tokens have been revoked.',
        ]);
    }

    /** Update name / redirect_uri / scopes. */
    public function update(Request $request, OAuthClient $client)
    {
        $this->authorizeClient($request, $client);

        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'redirect_uri' => 'sometimes|url|max:500',
            'scopes'       => 'sometimes|array',
            'scopes.*'     => 'string|in:chats:read,tickets:read,tickets:write,projects:read,knowledge:read,users:read',
            'is_active'    => 'sometimes|boolean',
        ]);

        $client->update($data);

        return response()->json(['success' => true, 'data' => $client->fresh()]);
    }

    /** Delete (and revoke all tokens for) an OAuth app. */
    public function destroy(Request $request, OAuthClient $client)
    {
        $this->authorizeClient($request, $client);
        $client->delete(); // cascades to tokens via FK

        return response()->json(['success' => true, 'message' => 'OAuth application deleted.']);
    }

    private function authorizeClient(Request $request, OAuthClient $client): void
    {
        if ($client->user_id !== $request->user()->id && !$request->user()->isSuperadmin()) {
            abort(403, 'Forbidden');
        }
    }
}
