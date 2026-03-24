<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles inbound email webhooks from Mailgun / SendGrid / Postmark.
 *
 * Set your email provider's inbound parse / forwarding to POST to:
 *   POST /api/email/inbound
 *
 * The subject must contain the ticket number in brackets, e.g.:
 *   Re: [TKT-2026-00042] Support Request - Alex
 *
 * Mailgun:  set "routes" to match "match_header('subject', '.*TKT-.*')" → forward to webhook
 * SendGrid: Inbound Parse → webhook URL
 * Postmark: Inbound stream → webhook URL
 */
class InboundEmailController extends Controller
{
    public function handle(Request $request)
    {
        // Verify shared secret — required in production (fail closed)
        $secret   = config('services.inbound_email.secret', env('INBOUND_EMAIL_SECRET'));
        $provided = $request->input('secret') ?? $request->query('secret');
        if (!$secret) {
            Log::error('InboundEmail: INBOUND_EMAIL_SECRET not configured — rejecting webhook');
            return response()->json(['ok' => false, 'message' => 'Secret not configured'], 403);
        }
        if (!hash_equals($secret, (string) $provided)) {
            Log::warning('InboundEmail: invalid secret from ' . $request->ip());
            return response()->json(['ok' => false, 'message' => 'Invalid secret'], 403);
        }

        try {
            // Support Mailgun, SendGrid, Postmark, forwardemail.net field names
            $subject = $request->input('subject')           // Mailgun / SendGrid / forwardemail
                ?? $request->input('Subject')               // Postmark
                ?? $request->input('headerLines.subject')   // forwardemail nested
                ?? '';

            // forwardemail sends JSON with nested structure
            $feData = $request->input('text');              // forwardemail plain text
            $body = $request->input('stripped-text')        // Mailgun (no quoted history)
                ?? (is_string($feData) ? $feData : null)    // SendGrid / forwardemail
                ?? $request->input('TextBody')              // Postmark
                ?? $request->input('body-plain')            // Mailgun fallback
                ?? '';

            $fromEmail = $request->input('sender')          // Mailgun
                ?? $request->input('from')                  // SendGrid / forwardemail
                ?? $request->input('From')                  // Postmark
                ?? '';

            // Extract ticket number from subject: [TKT-2026-00042]
            if (!preg_match('/\[?(TKT-\d{4}-\d+)\]?/i', $subject, $matches)) {
                Log::info('InboundEmail: no ticket number in subject', ['subject' => $subject]);
                return response()->json(['ok' => true]); // silently ignore
            }

            $ticketNumber = strtoupper($matches[1]);
            $ticket = Ticket::where('ticket_number', $ticketNumber)->first();

            if (!$ticket) {
                Log::warning('InboundEmail: ticket not found', ['ticket_number' => $ticketNumber]);
                return response()->json(['ok' => true]);
            }

            if ($ticket->status === 'closed') {
                return response()->json(['ok' => true]);
            }

            $content = trim($body);
            if (empty($content)) {
                return response()->json(['ok' => true]);
            }

            // Determine if sender is the customer or an agent (basic check by email)
            $senderType = (strtolower($fromEmail) === strtolower($ticket->customer_email ?? ''))
                ? 'customer'
                : 'agent';

            TicketMessage::create([
                'ticket_id'   => $ticket->id,
                'sender_type' => $senderType,
                'sender_id'   => mb_substr(filter_var($fromEmail, FILTER_SANITIZE_EMAIL) ?: 'unknown', 0, 255),
                'content'     => mb_substr(strip_tags($content), 0, 10000),
            ]);

            // Reopen pending tickets when customer replies
            if ($senderType === 'customer' && $ticket->status === 'pending') {
                $ticket->update(['status' => 'open']);
            }

            Log::info('InboundEmail: message added', [
                'ticket' => $ticketNumber,
                'sender' => $senderType,
            ]);

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('InboundEmail: error', ['error' => $e->getMessage()]);
            return response()->json(['ok' => true]); // always 200 to avoid provider retries
        }
    }
}
