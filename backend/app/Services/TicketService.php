<?php

namespace App\Services;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Events\MessageSent;
use App\Models\ActivityLog;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\NotificationLog;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Mail\NewTicketMail;
use App\Mail\TicketCreatedMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TicketService
{
    /**
     * Create a ticket with all side-effects:
     *   - system chat message (if linked to a chat)
     *   - initial ticket message
     *   - customer confirmation email
     *   - team notification emails
     *   - activity log entry
     *   - Frubix lead (if integration enabled)
     */
    public function create(array $data, ?User $actor = null): Ticket
    {
        $assignedTo = $data['assigned_to'] ?? null;
        $chatId     = $data['chat_id'] ?? null;

        $ticket = Ticket::create([
            'project_id'     => $data['project_id'],
            'chat_id'        => $chatId,
            'customer_email' => $data['customer_email'],
            'customer_name'  => $data['customer_name'] ?? null,
            'subject'        => $data['subject'],
            'description'    => $data['description'],
            'priority'       => $data['priority'] ?? TicketPriority::Medium->value,
            'category'       => $data['category'] ?? null,
            'status'         => $assignedTo ? TicketStatus::InProgress->value : TicketStatus::Open->value,
            'assigned_to'    => $assignedTo,
        ]);

        // ticket_number and access_token are set by the model's booted() hook
        $ticket->refresh();

        // Post a system message to the linked chat
        if ($chatId) {
            $chat = Chat::find($chatId);
            if ($chat) {
                $ticketNumber  = $ticket->ticket_number ?? ('TKT-' . $ticket->id);
                $systemMessage = ChatMessage::create([
                    'chat_id'     => $chat->id,
                    'sender_type' => 'system',
                    'content'     => "Ticket {$ticketNumber} created: {$ticket->subject}",
                ]);
                $chat->update(['last_message_at' => now()]);
                broadcast(new MessageSent($systemMessage))->toOthers();
            }
        }

        // Initial ticket message from customer
        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'customer',
            'sender_id'   => $ticket->customer_email,
            'content'     => $ticket->description,
        ]);

        $project   = Project::find($data['project_id']);
        $companyId = $project?->company_id;

        // Customer confirmation email
        try {
            $ticketUrl    = config('app.frontend_url', 'http://localhost:5174') . '/ticket/' . $ticket->access_token;
            $emailChannel = $project?->integrations['email'] ?? [];
            $replyTo      = $emailChannel['support_email'] ?? null;
            $fromName     = $emailChannel['from_name'] ?? null;
            $isVerified   = ($emailChannel['domain_auth']['status'] ?? '') === 'verified';
            $fromAddress  = ($isVerified && $replyTo) ? $replyTo : null;
            Mail::to($ticket->customer_email)->send(new TicketCreatedMail($ticket, $project->name ?? 'Support', $ticketUrl, $replyTo, $fromName, $fromAddress));
            NotificationLog::record('email', 'Ticket Created — Customer', "Ticket #{$ticket->ticket_number} created. Subject: {$ticket->subject}\n\n{$ticket->description}", $ticket->customer_email, 'sent', $companyId);
        } catch (\Exception $e) {
            Log::error('Failed to send ticket created email', ['error' => $e->getMessage()]);
            NotificationLog::record('email', 'Ticket Created — Customer', "Ticket #{$ticket->ticket_number}: {$ticket->subject}", $ticket->customer_email, 'failed', $companyId);
        }

        // Team notification emails
        if ($project) {
            $adminEmails = $project->agents()->pluck('email')->filter()->toArray();
            if ($project->user && $project->user->email) {
                $adminEmails[] = $project->user->email;
            }
            foreach (array_unique($adminEmails) as $adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new NewTicketMail($ticket));
                    NotificationLog::record('email', 'New Ticket — Admin', "New ticket #{$ticket->ticket_number} from {$ticket->customer_name}. Subject: {$ticket->subject}\n\n{$ticket->description}", $adminEmail, 'sent', $companyId);
                } catch (\Exception $e) {
                    Log::error('Failed to send new ticket email to admin', ['email' => $adminEmail, 'error' => $e->getMessage()]);
                    NotificationLog::record('email', 'New Ticket — Admin', "Ticket #{$ticket->ticket_number}: {$ticket->subject}", $adminEmail, 'failed', $companyId);
                }
            }
        }

        // Activity log
        ActivityLog::log('ticket_created', "Ticket #{$ticket->ticket_number} created", "{$ticket->customer_name} — {$ticket->subject}", [
            'company_id' => $companyId,
            'user_id'    => $actor?->id,
            'project_id' => $data['project_id'],
        ]);

        // Frubix lead
        if ($project) {
            $frubixConfig = $project->integrations['frubix'] ?? null;
            if ($frubixConfig && !empty($frubixConfig['enabled']) && !empty($frubixConfig['access_token'])) {
                try {
                    FrubixService::createLead($frubixConfig, [
                        'name'   => $ticket->customer_name ?: explode('@', $ticket->customer_email)[0],
                        'email'  => $ticket->customer_email,
                        'phone'  => $ticket->customer_phone ?? null,
                        'source' => 'linochat',
                        'status' => 'new',
                        'notes'  => "[LinoChat Ticket {$ticket->ticket_number}] {$ticket->subject}\n\n{$ticket->description}",
                    ]);
                } catch (\Exception $e) {
                    Log::info('Failed to create Frubix lead', ['ticket_id' => $ticket->id, 'error' => $e->getMessage()]);
                }
            }
        }

        return $ticket;
    }

    /**
     * Assign (or unassign) a ticket and add a system message.
     */
    public function assign(Ticket $ticket, ?int $agentId): Ticket
    {
        $oldAgent = $ticket->assignedAgent;

        $ticket->update([
            'assigned_to' => $agentId,
            'status'      => $agentId ? TicketStatus::InProgress->value : TicketStatus::Open->value,
        ]);

        $messageText = $agentId
            ? ($oldAgent
                ? "Reassigned from {$oldAgent->name} to {$ticket->fresh()->assignedAgent->name}"
                : "Assigned to {$ticket->fresh()->assignedAgent->name}")
            : 'Unassigned';

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'agent',
            'content'     => $messageText,
            'metadata'    => ['system' => true],
        ]);

        return $ticket->fresh();
    }

    /**
     * Escalate a ticket to another agent and add a system message.
     */
    public function escalate(Ticket $ticket, int $agentId, ?string $reason): Ticket
    {
        $oldAgent    = $ticket->assignedAgent;
        $targetAgent = User::find($agentId);

        $ticket->update([
            'assigned_to' => $agentId,
            'status'      => TicketStatus::InProgress->value,
        ]);

        $messageText = "Escalated to {$targetAgent->name}";
        if ($oldAgent && (string) $oldAgent->id !== (string) $agentId) {
            $messageText = "Escalated from {$oldAgent->name} to {$targetAgent->name}";
        }
        if ($reason = trim((string) $reason)) {
            $messageText .= ". Reason: {$reason}";
        }

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'agent',
            'content'     => $messageText,
            'metadata'    => ['system' => true, 'escalation' => true],
        ]);

        return $ticket->fresh(['project', 'assignedAgent', 'messages']);
    }

    /**
     * Update ticket status and add a system message.
     */
    public function updateStatus(Ticket $ticket, string $newStatus): Ticket
    {
        $oldStatus  = $ticket->status;
        $updateData = ['status' => $newStatus];

        if ($newStatus === TicketStatus::Resolved->value) {
            $updateData['resolved_at'] = now();
        }

        $ticket->update($updateData);

        TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'agent',
            'content'     => "Status changed from {$oldStatus} to {$newStatus}",
            'metadata'    => ['system' => true],
        ]);

        return $ticket->fresh();
    }

    /**
     * Send an agent reply and optionally email the customer.
     */
    public function reply(Ticket $ticket, string $content, User $agent, bool $sendEmail = true): TicketMessage
    {
        $message = TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'sender_type' => 'agent',
            'sender_id'   => $agent->id,
            'content'     => $content,
        ]);

        if ($sendEmail) {
            $this->sendEmailReply($ticket, $message);
        }

        return $message;
    }

    /**
     * Send the agent reply by email to the customer.
     * When domain is verified, sends FROM the customer's own address via SendGrid API.
     */
    public function sendEmailReply(Ticket $ticket, TicketMessage $message): void
    {
        try {
            $project      = $ticket->project;
            $emailChannel = $project?->integrations['email'] ?? [];
            $fromEmail    = $emailChannel['support_email'] ?? null;
            $fromName     = $emailChannel['from_name'] ?? ($project?->name ? $project->name . ' Support' : null) ?? config('mail.from.name');
            $replyTo      = $fromEmail ?? config('mail.from.address');
            $isVerified   = ($emailChannel['domain_auth']['status'] ?? '') === 'verified';

            if ($isVerified && $fromEmail) {
                $this->sendReplyViaSendGridApi($ticket, $message->content, $fromEmail, $fromName);
            } else {
                Mail::to($ticket->customer_email)->send(
                    new \App\Mail\TicketReplyMail($ticket, $message->content, $fromName, $replyTo, $fromName)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send ticket email reply', [
                'ticket_id' => $ticket->id,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    private function sendReplyViaSendGridApi(Ticket $ticket, string $content, string $fromEmail, string $fromName): void
    {
        $apiKey = config('services.sendgrid.api_key');
        if (!$apiKey) {
            throw new \RuntimeException('SendGrid API key not configured');
        }

        $ref     = $ticket->ticket_number ?? ('TKT-' . $ticket->id);
        $subject = 'Re: [' . $ref . '] ' . $ticket->subject;

        $response = \Illuminate\Support\Facades\Http::withToken($apiKey)
            ->post('https://api.sendgrid.com/v3/mail/send', [
                'personalizations' => [[
                    'to' => [['email' => $ticket->customer_email]],
                ]],
                'from'     => ['email' => $fromEmail, 'name' => $fromName],
                'reply_to' => ['email' => $fromEmail, 'name' => $fromName],
                'subject'  => $subject,
                'content'  => [
                    ['type' => 'text/plain', 'value' => $content],
                ],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('SendGrid API error: ' . $response->status() . ' ' . $response->body());
        }
    }
}
