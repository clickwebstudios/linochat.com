<?php

namespace App\Services;

use App\Enums\TokenActionType;
use App\Models\Company;
use App\Models\TokenTransaction;
use App\Models\TokenPurchase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TokenService
{
    /**
     * Deduct tokens for a usage action. Returns false if balance insufficient.
     */
    public function deduct(Company $company, TokenActionType $action, ?string $referenceId = null, array $metadata = []): bool
    {
        $cost = $action->tokenCost();
        if ($cost === 0) return true;

        return DB::transaction(function () use ($company, $action, $cost, $referenceId, $metadata) {
            // Re-read with lock
            $company = Company::lockForUpdate()->findOrFail($company->id);

            if ($company->token_balance < $cost) {
                $companyId = $company->id;
                dispatch(function () use ($companyId) {
                    $c = Company::find($companyId);
                    if ($c) app(UsageLimitNotificationService::class)->notifyTokensExhausted($c);
                })->afterResponse();
                return false;
            }

            $company->decrement('token_balance', $cost);
            $company->increment('tokens_used_this_cycle', $cost);
            $company->refresh();

            TokenTransaction::create([
                'company_id'    => $company->id,
                'action_type'   => $action->value,
                'tokens_amount' => -$cost,
                'balance_after' => $company->token_balance,
                'reference_id'  => $referenceId,
                'metadata'      => $metadata ?: null,
            ]);

            return true;
        });
    }

    /**
     * Credit tokens (grant, top-up, rollover).
     */
    public function credit(Company $company, int $amount, TokenActionType $action, ?string $referenceId = null, array $metadata = []): void
    {
        DB::transaction(function () use ($company, $amount, $action, $referenceId, $metadata) {
            $company = Company::lockForUpdate()->findOrFail($company->id);
            $company->increment('token_balance', $amount);
            $company->refresh();

            TokenTransaction::create([
                'company_id'    => $company->id,
                'action_type'   => $action->value,
                'tokens_amount' => $amount,
                'balance_after' => $company->token_balance,
                'reference_id'  => $referenceId,
                'metadata'      => $metadata ?: null,
            ]);
        });
    }

    /**
     * Complete a top-up purchase and credit tokens.
     */
    public function completeTopUp(TokenPurchase $purchase): void
    {
        if ($purchase->status === 'completed') return;

        DB::transaction(function () use ($purchase) {
            $purchase->update(['status' => 'completed', 'completed_at' => now()]);
            $this->credit(
                $purchase->company,
                $purchase->tokens_purchased,
                TokenActionType::TopUp,
                $purchase->stripe_payment_intent_id,
                ['pack_type' => $purchase->pack_type]
            );
        });
    }

    /**
     * Run monthly cycle reset: rollover unused included tokens, grant new allowance.
     */
    public function runMonthlyCycleReset(Company $company): void
    {
        DB::transaction(function () use ($company) {
            $company = Company::lockForUpdate()->findOrFail($company->id);
            $rollover = max(0, $company->token_balance - $company->tokens_used_this_cycle);
            // Reset used counter, note rollover, grant new allowance
            $company->update([
                'token_rollover'         => $rollover,
                'tokens_used_this_cycle' => 0,
                'token_cycle_reset_at'   => now(),
            ]);
            // Grant new monthly allowance
            $this->credit($company, $company->monthly_token_allowance, TokenActionType::MonthlyGrant);
        });
    }

    /**
     * Get top-up pack definitions.
     */
    public static function topUpPacks(): array
    {
        return [
            'starter_pack' => ['tokens' => 500,   'price_cents' => 700,   'label' => 'Starter Pack'],
            'growth_pack'  => ['tokens' => 2000,  'price_cents' => 2400,  'label' => 'Growth Pack'],
            'power_pack'   => ['tokens' => 5000,  'price_cents' => 5000,  'label' => 'Power Pack'],
            'scale_pack'   => ['tokens' => 15000, 'price_cents' => 12000, 'label' => 'Scale Pack'],
        ];
    }

    /**
     * Check if company has sufficient balance for an action.
     */
    public function canAfford(Company $company, TokenActionType $action): bool
    {
        return $company->token_balance >= $action->tokenCost();
    }
}
