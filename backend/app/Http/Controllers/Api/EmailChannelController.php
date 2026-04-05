<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailChannelController extends Controller
{
    // LinoChat-owned inbound domain — MX must point to mx.sendgrid.net
    private const INBOUND_DOMAIN = 'inbound.linochat.com';

    /**
     * GET /projects/{projectId}/integrations/email
     */
    public function status(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        return response()->json([
            'success' => true,
            'data'    => $this->channelResponse($project),
        ]);
    }

    /**
     * POST /projects/{projectId}/integrations/email
     * Body: { support_email: string, from_name?: string }
     *
     * Uses LinoChat's SendGrid API key to register the inbound parse webhook.
     * No API key required from the user.
     */
    public function connect(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $data = $request->validate([
            'support_email' => 'required|email|max:255',
            'from_name'     => 'nullable|string|max:100',
        ]);

        $apiKey = config('services.sendgrid.api_key');
        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'SendGrid is not configured on this server'], 503);
        }

        $inboundAddress = $this->inboundAddress($project);
        $webhookUrl     = $this->webhookUrl($project);

        // Register (or update) inbound parse on SendGrid using our API key
        $sgResult = $this->registerSendGridInboundParse($apiKey, $inboundAddress, $webhookUrl);
        if ($sgResult !== true) {
            Log::error('EmailChannel: SendGrid inbound parse registration failed', [
                'project_id' => $project->id,
                'error'      => $sgResult,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Could not configure SendGrid: ' . $sgResult,
            ], 500);
        }

        $channel = [
            'enabled'         => true,
            'support_email'   => $data['support_email'],
            'from_name'       => $data['from_name'] ?? ($project->name . ' Support'),
            'inbound_address' => $inboundAddress,
            'connected_at'    => now()->toISOString(),
        ];

        $integrations          = $project->integrations ?? [];
        $integrations['email'] = $channel;
        $project->integrations = $integrations;
        $project->save();

        Log::info('Email channel connected', [
            'project_id'      => $project->id,
            'support_email'   => $data['support_email'],
            'inbound_address' => $inboundAddress,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email channel connected',
            'data'    => $this->channelResponse($project),
        ]);
    }

    /**
     * DELETE /projects/{projectId}/integrations/email
     */
    public function disconnect(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        // Remove inbound parse from SendGrid
        $apiKey = config('services.sendgrid.api_key');
        if ($apiKey) {
            $this->deleteSendGridInboundParse($apiKey, $this->inboundAddress($project));
        }

        $integrations = $project->integrations ?? [];
        unset($integrations['email']);
        $project->integrations = $integrations;
        $project->save();

        return response()->json(['success' => true, 'message' => 'Email channel disconnected']);
    }

    /**
     * POST /projects/{projectId}/integrations/email/test
     */
    public function test(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $channel = $project->integrations['email'] ?? [];
        if (empty($channel['enabled'])) {
            return response()->json(['success' => false, 'message' => 'Email channel not connected'], 422);
        }

        $recipient   = $request->user()->email;
        $fromName    = $channel['from_name'] ?? ($project->name . ' Support');
        $fromAddress = config('mail.from.address');
        $replyTo     = $channel['support_email'];

        try {
            Mail::raw(
                "This is a test email from LinoChat.\n\n" .
                "Your email channel is configured correctly.\n\n" .
                "Project: {$project->name}\n" .
                "Support email: {$replyTo}\n" .
                "Inbound address: {$channel['inbound_address']}\n\n" .
                "Customers can email {$replyTo} and tickets will be created automatically.",
                function ($mail) use ($recipient, $fromAddress, $fromName, $replyTo, $project) {
                    $mail->to($recipient)
                         ->subject("[Test] Email channel working — {$project->name}")
                         ->from($fromAddress, $fromName)
                         ->replyTo($replyTo, $fromName);
                }
            );

            return response()->json(['success' => true, 'message' => 'Test email sent to ' . $recipient]);
        } catch (\Throwable $e) {
            Log::error('Email channel test failed', ['project_id' => $project->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    // ── SendGrid API ───────────────────────────────────────────────────────────

    /**
     * Register or update a SendGrid Inbound Parse hostname.
     * Returns true on success, error string on failure.
     */
    private function registerSendGridInboundParse(string $apiKey, string $hostname, string $webhookUrl): bool|string
    {
        $payload = [
            'hostname'   => $hostname,
            'url'        => $webhookUrl,
            'spam_check' => false,
            'send_raw'   => false,
        ];

        // Check if entry already exists
        $existing = Http::withToken($apiKey)
            ->get('https://api.sendgrid.com/v3/user/webhooks/parse/settings');

        if ($existing->successful()) {
            $entries = $existing->json('result') ?? [];
            foreach ($entries as $entry) {
                if (($entry['hostname'] ?? '') === $hostname) {
                    // Update existing
                    $res = Http::withToken($apiKey)
                        ->patch("https://api.sendgrid.com/v3/user/webhooks/parse/settings/{$hostname}", $payload);
                    return $res->successful() ? true : ($res->json('errors.0.message') ?? 'SendGrid PATCH failed');
                }
            }
        }

        // Create new
        $res = Http::withToken($apiKey)
            ->post('https://api.sendgrid.com/v3/user/webhooks/parse/settings', $payload);

        if ($res->successful()) return true;

        $errors = $res->json('errors') ?? [];
        return $errors[0]['message'] ?? ('SendGrid error: ' . $res->status());
    }

    private function deleteSendGridInboundParse(string $apiKey, string $hostname): void
    {
        Http::withToken($apiKey)
            ->delete("https://api.sendgrid.com/v3/user/webhooks/parse/settings/{$hostname}");
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Inbound email address unique to this project: p{id}@inbound.linochat.com */
    private function inboundAddress(Project $project): string
    {
        return 'p' . $project->id . '@' . self::INBOUND_DOMAIN;
    }

    private function webhookUrl(Project $project): string
    {
        return rtrim(config('app.url'), '/') . '/api/email/inbound/p' . $project->id;
    }

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

    private function channelResponse(Project $project): array
    {
        $channel = $project->integrations['email'] ?? [];
        return [
            'connected'       => !empty($channel['enabled']),
            'support_email'   => $channel['support_email'] ?? null,
            'from_name'       => $channel['from_name'] ?? null,
            'inbound_address' => $channel['inbound_address'] ?? $this->inboundAddress($project),
            'connected_at'    => $channel['connected_at'] ?? null,
        ];
    }
}
