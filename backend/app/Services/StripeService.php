<?php

namespace App\Services;

use App\Models\Company;
use Stripe\StripeClient;
use Stripe\Event;

class StripeService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    public function createCustomer(Company $company): string
    {
        $customer = $this->stripe->customers->create([
            'name'  => $company->name,
            'email' => $company->email ?? ($company->users()->where('role', 'admin')->first()?->email ?? 'unknown@placeholder.com'),
        ]);

        $company->update(['stripe_customer_id' => $customer->id]);

        return $customer->id;
    }

    public function createCheckoutSession(
        Company $company,
        string $stripePriceId,
        string $successUrl,
        string $cancelUrl
    ): string {
        $session = $this->stripe->checkout->sessions->create([
            'customer'   => $company->stripe_customer_id,
            'mode'       => 'subscription',
            'line_items' => [
                [
                    'price'    => $stripePriceId,
                    'quantity' => 1,
                ],
            ],
            'success_url' => $successUrl,
            'cancel_url'  => $cancelUrl,
        ]);

        return $session->url;
    }

    public function createPortalSession(Company $company, string $returnUrl): string
    {
        $session = $this->stripe->billingPortal->sessions->create([
            'customer'   => $company->stripe_customer_id,
            'return_url' => $returnUrl,
        ]);

        return $session->url;
    }

    public function cancelSubscription(string $stripeSubscriptionId): void
    {
        $this->stripe->subscriptions->update($stripeSubscriptionId, [
            'cancel_at_period_end' => true,
        ]);
    }

    public function constructWebhookEvent(string $payload, string $sigHeader): Event
    {
        return \Stripe\Webhook::constructEvent(
            $payload,
            $sigHeader,
            config('services.stripe.webhook_secret')
        );
    }
}
