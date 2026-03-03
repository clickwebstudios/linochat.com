<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AgentInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $inviteeName,
        public string $companyName,
        public string $inviterName,
        public string $inviteToken,
        public string $role = 'Agent',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You\'ve been invited to join ' . $this->companyName . ' on LinoChat',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.agent-invite',
        );
    }
}
