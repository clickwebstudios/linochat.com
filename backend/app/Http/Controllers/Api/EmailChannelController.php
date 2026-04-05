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
     * Saves email channel config. Does NOT call SendGrid yet.
     * Call POST .../email/domain-auth next to register DNS records.
     */
    public function connect(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $data = $request->validate([
            'support_email' => 'required|email|max:255',
            'from_name'     => 'nullable|string|max:100',
        ]);

        // Validate it's a subdomain address (not root domain)
        $domain = $this->domainFromEmail($data['support_email']);
        if (!$domain || substr_count($domain, '.') < 1) {
            return response()->json([
                'success' => false,
                'message' => 'Please use a subdomain address like support@help.yourdomain.com.',
            ], 422);
        }

        // Uniqueness: no other project should share this support_email
        $conflict = Project::where('id', '!=', $project->id)
            ->whereNotNull('integrations')
            ->get()
            ->first(fn ($p) =>
                ($p->integrations['email']['support_email'] ?? null) === $data['support_email']
                && !empty($p->integrations['email']['enabled'])
            );

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'This email address is already used by another project.',
            ], 422);
        }

        $integrations = $project->integrations ?? [];
        $existing     = $integrations['email'] ?? [];

        // Preserve domain_auth if the support_email hasn't changed
        $domainAuth = null;
        if (!empty($existing['support_email']) && $existing['support_email'] === $data['support_email']) {
            $domainAuth = $existing['domain_auth'] ?? null;
        }

        $integrations['email'] = [
            'enabled'       => true,
            'support_email' => $data['support_email'],
            'from_name'     => $data['from_name'] ?? ($project->name . ' Support'),
            'connected_at'  => $existing['connected_at'] ?? now()->toISOString(),
            'domain_auth'   => $domainAuth,
        ];
        $project->integrations = $integrations;
        $project->save();

        Log::info('Email channel connected', [
            'project_id'    => $project->id,
            'support_email' => $data['support_email'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email channel connected. Set up your domain to start receiving emails.',
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

        // Clean up SendGrid domain auth + inbound parse
        $apiKey = config('services.sendgrid.api_key');
        if ($apiKey) {
            $domainAuth = $project->integrations['email']['domain_auth'] ?? null;
            if ($domainAuth) {
                if (!empty($domainAuth['sendgrid_domain_id'])) {
                    Http::withToken($apiKey)
                        ->delete("https://api.sendgrid.com/v3/whitelabel/domains/{$domainAuth['sendgrid_domain_id']}");
                }
                if (!empty($domainAuth['sendgrid_parse_hostname'])) {
                    Http::withToken($apiKey)
                        ->delete("https://api.sendgrid.com/v3/user/webhooks/parse/settings/{$domainAuth['sendgrid_parse_hostname']}");
                }
            }
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
                "Support email: {$replyTo}\n\n" .
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

    /**
     * POST /projects/{projectId}/integrations/email/domain-auth
     * Registers customer's subdomain with SendGrid for DKIM/SPF (outbound) + inbound parse.
     */
    public function domainAuth(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $channel = $project->integrations['email'] ?? [];
        if (empty($channel['enabled']) || empty($channel['support_email'])) {
            return response()->json(['success' => false, 'message' => 'Email channel not connected'], 422);
        }

        $apiKey = config('services.sendgrid.api_key');
        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'SendGrid is not configured on this server'], 503);
        }

        $domain = $this->domainFromEmail($channel['support_email']);
        if (!$domain) {
            return response()->json(['success' => false, 'message' => 'Invalid support email domain'], 422);
        }

        // If already registered, return existing records
        $existing = $channel['domain_auth'] ?? null;
        if ($existing && !empty($existing['sendgrid_domain_id'])) {
            return response()->json([
                'success' => true,
                'message' => 'Domain auth already configured',
                'data'    => $this->channelResponse($project),
            ]);
        }

        // Register domain auth with SendGrid (DKIM + SPF for outbound)
        $sgRes = Http::withToken($apiKey)->post('https://api.sendgrid.com/v3/whitelabel/domains', [
            'domain'             => $domain,
            'automatic_security' => true,
        ]);

        if (!$sgRes->successful()) {
            $errors = $sgRes->json('errors') ?? [];
            $msg    = $errors[0]['message'] ?? ('SendGrid error: ' . $sgRes->status());
            Log::error('EmailChannel: domain auth registration failed', [
                'project_id' => $project->id,
                'error'      => $msg,
                'body'       => $sgRes->body(),
            ]);
            return response()->json(['success' => false, 'message' => 'Could not register domain: ' . $msg], 500);
        }

        $sgData = $sgRes->json();
        $sgId   = $sgData['id'];

        // Register inbound parse for this domain (single platform-level webhook)
        $webhookUrl = rtrim(config('app.url'), '/') . '/api/email/inbound';
        $parseRes = Http::withToken($apiKey)->post('https://api.sendgrid.com/v3/user/webhooks/parse/settings', [
            'hostname'   => $domain,
            'url'        => $webhookUrl,
            'spam_check' => false,
            'send_raw'   => false,
        ]);

        // 409 = already exists, that's fine
        if (!$parseRes->successful() && $parseRes->status() !== 409) {
            Log::warning('EmailChannel: inbound parse registration failed (non-fatal)', [
                'project_id' => $project->id,
                'status'     => $parseRes->status(),
            ]);
        }

        $dnsRecords = $this->buildDnsRecords($domain, $sgData);

        $domainAuth = [
            'sendgrid_domain_id'      => $sgId,
            'sendgrid_parse_hostname' => $domain,
            'domain'                  => $domain,
            'status'                  => 'pending',
            'dns_records'             => $dnsRecords,
        ];

        $integrations                         = $project->integrations;
        $integrations['email']['domain_auth'] = $domainAuth;
        $project->integrations                = $integrations;
        $project->save();

        Log::info('EmailChannel: domain auth initiated', [
            'project_id'        => $project->id,
            'domain'            => $domain,
            'sendgrid_domain_id' => $sgId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Domain auth initiated. Add the DNS records below to your registrar, then click Check DNS.',
            'data'    => $this->channelResponse($project),
        ]);
    }

    /**
     * POST /projects/{projectId}/integrations/email/domain-auth/verify
     * Calls SendGrid to validate DNS records and checks MX record.
     */
    public function verifyDomainAuth(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $domainAuth = $project->integrations['email']['domain_auth'] ?? null;
        if (!$domainAuth || empty($domainAuth['sendgrid_domain_id'])) {
            return response()->json(['success' => false, 'message' => 'Domain auth not configured'], 422);
        }

        $apiKey = config('services.sendgrid.api_key');
        if (!$apiKey) {
            return response()->json(['success' => false, 'message' => 'SendGrid is not configured on this server'], 503);
        }

        $sgId  = $domainAuth['sendgrid_domain_id'];
        $sgRes = Http::withToken($apiKey)->post("https://api.sendgrid.com/v3/whitelabel/domains/{$sgId}/validate");

        if (!$sgRes->successful()) {
            return response()->json(['success' => false, 'message' => 'SendGrid validation request failed'], 500);
        }

        $result     = $sgRes->json();
        $validation = $result['validation_results'] ?? [];
        $records    = $domainAuth['dns_records'];

        // Update per-record validity from SendGrid response
        if (isset($validation['mail_cname']['valid'])) {
            $records['cname1']['valid'] = (bool) $validation['mail_cname']['valid'];
        }
        if (isset($validation['dkim1']['valid'])) {
            $records['cname2']['valid'] = (bool) $validation['dkim1']['valid'];
        }
        if (isset($validation['dkim2']['valid'])) {
            $records['cname3']['valid'] = (bool) $validation['dkim2']['valid'];
        }

        // Check MX record via DNS lookup
        $records['mx']['valid'] = $this->checkMxRecord($domainAuth['domain']);

        $sgValid  = (bool) ($result['valid'] ?? false);
        $allValid = $sgValid && $records['mx']['valid'];

        $domainAuth['dns_records'] = $records;
        $domainAuth['status']      = $allValid ? 'verified' : 'pending';

        $integrations                         = $project->integrations;
        $integrations['email']['domain_auth'] = $domainAuth;
        $project->integrations                = $integrations;
        $project->save();

        return response()->json([
            'success' => true,
            'data'    => $this->channelResponse($project),
        ]);
    }

    /**
     * DELETE /projects/{projectId}/integrations/email/domain-auth
     * Removes domain auth from SendGrid and clears stored records.
     */
    public function removeDomainAuth(Request $request, int $projectId)
    {
        $project = $this->resolveProject($request, $projectId);
        if (!$project) return response()->json(['success' => false, 'message' => 'Project not found'], 404);

        $domainAuth = $project->integrations['email']['domain_auth'] ?? null;
        $apiKey     = config('services.sendgrid.api_key');

        if ($apiKey && $domainAuth) {
            if (!empty($domainAuth['sendgrid_domain_id'])) {
                Http::withToken($apiKey)
                    ->delete("https://api.sendgrid.com/v3/whitelabel/domains/{$domainAuth['sendgrid_domain_id']}");
            }
            if (!empty($domainAuth['sendgrid_parse_hostname'])) {
                Http::withToken($apiKey)
                    ->delete("https://api.sendgrid.com/v3/user/webhooks/parse/settings/{$domainAuth['sendgrid_parse_hostname']}");
            }
        }

        $integrations = $project->integrations ?? [];
        unset($integrations['email']['domain_auth']);
        $project->integrations = $integrations;
        $project->save();

        return response()->json([
            'success' => true,
            'message' => 'Domain auth removed',
            'data'    => $this->channelResponse($project),
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function domainFromEmail(string $email): ?string
    {
        $parts = explode('@', $email, 2);
        return count($parts) === 2 ? strtolower(trim($parts[1])) : null;
    }

    private function buildDnsRecords(string $domain, array $sgData): array
    {
        $dns    = $sgData['dns'] ?? [];
        $sgId   = $sgData['id'];
        $subdom = $sgData['subdomain'] ?? 'em';

        return [
            'mx' => [
                'type'  => 'MX',
                'host'  => $domain,
                'value' => 'mx.sendgrid.net',
                'valid' => false,
            ],
            'cname1' => [
                'type'  => 'CNAME',
                'host'  => $dns['mail_cname']['host'] ?? "{$subdom}.{$domain}",
                'value' => $dns['mail_cname']['data'] ?? "u{$sgId}.wl.sendgrid.net",
                'valid' => false,
            ],
            'cname2' => [
                'type'  => 'CNAME',
                'host'  => $dns['dkim1']['host'] ?? "s1._domainkey.{$domain}",
                'value' => $dns['dkim1']['data'] ?? "s1.domainkey.u{$sgId}.wl.sendgrid.net",
                'valid' => false,
            ],
            'cname3' => [
                'type'  => 'CNAME',
                'host'  => $dns['dkim2']['host'] ?? "s2._domainkey.{$domain}",
                'value' => $dns['dkim2']['data'] ?? "s2.domainkey.u{$sgId}.wl.sendgrid.net",
                'valid' => false,
            ],
        ];
    }

    private function checkMxRecord(string $domain): bool
    {
        try {
            $records = dns_get_record($domain, DNS_MX);
            if (!is_array($records)) return false;
            foreach ($records as $record) {
                if (str_contains(strtolower($record['target'] ?? ''), 'sendgrid.net')) {
                    return true;
                }
            }
        } catch (\Throwable) {
        }
        return false;
    }

    private function resolveProject(Request $request, int $projectId): ?Project
    {
        $user = $request->user();
        return Project::where('id', $projectId)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn ($q2) => $q2->where('users.id', $user->id));
            })
            ->first();
    }

    private function channelResponse(Project $project): array
    {
        $channel    = $project->integrations['email'] ?? [];
        $domainAuth = $channel['domain_auth'] ?? null;

        return [
            'connected'     => !empty($channel['enabled']),
            'support_email' => $channel['support_email'] ?? null,
            'from_name'     => $channel['from_name'] ?? null,
            'connected_at'  => $channel['connected_at'] ?? null,
            'domain_auth'   => $domainAuth ? [
                'domain'      => $domainAuth['domain'] ?? null,
                'status'      => $domainAuth['status'] ?? 'pending',
                'dns_records' => $domainAuth['dns_records'] ?? [],
            ] : null,
        ];
    }
}
