<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Handles inbound email webhooks from SendGrid Inbound Parse.
 *
 * Configure SendGrid → Settings → Inbound Parse → Add Host & URL:
 *   URL: https://linochat.com/api/email/inbound/{inbound_token}
 *
 * The {inbound_token} is unique per project and shown in the email channel settings.
 *
 * Two flows:
 *  1. Reply to existing ticket: subject contains [TKT-YYYY-XXXXX] → append message
 *  2. New email → creates a new ticket in the project
 */
class InboundEmailController extends Controller
{
    public function handle(Request $request, ?string $token = null)
    {
        // Resolve project by token (legacy per-project) or by `to` field (custom domain)
        $project = null;

        if ($token) {
            // Legacy token route: /api/email/inbound/{token}
            $project = $this->findProjectByToken($token);
            if (!$project) {
                Log::warning('InboundEmail: unknown inbound token', ['token' => $token]);
                return response()->json(['ok' => true]); // 200 so SendGrid doesn't retry
            }
        } else {
            // Custom domain route: /api/email/inbound (no token)
            // Route by the `to` field — match against project.integrations.email.support_email
            $toEmail = $this->extractToEmail($request);
            if ($toEmail) {
                $project = $this->findProjectBySupportEmail($toEmail);
            }
            // If no project matched, continue anyway — ticket reply by TKT number still works
        }

        try {
            $subject   = $this->extractField($request, ['subject', 'Subject']) ?? '';
            $body      = $this->extractBody($request);
            $fromEmail = $this->extractField($request, ['sender', 'from', 'From']) ?? '';
            $fromName  = $this->extractFromName($request, $fromEmail);

            // Flow 1: reply to existing ticket
            if (preg_match('/\[?(TKT-\d{4}-\d+)\]?/i', $subject, $matches)) {
                return $this->handleTicketReply(
                    strtoupper($matches[1]),
                    $body,
                    $fromEmail,
                    $project
                );
            }

            // Flow 2: new inbound email — create ticket
            if ($project) {
                return $this->createTicketFromEmail(
                    $project,
                    $subject,
                    $body,
                    $fromEmail,
                    $fromName
                );
            }

            Log::info('InboundEmail: no ticket reference and no project token, ignoring', ['subject' => $subject]);
            return response()->json(['ok' => true]);

        } catch (\Throwable $e) {
            Log::error('InboundEmail: unhandled error', ['error' => $e->getMessage()]);
            return response()->json(['ok' => true]); // always 200 to prevent SendGrid retries
        }
    }

    // ── Ticket reply ──────────────────────────────────────────────────────────

