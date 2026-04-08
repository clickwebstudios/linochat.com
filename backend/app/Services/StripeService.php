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
            'customer'          => $company->stripe_customer_id,
            'mode'              => 'subscription',
            'line_items'        => [
                [
                    'price'    => $stripePriceId,
                    'quantity' => 1,
                ],
            ],
            'automatic_tax'     => ['enabled' => true],
            'customer_update'   => ['address' => 'auto', 'name' => 'auto'],
            'tax_id_collection' => ['enabled' => true],
            'success_url'       => $successUrl,
            'cancel_url'        => $cancelUrl,
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

    public function cancelSubscription(string $stripeSubscriptionId): \Stripe\Subscription
    {
        return $this->stripe->subscriptions->update($stripeSubscriptionId, [
            'cancel_at_period_end' => true,
        ]);
    }

    public function resumeSubscription(string $stripeSubscriptionId): void
    {
        $this->stripe->subscriptions->update($stripeSubscriptionId, [
            'cancel_at_period_end' => false,
        ]);
    }

    public function upgradeSubscription(string $stripeSubscriptionId, string $newPriceId): void
    {
        $stripeSub = $this->stripe->subscriptions->retrieve($stripeSubscriptionId);
        $itemId = $stripeSub->items->data[0]->id;

        $this->stripe->subscriptions->update($stripeSubscriptionId, [
            'items'              => [['id' => $itemId, 'price' => $newPriceId]],
            'proration_behavior' => 'create_prorations',
        ]);
    }

    public function listInvoices(string $stripeCustomerId, int $limit = 50): array
    {
        $invoices = $this->stripe->invoices->all([
            'customer' => $stripeCustomerId,
            'limit'    => $limit,
            'expand'   => ['data.charge'],
        ]);

        return array_map(function ($inv) {
            return [
                'id'          => $inv->id,
                'number'      => $inv->number ?? $inv->id,
                'amount'      => $inv->amount_paid / 100,
                'currency'    => strtoupper($inv->currency),
                'status'      => $inv->status,
                'created_at'  => date('Y-m-d\TH:i:s\Z', $inv->created),
                'pdf_url'     => $inv->invoice_pdf,
                'hosted_url'  => $inv->hosted_invoice_url,
            ];
        }, $invoices->data);
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
