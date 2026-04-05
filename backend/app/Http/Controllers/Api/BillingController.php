<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Http\Resources\PlanResource;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\InvoiceResource;
use App\Services\StripeService;
use App\Services\TokenService;
use Illuminate\Http\Request;

class BillingController extends Controller {
    public function __construct(private StripeService $stripeService) {}

    public function plans() { return PlanResource::collection(Plan::all()); }

    public function subscription(Request $request) {
        $company = $request->user()->company;
        if (!$company) return response()->json(['data' => null]);
        $subscription = $company->subscription()->with('plan')->first();
        return $subscription ? new SubscriptionResource($subscription) : response()->json(['data' => null]);
    }

    public function updateSubscription(Request $request) {
        $data = $request->validate(['plan_id' => 'required|exists:plans,id', 'billing_cycle' => 'required|in:monthly,annual']);
        $company = $request->user()->company;
        $plan = Plan::findOrFail($data['plan_id']);
        $subscription = $company->subscription()->updateOrCreate(
            ['company_id' => $company->id],
            ['plan_id' => $plan->id, 'billing_cycle' => $data['billing_cycle'], 'status' => 'active', 'started_at' => now()]
        );
        $company->update(['plan' => $plan->name]);
        return new SubscriptionResource($subscription->load('plan'));
    }

    public function invoices(Request $request) {
        $company = $request->user()->company;
        if (!$company) return response()->json(['data' => []]);
        return InvoiceResource::collection($company->invoices()->latest('issued_at')->get());
    }

    public function createCheckoutSession(Request $request)
    {
        $data = $request->validate([
            'plan_id'       => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,annual',
            'success_url'   => 'required|url',
            'cancel_url'    => 'required|url',
        ]);

        $company = $request->user()->company;

        if (!$company->stripe_customer_id) {
            $this->stripeService->createCustomer($company);
            $company->refresh();
        }

        $plan = Plan::findOrFail($data['plan_id']);
        $priceIdKey = strtolower($plan->name) . '_' . $data['billing_cycle'];
        $stripePriceId = config('services.stripe.price_ids.' . $priceIdKey);

        if (!$stripePriceId) {
            return response()->json(['success' => false, 'message' => 'Stripe price not configured for this plan'], 422);
        }

        $url = $this->stripeService->createCheckoutSession(
            $company,
            $stripePriceId,
            $data['success_url'],
            $data['cancel_url']
        );

        return response()->json(['url' => $url]);
    }

    public function createPortalSession(Request $request)
    {
        $data = $request->validate(['return_url' => 'required|url']);
        $company = $request->user()->company;

        if (!$company->stripe_customer_id) {
            return response()->json(['success' => false, 'message' => 'No Stripe customer found'], 404);
        }

        $url = $this->stripeService->createPortalSession($company, $data['return_url']);

        return response()->json(['url' => $url]);
    }

    public function cancelSubscription(Request $request)
    {
        $company = $request->user()->company;
        $subscription = $company->subscription()->first();

        if (!$subscription || !$subscription->stripe_subscription_id) {
            return response()->json(['success' => false, 'message' => 'No active subscription'], 404);
        }

        $this->stripeService->cancelSubscription($subscription->stripe_subscription_id);

        $subscription->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Subscription will be cancelled at end of billing period']);
    }

    public function tokenBalance(Request $request)
    {
        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['success' => true, 'data' => [
                'token_balance' => 0, 'tokens_used_this_cycle' => 0,
                'monthly_token_allowance' => 0, 'token_rollover' => 0,
                'token_cycle_reset_at' => null, 'agent_count' => 0,
            ]]);
        }
        $agentCount = $company->users()->count();
        return response()->json([
            'success' => true,
            'data' => [
                'token_balance'           => (int) $company->token_balance,
                'tokens_used_this_cycle'  => (int) $company->tokens_used_this_cycle,
                'monthly_token_allowance' => (int) $company->monthly_token_allowance,
                'token_rollover'          => (int) $company->token_rollover,
                'token_cycle_reset_at'    => $company->token_cycle_reset_at,
                'agent_count'             => $agentCount,
            ],
        ]);
    }

    public function topUpPacks()
    {
        return response()->json([
            'success' => true,
            'data' => TokenService::topUpPacks(),
        ]);
    }

    public function createTopUpCheckout(Request $request)
    {
        $data = $request->validate([
            'pack_type'   => 'required|in:starter_pack,growth_pack,power_pack,scale_pack',
            'success_url' => 'required|url',
            'cancel_url'  => 'required|url',
        ]);

        $company = $request->user()->company;
        $packs   = TokenService::topUpPacks();
        $pack    = $packs[$data['pack_type']];

        if (!$company->stripe_customer_id) {
            $this->stripeService->createCustomer($company);
            $company->refresh();
        }

        $stripe  = new \Stripe\StripeClient(config('services.stripe.secret'));
        $session = $stripe->checkout->sessions->create([
            'mode'        => 'payment',
            'customer'    => $company->stripe_customer_id,
            'line_items'  => [[
                'price_data' => [
                    'currency'     => 'usd',
                    'unit_amount'  => $pack['price_cents'],
                    'product_data' => [
                        'name'        => $pack['label'],
                        'description' => "{$pack['tokens']} AI tokens for LinoChat",
                    ],
                ],
                'quantity' => 1,
            ]],
            'metadata'    => [
                'company_id' => $company->id,
                'pack_type'  => $data['pack_type'],
                'tokens'     => $pack['tokens'],
                'type'       => 'token_topup',
            ],
            'success_url' => $data['success_url'],
            'cancel_url'  => $data['cancel_url'],
        ]);

        // Record pending purchase keyed by checkout session ID
        \App\Models\TokenPurchase::create([
            'company_id'               => $company->id,
            'pack_type'                => $data['pack_type'],
            'tokens_purchased'         => $pack['tokens'],
            'amount_paid'              => $pack['price_cents'] / 100,
            'stripe_payment_intent_id' => $session->id,
            'status'                   => 'pending',
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function createTopUpIntent(Request $request)
    {
        $data = $request->validate([
            'pack_type' => 'required|in:starter_pack,growth_pack,power_pack,scale_pack',
        ]);

        $company = $request->user()->company;
        $packs = TokenService::topUpPacks();
        $pack = $packs[$data['pack_type']];

        // Ensure Stripe customer exists
        if (!$company->stripe_customer_id) {
            $this->stripeService->createCustomer($company);
            $company->refresh();
        }

        // Create PaymentIntent
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));
        $intent = $stripe->paymentIntents->create([
            'amount'   => $pack['price_cents'],
            'currency' => 'usd',
            'customer' => $company->stripe_customer_id,
            'metadata' => [
                'company_id' => $company->id,
                'pack_type'  => $data['pack_type'],
                'tokens'     => $pack['tokens'],
            ],
        ]);

        // Record pending purchase
        $purchase = \App\Models\TokenPurchase::create([
            'company_id'               => $company->id,
            'pack_type'                => $data['pack_type'],
            'tokens_purchased'         => $pack['tokens'],
            'amount_paid'              => $pack['price_cents'] / 100,
            'stripe_payment_intent_id' => $intent->id,
            'status'                   => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'client_secret'  => $intent->client_secret,
                'purchase_id'    => $purchase->id,
                'tokens'         => $pack['tokens'],
                'amount'         => $pack['price_cents'] / 100,
                'label'          => $pack['label'],
            ],
        ]);
    }
}
