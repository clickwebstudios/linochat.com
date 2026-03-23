<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\FrubixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IntegrationsController extends Controller
{
    private function getProject(int $projectId): ?Project
    {
        return Project::find($projectId);
    }

    /**
     * Get integration settings for a project.
     */
    public function getSettings(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];

        // Never expose secrets
        if (isset($integrations['frubix'])) {
            unset($integrations['frubix']['access_token']);
            unset($integrations['frubix']['refresh_token']);
        }

        return response()->json(['success' => true, 'data' => $integrations]);
    }

    /**
     * Generate the Frubix OAuth authorize URL for the frontend to redirect to.
     */
    public function frubixAuthorizeUrl(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $clientId = config('services.frubix.client_id');
        $frubixUrl = config('services.frubix.url', 'https://frubix.com');
        $redirectUri = config('services.frubix.redirect_uri');

        if (!$clientId || !$redirectUri) {
            return response()->json([
                'success' => false,
                'message' => 'Frubix OAuth is not configured on this server.',
            ], 500);
        }

        $state = base64_encode(json_encode([
            'project_id' => $projectId,
            'csrf' => csrf_token(),
        ]));

        // Store state in session for verification
        session(['frubix_oauth_state' => $state]);

        $params = http_build_query([
            'client_id'     => $clientId,
            'redirect_uri'  => $redirectUri,
            'response_type' => 'code',
            'scope'         => 'leads:write leads:read clients:read schedule:read schedule:write',
            'state'         => $state,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'url' => "{$frubixUrl}/oauth/authorize?{$params}",
            ],
        ]);
    }

    /**
     * Handle the OAuth callback from Frubix — exchange code for tokens.
     */
    public function frubixCallback(Request $request): JsonResponse
    {
        $code = $request->input('code');
        $state = $request->input('state');
        $error = $request->input('error');

        if ($error) {
            return response()->json([
                'success' => false,
                'message' => 'Authorization denied: ' . ($request->input('error_description') ?? $error),
            ], 400);
        }

        if (!$code || !$state) {
            return response()->json(['success' => false, 'message' => 'Missing code or state'], 400);
        }

        // Decode state to get project_id
        $stateData = json_decode(base64_decode($state), true);
        $projectId = $stateData['project_id'] ?? null;

        if (!$projectId) {
            return response()->json(['success' => false, 'message' => 'Invalid state'], 400);
        }

        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        try {
            $tokens = FrubixService::exchangeCode(
                config('services.frubix.url', 'https://frubix.com'),
                config('services.frubix.client_id'),
                config('services.frubix.client_secret'),
                $code,
                config('services.frubix.redirect_uri'),
            );

            $integrations = $project->integrations ?? [];
            $integrations['frubix'] = [
                'enabled'       => true,
                'url'           => config('services.frubix.url', 'https://frubix.com'),
                'access_token'  => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'] ?? null,
                'token_type'    => $tokens['token_type'] ?? 'Bearer',
                'expires_in'    => $tokens['expires_in'] ?? null,
                'connected_at'  => now()->toISOString(),
            ];

            $project->update(['integrations' => $integrations]);

            return response()->json([
                'success' => true,
                'message' => 'Frubix connected successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Frubix OAuth callback failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to Frubix. Please try again.',
            ], 500);
        }
    }

    /**
     * Get the active Frubix integration config for a project, or return an error response.
     */
    private function getFrubixConfig(int $projectId): array|JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $frubix = $project->integrations['frubix'] ?? null;
        if (!$frubix || empty($frubix['enabled'])) {
            return response()->json(['success' => false, 'message' => 'Frubix integration is not active for this project'], 400);
        }

        return $frubix;
    }

    /**
     * Persist refreshed tokens back to the project if they were rotated.
     */
    private function persistRefreshedTokens(int $projectId, array $frubixConfig): void
    {
        // After a service call the token may have been refreshed.
        // Re-read from DB is not needed here — token persistence happens inside
        // FrubixService::refreshToken via the caller if needed in the future.
        // For now this is a no-op hook for later enhancement.
    }

    /**
     * Search Frubix clients by phone or email.
     */
    public function frubixClients(Request $request, int $projectId): JsonResponse
    {
        $config = $this->getFrubixConfig($projectId);
        if ($config instanceof JsonResponse) return $config;

        try {
            $params = $request->only(['phone', 'email']);
            $data = FrubixService::searchClients($config, $params);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Frubix client search failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Frubix schedule entries.
     */
    public function frubixSchedule(Request $request, int $projectId): JsonResponse
    {
        $config = $this->getFrubixConfig($projectId);
        if ($config instanceof JsonResponse) return $config;

        try {
            $params = $request->only(['date_from', 'date_to', 'phone']);
            $data = FrubixService::getSchedule($config, $params);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Frubix schedule fetch failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a Frubix appointment.
     */
    public function frubixCreateAppointment(Request $request, int $projectId): JsonResponse
    {
        $config = $this->getFrubixConfig($projectId);
        if ($config instanceof JsonResponse) return $config;

        try {
            $data = FrubixService::createAppointment($config, $request->all());

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Frubix appointment creation failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a Frubix appointment.
     */
    public function frubixUpdateAppointment(Request $request, int $projectId, int $appointmentId): JsonResponse
    {
        $config = $this->getFrubixConfig($projectId);
        if ($config instanceof JsonResponse) return $config;

        try {
            $data = FrubixService::updateAppointment($config, $appointmentId, $request->all());

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Frubix appointment update failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Disconnect Frubix integration.
     */
    public function disconnectFrubix(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];
        unset($integrations['frubix']);
        $project->update(['integrations' => $integrations]);

        return response()->json(['success' => true, 'message' => 'Frubix integration disconnected.']);
    }

    /**
     * Register Frubix as the chat manager for this project (called by Frubix via OAuth).
     */
    public function frubixRegisterConnection(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $validated = $request->validate([
            'frubix_api_url'   => 'required|url',
            'frubix_api_token' => 'required|string',
            'webhook_url'      => 'nullable|url',
        ]);

        $integrations = $project->integrations ?? [];
        $integrations['frubix_managed'] = [
            'enabled'      => true,
            'api_url'      => $validated['frubix_api_url'],
            'api_token'    => $validated['frubix_api_token'],
            'webhook_url'  => $validated['webhook_url'] ?? null,
            'connected_at' => now()->toIso8601String(),
        ];
        $project->update(['integrations' => $integrations]);

        return response()->json(['success' => true, 'message' => 'Frubix connection registered.']);
    }

    /**
     * Unregister Frubix as the chat manager (called by Frubix on disconnect).
     */
    public function frubixUnregisterConnection(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];
        unset($integrations['frubix_managed']);
        $project->update(['integrations' => $integrations]);

        return response()->json(['success' => true, 'message' => 'Frubix connection removed.']);
    }
}
