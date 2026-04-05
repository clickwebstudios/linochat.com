<?php

namespace App\Http\Controllers\Api;

use App\Enums\TokenActionType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TokenPurchase;
use App\Services\StripeService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripeService $stripeService,
        private readonly TokenService $tokenService,
    ) {}

    public function handle(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = $this->stripeService->constructWebhookEvent($payload, $sigHeader);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        match ($event->type) {
            'payment_intent.succeeded'      => $this->handlePaymentIntentSucceeded($event->data->object),
            'payment_intent.payment_failed' => $this->handlePaymentIntentFailed($event->data->object),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->data->object),
            'invoice.paid'                  => $this->handleInvoicePaid($event->data->object),
            'invoice.payment_failed'        => $this->handleInvoicePaymentFailed($event->data->object),
            default                         => null,
        };

        return response()->json(['success' => true]);
    }

    private function handlePaymentIntentSucceeded(object $paymentIntent): void
    {
        try {
            $purchase = TokenPurchase::where('stripe_payment_intent_id', $paymentIntent->id)->first();

            if (!$purchase) {
                Log::warning('Stripe webhook: TokenPurchase not found for payment_intent.succeeded', [
                    'payment_intent_id' => $paymentIntent->id,
                ]);
                return;
            }

            $this->tokenService->completeTopUp($purchase);
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling payment_intent.succeeded', [
                'payment_intent_id' => $paymentIntent->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

    private function handlePaymentIntentFailed(object $paymentIntent): void
    {
        try {
            $purchase = TokenPurchase::where('stripe_payment_intent_id', $paymentIntent->id)->first();

            if (!$purchase) {
                Log::warning('Stripe webhook: TokenPurchase not found for payment_intent.payment_failed', [
                    'payment_intent_id' => $paymentIntent->id,
                ]);
                return;
            }

            $purchase->update(['status' => 'failed']);
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling payment_intent.payment_failed', [
                'payment_intent_id' => $paymentIntent->id,
                'error'             => $e->getMessage(),
            ]);
        }
    }

    private function handleSubscriptionUpdated(object $subscription): void
    {
        try {
            $company = Company::where('stripe_customer_id', $subscription->customer)->first();

            if (!$company) {
                Log::warning('Stripe webhook: Company not found for customer.subscription.updated', [
                    'customer_id'       => $subscription->customer,
                    'subscription_id'   => $subscription->id,
                ]);
                return;
            }

            $localSubscription = $company->subscription;

            if ($localSubscription) {
                $localSubscription->update([
                    'stripe_subscription_id' => $subscription->id,
                    'status'                 => $subscription->status,
                ]);
            }

            $company->update(['stripe_subscription_id' => $subscription->id]);
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling customer.subscription.updated', [
                'subscription_id' => $subscription->id,
                'error'           => $e->getMessage(),
            ]);
        }
    }

    private function handleSubscriptionDeleted(object $subscription): void
    {
        try {
            $company = Company::where('stripe_customer_id', $subscription->customer)->first();

            if (!$company) {
                Log::warning('Stripe webhook: Company not found for customer.subscription.deleted', [
                    'customer_id'     => $subscription->customer,
                    'subscription_id' => $subscription->id,
                ]);
                return;
            }

            $localSubscription = $company->subscription;

            if ($localSubscription) {
                $endsAt = $subscription->current_period_end
                    ? \Illuminate\Support\Carbon::createFromTimestamp($subscription->current_period_end)
                    : now();

                $localSubscription->update([
                    'status'  => 'cancelled',
                    'ends_at' => $endsAt,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling customer.subscription.deleted', [
                'subscription_id' => $subscription->id,
                'error'           => $e->getMessage(),
            ]);
        }
    }

    private function handleInvoicePaid(object $invoice): void
    {
        try {
            $company = Company::where('stripe_customer_id', $invoice->customer)->first();

            if (!$company) {
                Log::warning('Stripe webhook: Company not found for invoice.paid', [
                    'customer_id' => $invoice->customer,
                    'invoice_id'  => $invoice->id,
                ]);
                return;
            }

            $allowance = $company->monthly_token_allowance;

            if ($allowance <= 0) {
                return;
            }

            $this->tokenService->credit(
                $company,
                $allowance,
                TokenActionType::MonthlyGrant,
                $invoice->id,
                ['source' => 'invoice.paid', 'invoice_id' => $invoice->id],
            );
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling invoice.paid', [
                'invoice_id' => $invoice->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    private function handleInvoicePaymentFailed(object $invoice): void
    {
        try {
            $company = Company::where('stripe_customer_id', $invoice->customer)->first();

            if (!$company) {
                Log::warning('Stripe webhook: Company not found for invoice.payment_failed', [
                    'customer_id' => $invoice->customer,
                    'invoice_id'  => $invoice->id,
                ]);
                return;
            }

            $localSubscription = $company->subscription;

            if ($localSubscription) {
                $localSubscription->update(['status' => 'past_due']);
            }
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling invoice.payment_failed', [
                'invoice_id' => $invoice->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
