<?php

namespace App\Mail;

use App\Models\Company;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UsageLimitReachedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $company;
    public $limitType;
    public $threshold;
    public $usageData;
    public $billingUrl;
    public $limitLabel;
    public $nextPlanFeatures;

    public function __construct(User $user, Company $company, string $limitType, string $threshold, array $usageData)
    {
        $this->user = $user;
        $this->company = $company;
        $this->limitType = $limitType;
        $this->threshold = $threshold;
        $this->usageData = $usageData;

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://linochat.com')), '/');
        $this->billingUrl = $frontendUrl . '/dashboard/billing';

        $labels = [
            'chats' => 'Monthly Chats',
            'tokens' => 'AI Tokens',
        ];
        $this->limitLabel = $labels[$limitType] ?? ucfirst($limitType);

        $this->nextPlanFeatures = $this->getNextPlanFeatures($company->plan);
    }

    public function envelope(): Envelope
    {
        $action = $this->threshold === 'reached' ? "reached your" : "used 80% of your";
        $resource = strtolower($this->limitLabel);
        return new Envelope(
            subject: "You've {$action} {$resource} limit on LinoChat",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.usage-limit-reached',
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function getNextPlanFeatures(string $currentPlan): array
    {
        $upgrades = [
            'free' => [
                'plan' => 'Starter',
                'features' => [
                    'Up to 3 workspaces',
                    'Up to 5 agents',
                    '1,000 chats per month',
                    'AI-powered responses',
                    '50 knowledge base articles',
                ],
            ],
            'starter' => [
                'plan' => 'Pro',
                'features' => [
                    'Up to 10 workspaces',
                    'Up to 20 agents',
                    'Unlimited chats',
                    '200 knowledge base articles',
                    'Advanced analytics',
                ],
            ],
        ];

        return $upgrades[strtolower($currentPlan)] ?? [
            'plan' => 'Pro',
            'features' => ['Unlimited chats', 'Advanced analytics', 'Priority support'],
        ];
    }
}
