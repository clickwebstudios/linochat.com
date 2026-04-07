<?php

namespace App\Http\Controllers\Api;

use App\Enums\TokenActionType;
use App\Http\Controllers\Controller;
use App\Mail\SubscriptionExpiredMail;
use App\Mail\SubscriptionReactivatedMail;
use App\Models\Company;
use App\Models\Plan;
use App\Models\TokenPurchase;
use App\Services\StripeService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
            $event = $this->stripeService->constructWebhookEvent($payload, $sigHeader ?? '');
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        match ($event->type) {
            'checkout.session.completed'    => $this->handleCheckoutSessionCompleted($event->data->object),
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

    private function handleCheckoutSessionCompleted(object $session): void
    {
        try {
            if ($session->mode === 'payment') {
                // Token top-up: find pending purchase keyed by checkout session ID
                $purchase = TokenPurchase::where('stripe_payment_intent_id', $session->id)->first();

                if (!$purchase) {
                    Log::warning('Stripe webhook: TokenPurchase not found for checkout.session.completed (payment)', [
                        'session_id' => $session->id,
                    ]);
                    return;
                }

                $this->tokenService->completeTopUp($purchase);
            } elseif ($session->mode === 'subscription') {
                // Subscription checkout: activate plan
                $company = Company::where('stripe_customer_id', $session->customer)->first();

                if (!$company) {
                    Log::warning('Stripe webhook: Company not found for checkout.session.completed (subscription)', [
                        'customer_id' => $session->customer,
                        'session_id'  => $session->id,
                    ]);
                    return;
                }

                $stripeSubscriptionId = $session->subscription ?? null;
                if ($stripeSubscriptionId) {
                    // Resolve plan from Stripe price ID
                    $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
                    $stripeSub = $stripe->subscriptions->retrieve($stripeSubscriptionId, [
                        'expand' => ['latest_invoice.lines'],
                    ]);
                    $stripePriceId = $stripeSub->items->data[0]->price->id ?? null;

                    $plan = null;
                    $billingCycle = null;
                    if ($stripePriceId) {
                        $priceIds = config('services.stripe.price_ids', []);
                        $planKey = array_search($stripePriceId, $priceIds);
                        if ($planKey !== false) {
                            $parts = explode('_', $planKey);
                            $planName = $parts[0];
                            $billingCycle = $parts[1] ?? 'monthly';
                            $plan = \App\Models\Plan::whereRaw('LOWER(name) = ?', [strtolower($planName)])->first();
                        }
                    }

                    $periodEnd = $stripeSub->current_period_end
                        ?? ($stripeSub->latest_invoice->lines->data[0]->period->end ?? null);
                    $renewsAt = $periodEnd
                        ? \Illuminate\Support\Carbon::createFromTimestamp($periodEnd)
                        : null;

                    $localSubscription = $company->subscription;
                    if ($localSubscription) {
                        $localSubscription->update(array_filter([
                            'stripe_subscription_id' => $stripeSubscriptionId,
                            'status'                 => 'active',
                            'plan_id'                => $plan?->id,
                            'billing_cycle'          => $billingCycle,
                            'started_at'             => now(),
                            'renews_at'              => $renewsAt,
                        ], fn($v) => $v !== null));
                    }

                    $companyUpdates = ['stripe_subscription_id' => $stripeSubscriptionId];
                    if ($plan) {
                        $companyUpdates['plan'] = $plan->name;
                    }
                    $company->update($companyUpdates);
                }
            }
        } catch (\Exception $e) {
            Log::error('Stripe webhook: error handling checkout.session.completed', [
                'session_id' => $session->id,
                'error'      => $e->getMessage(),
            ]);
        }
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

            $stripePriceId = $subscription->items->data[0]->price->id ?? null;
            $plan = null;
            $billingCycle = null;
            if ($stripePriceId) {
                $priceIds = config('services.stripe.price_ids', []);
                $planKey = array_search($stripePriceId, $priceIds);
                if ($planKey !== false) {
                    $parts = explode('_', $planKey);
                    $billingCycle = $parts[1] ?? 'monthly';
                    $plan = \App\Models\Plan::whereRaw('LOWER(name) = ?', [strtolower($parts[0])])->first();
                }
            }

            $localSubscription = $company->subscription;

            $periodEnd = $subscription->current_period_end ?? null;
            $renewsAt = $periodEnd
                ? \Illuminate\Support\Carbon::createFromTimestamp($periodEnd)
                : null;

            if ($localSubscription) {
                $localSubscription->update(array_filter([
                    'stripe_subscription_id' => $subscription->id,
                    'status'                 => $subscription->status,
                    'plan_id'                => $plan?->id,
                    'billing_cycle'          => $billingCycle,
                    'renews_at'              => $renewsAt,
                ], fn($v) => $v !== null));
            }

            $companyUpdates = ['stripe_subscription_id' => $subscription->id];
            if ($plan) {
                $companyUpdates['plan'] = $plan->name;
            }

            // On re-subscribe (transitioning from cancelled/expired back to active), restore agents
            $wasInactive = $localSubscription && in_array($localSubscription->status, ['cancelled', 'expired']);
            $isNowActive = $subscription->status === 'active';

            if ($wasInactive && $isNowActive) {
                $company->users()
                    ->where('role', 'agent')
                    ->where('status', 'Deactivated')
                    ->where('deactivated_reason', 'plan_downgrade')
                    ->update(['status' => 'Active', 'deactivated_reason' => null]);

                // Reset token allowance for new plan
                $planAllowances = ['Free' => 100, 'Starter' => 1000, 'Pro' => 5000, 'Enterprise' => 20000];
                $newPlanName = $plan?->name ?? $company->plan;
                if (isset($planAllowances[$newPlanName])) {
                    $companyUpdates['monthly_token_allowance'] = $planAllowances[$newPlanName];
                    $companyUpdates['token_balance'] = $planAllowances[$newPlanName];
                }

                // Send reactivation email to admins
                $subscription_model = $localSubscription->load('plan');
                $admins = $company->users()->where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    Mail::to($admin->email)->queue(new SubscriptionReactivatedMail($admin, $subscription_model));
                }
            }

            $company->update($companyUpdates);
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

                // Downgrade company plan to Free
                $freePlan = Plan::where('name', 'Free')->first();
                if ($freePlan) {
                    $localSubscription->update(['plan_id' => $freePlan->id]);
                    $company->update([
                        'plan'                   => 'Free',
                        'monthly_token_allowance' => 100,
                        'token_balance'           => 100,
                    ]);
                }

                // Soft-lock agents beyond the Free plan limit (1 agent)
                $freeAgentLimit = 1;
                $company->users()
                    ->where('role', 'agent')
                    ->whereNotIn('status', ['Deactivated', 'Invited'])
                    ->orderBy('id')
                    ->skip($freeAgentLimit)
                    ->each(function ($agent) {
                        $agent->update(['status' => 'Deactivated', 'deactivated_reason' => 'plan_downgrade']);
                    });

                // Send expiry email to admins
                $admins = $company->users()->where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    Mail::to($admin->email)->queue(new SubscriptionExpiredMail($admin));
                }
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
