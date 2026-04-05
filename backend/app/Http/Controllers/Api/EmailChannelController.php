<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmailChannelController extends Controller
{
    /**
     * GET /projects/{projectId}/integrations/email
     */
    public function status(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $channel = $this->getChannel($project);

        return response()->json([
            'success' => true,
            'data'    => $this->channelResponse($project, $channel),
        ]);
    }

    /**
     * POST /projects/{projectId}/integrations/email
     * Body: { support_email: string, from_name?: string }
     */
    public function connect(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $data = $request->validate([
            'support_email' => 'required|email|max:255',
            'from_name'     => 'nullable|string|max:100',
        ]);

        $existing = $this->getChannel($project);
        $token    = $existing['inbound_token'] ?? Str::random(32);

        $channel = [
            'enabled'        => true,
            'support_email'  => $data['support_email'],
            'from_name'      => $data['from_name'] ?? ($project->name . ' Support'),
            'inbound_token'  => $token,
            'connected_at'   => now()->toISOString(),
        ];

        $integrations             = $project->integrations ?? [];
        $integrations['email']    = $channel;
        $project->integrations    = $integrations;
        $project->save();

        Log::info('Email channel connected', ['project_id' => $project->id, 'email' => $data['support_email']]);

        return response()->json([
            'success' => true,
            'message' => 'Email channel connected',
            'data'    => $this->channelResponse($project, $channel),
        ]);
    }

    /**
     * DELETE /projects/{projectId}/integrations/email
     */
    public function disconnect(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $integrations = $project->integrations ?? [];
        unset($integrations['email']);
        $project->integrations = $integrations;
        $project->save();

        return response()->json(['success' => true, 'message' => 'Email channel disconnected']);
    }

    /**
     * POST /projects/{projectId}/integrations/email/test
     * Sends a test email to the authenticated user's email address.
     */
    public function test(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $channel = $this->getChannel($project);
        if (empty($channel['enabled'])) {
            return response()->json(['success' => false, 'message' => 'Email channel not connected'], 422);
        }

        $recipient   = $request->user()->email;
        $fromName    = $channel['from_name'] ?? ($project->name . ' Support');
        $fromAddress = config('mail.from.address');

        try {
            Mail::raw(
                "This is a test email from LinoChat.\n\nYour email channel ({$channel['support_email']}) is configured correctly.\n\nProject: {$project->name}",
                function ($mail) use ($recipient, $fromAddress, $fromName, $channel, $project) {
                    $mail->to($recipient)
                         ->subject("[Test] Email channel working — {$project->name}")
                         ->from($fromAddress, $fromName)
                         ->replyTo($channel['support_email'], $fromName);
                }
            );

            return response()->json(['success' => true, 'message' => 'Test email sent to ' . $recipient]);
        } catch (\Throwable $e) {
            Log::error('Email channel test failed', ['project_id' => $project->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function resolveProject(Request $request, int $projectId): ?Project
    {
        $user = $request->user();
        return Project::where('id', $projectId)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q2) => $q2->where('users.id', $user->id));
            })
            ->first();
    }

    private function getChannel(Project $project): array
    {
        return $project->integrations['email'] ?? [];
    }

    private function channelResponse(Project $project, array $channel): array
    {
        $appUrl = rtrim(config('app.url'), '/');
        $token  = $channel['inbound_token'] ?? null;

        return [
            'connected'      => !empty($channel['enabled']),
            'support_email'  => $channel['support_email'] ?? null,
            'from_name'      => $channel['from_name'] ?? null,
            'inbound_token'  => $token,
            'webhook_url'    => $token ? "{$appUrl}/api/email/inbound/{$token}" : null,
            'connected_at'   => $channel['connected_at'] ?? null,
        ];
    }
}
