<?php

namespace App\Services;

use App\Mail\AgentInvitationMail;
use App\Models\Invitation;
use App\Models\Project;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationService
{
    /**
     * Create an invitation record and send the email.
     * Pre-condition checks (duplicate, existing agent) stay in the caller.
     *
     * Returns ['invitation' => Invitation, 'email_sent' => bool, 'mail_driver' => string]
     */
    public function create(string $email, Project $project, array $extra = []): array
    {
        $invitation = Invitation::create([
            'project_id' => $project->id,
            'email'      => $email,
            'first_name' => $extra['first_name'] ?? null,
            'last_name'  => $extra['last_name'] ?? null,
            'role'       => $extra['role'] ?? 'agent',
            'token'      => Str::random(32),
            'status'     => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $emailSent  = false;
        $mailDriver = config('mail.default');

        try {
            Mail::to($email)->send(new AgentInvitationMail($invitation, $project));
            $emailSent = true;
        } catch (\Exception $e) {
            Log::error('Failed to send invitation email', [
                'error'         => $e->getMessage(),
                'invitation_id' => $invitation->id,
            ]);
        }

        return [
            'invitation'  => $invitation,
            'email_sent'  => $emailSent,
            'mail_driver' => $mailDriver,
        ];
    }

    /**
     * Regenerate token, extend expiry, and resend invitation email.
     * Returns true on success, false if email send failed.
     */
    public function resend(Invitation $invitation, Project $project): bool
    {
        $invitation->update([
            'token'      => Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        try {
            Mail::to($invitation->email)->send(new AgentInvitationMail($invitation, $project));
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to resend invitation email', [
                'error'         => $e->getMessage(),
                'invitation_id' => $invitation->id,
            ]);
            return false;
        }
    }

    /**
     * Build the user-facing message based on whether the email was sent.
     */
    public function buildMessage(bool $emailSent, string $action = 'sent'): string
    {
        if (!$emailSent) {
            return 'Invitation created but email could not be sent. Check mail configuration.';
        }
        if (config('mail.default') === 'log') {
            return 'Invitation created. Configure MAIL_MAILER=smtp in .env to send emails to recipients.';
        }
        return "Invitation {$action} successfully";
    }
}
