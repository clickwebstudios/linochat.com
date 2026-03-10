<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\FrubixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationsController extends Controller
{
    private function getProject(int $projectId): ?Project
    {
        return Project::find($projectId);
    }

    public function getSettings(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];

        // Never expose password
        if (isset($integrations['frubix']['password'])) {
            $integrations['frubix']['password'] = '••••••••';
        }

        return response()->json(['success' => true, 'data' => $integrations]);
    }

    public function saveFrubix(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $validated = $request->validate([
            'url'      => 'required|url',
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Test connection first
        $frubix = new FrubixService(
            $validated['url'],
            $validated['email'],
            $validated['password'],
        );

        if (!$frubix->testConnection()) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to Frubix. Please check your credentials.',
            ], 422);
        }

        $integrations = $project->integrations ?? [];
        $integrations['frubix'] = [
            'enabled'      => true,
            'url'          => rtrim($validated['url'], '/'),
            'email'        => $validated['email'],
            'password'     => $validated['password'],
            'connected_at' => now()->toISOString(),
        ];

        $project->update(['integrations' => $integrations]);

        return response()->json([
            'success' => true,
            'message' => 'Frubix integration connected successfully.',
            'data'    => [
                'enabled' => true,
                'url' => $integrations['frubix']['url'],
                'email' => $integrations['frubix']['email'],
                'connected_at' => $integrations['frubix']['connected_at'],
            ],
        ]);
    }

    public function disconnectFrubix(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];
        unset($integrations['frubix']);
        $project->update(['integrations' => $integrations]);

        return response()->json(['success' => true, 'message' => 'Frubix integration disconnected.']);
    }

    public function testFrubix(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $validated = $request->validate([
            'url'      => 'required|url',
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $frubix = new FrubixService(
            $validated['url'],
            $validated['email'],
            $validated['password'],
        );

        $ok = $frubix->testConnection();

        return response()->json([
            'success' => true,
            'data'    => ['connected' => $ok],
        ]);
    }
}