    private function handleTicketReply(string $ticketNumber, string $body, string $fromEmail, ?Project $project): \Illuminate\Http\JsonResponse
    {
        $ticket = Ticket::where('ticket_number', $ticketNumber)->first();

        if (!$ticket) {
            Log::warning('InboundEmail: ticket not found', ['ticket_number' => $ticketNumber]);
            return response()->json(['ok' => true]);
        }

        // If we have a project token, make sure this ticket belongs to it
        if ($project && $ticket->project_id !== $project->id) {
            Log::warning('InboundEmail: ticket project mismatch', [
                'ticket_number' => $ticketNumber,
                'expected_project' => $project->id,
                'actual_project' => $ticket->project_id,
            ]);
            return response()->json(['ok' => true]);
        }

        if ($ticket->status === 'closed') {
            return response()->json(['ok' => true]);
        }

        $content = trim($body);
        if (empty($content)) {
            return response()->json(['ok' => true]);
        }

        $senderType = (strtolower($fromEmail) === strtolower($ticket->customer_email ?? ''))
            ? 'customer'
            : 'agent';

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => $senderType,
            'sender_id'   => mb_substr(filter_var($fromEmail, FILTER_SANITIZE_EMAIL) ?: 'unknown', 0, 255),
            'content'     => mb_substr(strip_tags($content), 0, 10000),
        ]);

        if ($senderType === 'customer' && $ticket->status === 'pending') {
            $ticket->update(['status' => 'open']);
        }

        Log::info('InboundEmail: reply added to ticket', [
            'ticket' => $ticketNumber,
            'sender' => $senderType,
        ]);

        return response()->json(['ok' => true]);
    }

    // ── New ticket from email ─────────────────────────────────────────────────

    private function createTicketFromEmail(Project $project, string $subject, string $body, string $fromEmail, string $fromName): \Illuminate\Http\JsonResponse
    {
        if (empty(trim($fromEmail))) {
            Log::warning('InboundEmail: cannot create ticket, no from email');
            return response()->json(['ok' => true]);
        }

        $ticketSubject = trim($subject) ?: 'No subject';
        $description   = trim(strip_tags($body)) ?: '(no body)';

        // ticket_number and access_token are generated by the model's booted() hook from the unique ticket ID
        $ticket = Ticket::create([
            'project_id'     => $project->id,
            'subject'        => mb_substr($ticketSubject, 0, 255),
            'description'    => mb_substr($description, 0, 10000),
            'status'         => 'open',
            'priority'       => 'medium',
            'customer_email' => filter_var($fromEmail, FILTER_SANITIZE_EMAIL),
            'customer_name'  => $fromName ?: explode('@', $fromEmail)[0],
        ]);

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'customer',
            'sender_id'   => $ticket->customer_email,
            'content'     => mb_substr($description, 0, 10000),
        ]);

        Log::info('InboundEmail: new ticket created', [
            'ticket_number' => $ticket->ticket_number,
            'project_id'    => $project->id,
            'from'          => $fromEmail,
        ]);

        // Send customer confirmation
        try {
            $ticketUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/ticket/' . $ticket->access_token;
            \Illuminate\Support\Facades\Mail::to($ticket->customer_email)
                ->send(new \App\Mail\TicketCreatedMail($ticket, $project->name, $ticketUrl));
        } catch (\Throwable $e) {
            Log::error('InboundEmail: failed to send confirmation', ['error' => $e->getMessage()]);
        }

        return response()->json(['ok' => true]);
    }

    // ── Field extraction helpers ──────────────────────────────────────────────

    private function findProjectByToken(string $token): ?Project
    {
        // Token format: p{project_id}  e.g. "p42"
        if (preg_match('/^p(\d+)$/', $token, $m)) {
            $project = Project::find((int) $m[1]);
            if ($project && !empty($project->integrations['email']['enabled'])) {
                return $project;
            }
        }

        // Legacy: random token stored in integrations->email->inbound_token
        return Project::whereNotNull('integrations')
            ->get()
            ->first(function (Project $p) use ($token) {
                return ($p->integrations['email']['inbound_token'] ?? null) === $token
                    && !empty($p->integrations['email']['enabled']);
            });
    }

    private function findProjectBySupportEmail(string $email): ?Project
    {
        $email = strtolower(trim($email));

        // Try JSON path query first for performance
        $project = Project::whereNotNull('integrations')
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(integrations, '$.email.support_email')) = ?", [$email])
            ->whereRaw("JSON_EXTRACT(integrations, '$.email.enabled') = true")
            ->first();

        if ($project) return $project;

        // Fallback: in-PHP scan (handles non-MySQL drivers)
        return Project::whereNotNull('integrations')
            ->get()
            ->first(fn (Project $p) =>
                strtolower($p->integrations['email']['support_email'] ?? '') === $email
                && !empty($p->integrations['email']['enabled'])
            );
    }

    private function extractToEmail(Request $request): ?string
    {
        // SendGrid sends `to` as "Name <email@domain.com>" or bare "email@domain.com"
        // May be comma-separated list; we take the first matching address
        $raw = $request->input('to') ?? $request->input('To') ?? '';
        if (empty($raw)) return null;

        // Extract all email addresses from the field
        preg_match_all('/[\w.+\-]+@[\w\-]+(?:\.[\w\-]+)+/', $raw, $matches);
        return !empty($matches[0]) ? strtolower($matches[0][0]) : null;
    }

    private function extractField(Request $request, array $keys): ?string
    {
        foreach ($keys as $key) {
            $val = $request->input($key);
            if (!empty($val) && is_string($val)) return $val;
        }
        return null;
    }

    private function extractBody(Request $request): string
    {
        return $request->input('stripped-text')   // SendGrid (no quoted history)
            ?? $request->input('text')             // SendGrid fallback / forwardemail
            ?? $request->input('TextBody')         // Postmark
            ?? $request->input('body-plain')       // Mailgun
            ?? '';
    }

    private function extractFromName(Request $request, string $fromEmail): string
    {
        // SendGrid includes "from" as "Name <email@example.com>"
        $raw = $request->input('from') ?? $request->input('From') ?? '';
        if (preg_match('/^(.+?)\s*<[^>]+>/', $raw, $m)) {
            return trim($m[1], " \"'\t");
        }
        return explode('@', $fromEmail)[0] ?? '';
    }
}
