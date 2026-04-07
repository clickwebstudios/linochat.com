<?php

namespace App\Mail;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionExpiringSoonMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $subscription;
    public $planName;
    public $endsAt;
    public $billingUrl;
    public $selectionUrl;

    public function __construct(User $user, Subscription $subscription)
    {
        $this->user = $user;
        $this->subscription = $subscription;
        $this->planName = $subscription->plan?->name ?? 'your';
        $this->endsAt = $subscription->ends_at ?? $subscription->renews_at;
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://linochat.com')), '/');
        $this->billingUrl = $frontendUrl . '/dashboard/billing';
        $this->selectionUrl = $frontendUrl . '/dashboard/billing/downgrade-selection';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your LinoChat subscription expires in 7 days',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-expiring-soon',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
