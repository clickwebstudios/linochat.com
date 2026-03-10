<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Ticket;
use App\Services\FrubixService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationsController extends Controller
{
    public function __construct(private FrubixService $frubix) {}

    private function getProject(int $projectId): ?Project
    {
        return Project::find($projectId);
    }

    public function getSettings(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['error' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];

        // Never expose the secret
        if (isset($integrations['frubix']['client_secret'])) {
            $integrations['frubix']['client_secret'] = '••••••••';
            $integrations['frubix']['connected'] = true;
        }

        return response()->json(['data' => $integrations]);
    }

    public function saveFrubix(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['error' => 'Project not found'], 404);

        $validated = $request->validate([
            'url'           => 'required|url',
            'client_id'     => 'required|string',
            'client_secret' => 'required|string',
        ]);

        $integrations = $project->integrations ?? [];
        $integrations['frubix'] = [
            'url'           => rtrim($validated['url'], '/'),
            'client_id'     => $validated['client_id'],
            'client_secret' => $validated['client_secret'],
            'connected_at'  => now()->toISOString(),
        ];

        $project->update(['integrations' => $integrations]);

        return response()->json(['data' => ['connected' => true, 'url' => $integrations['frubix']['url']]]);
    }

    public function disconnectFrubix(int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['error' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];
        unset($integrations['frubix']);
        $project->update(['integrations' => $integrations]);

        return response()->json(['data' => ['connected' => false]]);
    }

    public function testFrubix(Request $request, int $projectId): JsonResponse
    {
        $project = $this->getProject($projectId);
        if (!$project) return response()->json(['error' => 'Project not found'], 404);

        $validated = $request->validate([
            'url'           => 'required|url',
            'client_id'     => 'required|string',
            'client_secret' => 'required|string',
        ]);

        $ok = $this->frubix->testConnection(
            $validated['url'],
            $validated['client_id'],
            $validated['client_secret']
        );

        return response()->json(['data' => ['success' => $ok]]);
    }

    public function createFrubixLead(Request $request, int $ticketId): JsonResponse
    {
        $ticket = Ticket::with('project')->find($ticketId);
        if (!$ticket) return response()->json(['error' => 'Ticket not found'], 404);

        $frubix = $ticket->project->integrations['frubix'] ?? null;
        if (!$frubix) {
            return response()->json(['error' => 'Frubix integration not configured for this project'], 422);
        }

        try {
            $lead = $this->frubix->createLead(
                $frubix['url'],
                $frubix['client_id'],
                $frubix['client_secret'],
                [
                    'name'   => $ticket->customer_name ?: $ticket->customer_email,
                    'email'  => $ticket->customer_email,
                    'source' => 'linochat',
                    'notes'  => "Ticket #{$ticket->ticket_number}: {$ticket->subject}\n\n{$ticket->description}",
                    'status' => 'new',
                ]
            );

            return response()->json(['data' => $lead], 201);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
