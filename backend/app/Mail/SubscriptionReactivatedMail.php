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

class SubscriptionReactivatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $subscription;
    public $planName;
    public $billingUrl;

    public function __construct(User $user, Subscription $subscription)
    {
        $this->user = $user;
        $this->subscription = $subscription;
        $this->planName = $subscription->plan?->name ?? 'your';
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://linochat.com')), '/');
        $this->billingUrl = $frontendUrl . '/dashboard/billing';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Welcome back! Your {$this->planName} subscription is active",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-reactivated',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
