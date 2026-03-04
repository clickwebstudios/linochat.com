<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $code;
    public string $recipientEmail;

    public function __construct(string $code, string $email)
    {
        $this->code = $code;
        $this->recipientEmail = $email;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your LinoChat Verification Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-code',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
