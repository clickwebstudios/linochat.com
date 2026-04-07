<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Chat;
use App\Models\Ticket;
use App\Models\TrainingDocument;
use App\Http\Resources\PlanResource;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\InvoiceResource;
use App\Mail\SubscriptionCancelledMail;
use App\Services\StripeService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

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
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found for this account'], 422);
        }
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
            'plan_name'     => 'required|string',
            'billing_cycle' => 'required|in:monthly,annual',
            'success_url'   => 'required|url',
            'cancel_url'    => 'required|url',
        ]);

        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found for this account'], 422);
        }

        try {
            if (!$company->stripe_customer_id) {
                $this->stripeService->createCustomer($company);
                $company->refresh();
            }

            $plan = Plan::whereRaw('LOWER(name) = ?', [strtolower($data['plan_name'])])->first();
            if (!$plan) {
                return response()->json(['success' => false, 'message' => 'Plan not found'], 422);
            }

            $priceIdKey = strtolower($plan->name) . '_' . $data['billing_cycle'];
            $stripePriceId = config('services.stripe.price_ids.' . $priceIdKey);

            if (!$stripePriceId) {
                return response()->json(['success' => false, 'message' => 'Stripe price not configured for this plan: ' . $priceIdKey], 422);
            }

            try {
                $url = $this->stripeService->createCheckoutSession(
                    $company,
                    $stripePriceId,
                    $data['success_url'],
                    $data['cancel_url']
                );
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                // Customer exists in wrong Stripe mode (test vs live) — recreate it
                if (str_contains($e->getMessage(), 'No such customer')) {
                    $company->update(['stripe_customer_id' => null]);
                    $this->stripeService->createCustomer($company);
                    $company->refresh();
                    $url = $this->stripeService->createCheckoutSession(
                        $company,
                        $stripePriceId,
                        $data['success_url'],
                        $data['cancel_url']
                    );
                } else {
                    throw $e;
                }
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json(['url' => $url]);
    }

    public function createPortalSession(Request $request)
    {
        $data = $request->validate(['return_url' => 'required|url']);
        $company = $request->user()->company;

        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found for this account'], 422);
        }

        if (!$company->stripe_customer_id) {
            return response()->json(['success' => false, 'message' => 'No Stripe customer found'], 404);
        }

        $url = $this->stripeService->createPortalSession($company, $data['return_url']);

        return response()->json(['url' => $url]);
    }

    public function cancelSubscription(Request $request)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:100']);
        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found for this account'], 422);
        }
        $subscription = $company->subscription()->with('plan')->first();

        if (!$subscription || !$subscription->stripe_subscription_id) {
            return response()->json(['success' => false, 'message' => 'No active subscription'], 404);
        }
        if ($subscription->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Subscription is already cancelled'], 422);
        }

        $this->stripeService->cancelSubscription($subscription->stripe_subscription_id);

        $subscription->update([
            'status'               => 'cancelled',
            'cancellation_reason'  => $data['reason'] ?? null,
        ]);

        $admins = $company->users()->where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Mail::to($admin->email)->queue(new SubscriptionCancelledMail($admin, $subscription));
        }

        return response()->json(['success' => true, 'message' => 'Subscription will be cancelled at end of billing period']);
    }

    public function upgradePaidPlan(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'plan_name'     => 'required|string',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $company = $request->user()->company;
        if (!$company || !$company->stripe_subscription_id) {
            return response()->json(['success' => false, 'message' => 'No active Stripe subscription found.'], 422);
        }

        $plan = Plan::whereRaw('LOWER(name) = ?', [strtolower($data['plan_name'])])->first();
        if (!$plan) {
            return response()->json(['success' => false, 'message' => 'Plan not found.'], 422);
        }

        $planKey = strtolower($plan->name) . '_' . $data['billing_cycle'];
        $priceId = config('services.stripe.price_ids.' . $planKey);
        if (!$priceId) {
            return response()->json(['success' => false, 'message' => 'Stripe price not configured for this plan.'], 422);
        }

        $this->stripeService->upgradeSubscription($company->stripe_subscription_id, $priceId);

        // Update local record immediately (webhook will also fire shortly after)
        $localSub = $company->subscription;
        if ($localSub) {
            $localSub->update(['plan_id' => $plan->id, 'billing_cycle' => $data['billing_cycle'], 'status' => 'active']);
        }
        $company->update(['plan' => $plan->name]);

        return response()->json(['success' => true]);
    }

    public function syncSubscription(Request $request): \Illuminate\Http\JsonResponse
    {
        $company = $request->user()->company;
        if (!$company || !$company->stripe_customer_id) {
            return response()->json(['success' => true]);
        }

        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

            $subscriptions = $stripe->subscriptions->all([
                'customer' => $company->stripe_customer_id,
                'status'   => 'active',
                'limit'    => 1,
            ]);

            if (empty($subscriptions->data)) {
                return response()->json(['success' => true]);
            }

            $stripeSub    = $subscriptions->data[0];
            $stripePriceId = $stripeSub->items->data[0]->price->id ?? null;

            $plan         = null;
            $billingCycle = null;
            if ($stripePriceId) {
                $priceIds = config('services.stripe.price_ids', []);
                $planKey  = array_search($stripePriceId, $priceIds);
                if ($planKey !== false) {
                    $parts        = explode('_', $planKey);
                    $planName     = $parts[0];
                    $billingCycle = $parts[1] ?? 'monthly';
                    $plan         = Plan::whereRaw('LOWER(name) = ?', [strtolower($planName)])->first();
                }
            }

            $renewsAt = $stripeSub->current_period_end
                ? Carbon::createFromTimestamp($stripeSub->current_period_end)
                : null;

            $company->subscription()->updateOrCreate(
                ['company_id' => $company->id],
                array_filter([
                    'stripe_subscription_id' => $stripeSub->id,
                    'status'                 => 'active',
                    'plan_id'                => $plan?->id,
                    'billing_cycle'          => $billingCycle,
                    'started_at'             => now(),
                    'renews_at'              => $renewsAt,
                ], fn($v) => $v !== null)
            );

            $companyUpdates = ['stripe_subscription_id' => $stripeSub->id];
            if ($plan) {
                $companyUpdates['plan'] = $plan->name;
            }
            $company->update($companyUpdates);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('syncSubscription failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true]);
    }

    public function downgradeSelection(Request $request)
    {
        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found for this account'], 422);
        }

        $subscription = $company->subscription()->first();

        if (!$subscription || $subscription->status !== 'cancelled') {
            return response()->json(['success' => false, 'message' => 'No cancelled subscription found'], 422);
        }

        $data = $request->validate([
            'keep_agent_ids'   => 'nullable|array',
            'keep_agent_ids.*' => 'integer',
            'keep_project_ids'   => 'nullable|array',
            'keep_project_ids.*' => 'integer',
        ]);

        // Scope submitted IDs to only those belonging to this company (prevent cross-tenant manipulation)
        $companyAgentIds = $company->users()->where('role', 'agent')->pluck('id')->toArray();
        $keepAgentIds = array_values(array_intersect($data['keep_agent_ids'] ?? [], $companyAgentIds));

        $companyProjectIds = $company->projects()->pluck('id')->toArray();
        $keepProjectIds = array_values(array_intersect($data['keep_project_ids'] ?? [], $companyProjectIds));

        // Deactivate agents not in the keep list
        $company->users()
            ->where('role', 'agent')
            ->whereNotIn('status', ['Deactivated', 'Invited'])
            ->when(count($keepAgentIds) > 0, fn($q) => $q->whereNotIn('id', $keepAgentIds))
            ->each(function ($agent) {
                $agent->update(['status' => 'Deactivated', 'deactivated_reason' => 'plan_downgrade']);
            });

        // Deactivate projects not in the keep list
        $company->projects()
            ->when(count($keepProjectIds) > 0, fn($q) => $q->whereNotIn('id', $keepProjectIds))
            ->update(['is_active' => false]);

        return response()->json(['success' => true, 'message' => 'Downgrade selection saved']);
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

    public function usage(Request $request)
    {
        $user = $request->user();
        $projectIds = $user->getCompanyProjectIds();

        $company = $user->company;
        $subscription = $company ? $company->subscription()->first() : null;
        $periodStart = $subscription && $subscription->started_at
            ? Carbon::parse($subscription->started_at)
            : Carbon::now()->startOfMonth();

        $tickets  = Ticket::whereIn('project_id', $projectIds)->where('created_at', '>=', $periodStart)->count();
        $chats    = Chat::whereIn('project_id', $projectIds)->where('created_at', '>=', $periodStart)->count();
        $storageBytes = TrainingDocument::whereIn('project_id', $projectIds)->sum('file_size');
        $storageGB = round($storageBytes / (1024 * 1024 * 1024), 2);

        return response()->json(['success' => true, 'data' => [
            'tickets'    => $tickets,
            'chats'      => $chats,
            'storage_gb' => $storageGB,
            'period_start' => $periodStart->toISOString(),
        ]]);
    }

    public function paymentMethod(Request $request)
    {
        $company = $request->user()->company;
        if (!$company || !$company->stripe_customer_id) {
            return response()->json(['success' => true, 'data' => null]);
        }
        try {
            $stripe   = new \Stripe\StripeClient(config('services.stripe.secret'));
            $customer = $stripe->customers->retrieve($company->stripe_customer_id, [
                'expand' => ['invoice_settings.default_payment_method'],
            ]);
            $pm = $customer->invoice_settings->default_payment_method ?? null;
            if (!$pm) {
                $list = $stripe->customers->allPaymentMethods($company->stripe_customer_id, ['type' => 'card', 'limit' => 1]);
                $pm = $list->data[0] ?? null;
            }
            if (!$pm || !isset($pm->card)) {
                return response()->json(['success' => true, 'data' => null]);
            }
            return response()->json(['success' => true, 'data' => [
                'brand'     => $pm->card->brand,
                'last4'     => $pm->card->last4,
                'exp_month' => $pm->card->exp_month,
                'exp_year'  => $pm->card->exp_year,
                'name'      => $pm->billing_details->name ?? $customer->name,
                'email'     => $customer->email,
            ]]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => null]);
        }
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
            'mode'              => 'payment',
            'customer'          => $company->stripe_customer_id,
            'line_items'        => [[
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
            'automatic_tax'     => ['enabled' => true],
            'customer_update'   => ['address' => 'auto', 'name' => 'auto'],
            'tax_id_collection' => ['enabled' => true],
            'metadata'          => [
                'company_id' => $company->id,
                'pack_type'  => $data['pack_type'],
                'tokens'     => $pack['tokens'],
                'type'       => 'token_topup',
            ],
            'success_url'       => $data['success_url'],
            'cancel_url'        => $data['cancel_url'],
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

    public function tokenTransactions(Request $request)
    {
        $company = $request->user()->company;
        if (!$company) return response()->json(['success' => true, 'data' => []]);

        $transactions = $company->tokenTransactions()
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'action_type'  => $t->action_type,
                'tokens_amount'=> $t->tokens_amount,
                'balance_after'=> $t->balance_after,
                'created_at'   => $t->created_at->toIso8601String(),
                'metadata'     => $t->metadata,
            ]);

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    public function stripeInvoices(Request $request)
    {
        $company = $request->user()->company;
        if (!$company || !$company->stripe_customer_id) {
            return response()->json(['success' => true, 'data' => []]);
        }
        try {
            $invoices = $this->stripeService->listInvoices($company->stripe_customer_id);
            return response()->json(['success' => true, 'data' => $invoices]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'data' => []]);
        }
    }
}
