<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $billingUrl;

    public function __construct(User $user)
    {
        $this->user = $user;
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://linochat.com')), '/');
        $this->billingUrl = $frontendUrl . '/dashboard/billing';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your LinoChat subscription has expired — you\'re now on Free',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-expired',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
