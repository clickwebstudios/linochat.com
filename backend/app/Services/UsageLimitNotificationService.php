<?php

namespace App\Services;

use App\Mail\UsageLimitReachedMail;
use App\Models\Chat;
use App\Models\Company;
use App\Models\UsageLimitNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UsageLimitNotificationService
{
    /**
     * Check all limit types for a company and send notifications if thresholds are crossed.
     */
    public function checkAndNotify(Company $company): void
    {
        $plan = strtolower($company->plan ?? 'free');
        $limits = config("plan_limits.{$plan}");
        if (!$limits) return;

        $periodStart = $this->getBillingPeriodStart($company);

        // Check chat limit
        $maxChats = $limits['max_chats_per_month'] ?? null;
        if ($maxChats) {
            $projectIds = $company->projects()->pluck('id');
            $chatCount = Chat::whereIn('project_id', $projectIds)
                ->where('created_at', '>=', $periodStart)
                ->count();

            $this->evaluateAndNotify($company, 'chats', $chatCount, $maxChats, $periodStart);
        }

        // Check token limit
        $monthlyAllowance = $company->monthly_token_allowance;
        if ($monthlyAllowance > 0) {
            $tokensUsed = $company->tokens_used_this_cycle;
            $this->evaluateAndNotify($company, 'tokens', $tokensUsed, $monthlyAllowance, $periodStart);
        }
    }

    /**
     * Called inline when chat limit is hit (100%).
     */
    public function notifyChatLimitReached(Company $company): void
    {
        $plan = strtolower($company->plan ?? 'free');
        $maxChats = config("plan_limits.{$plan}.max_chats_per_month");
        if (!$maxChats) return;

        $periodStart = $this->getBillingPeriodStart($company);
        $projectIds = $company->projects()->pluck('id');
        $chatCount = Chat::whereIn('project_id', $projectIds)
            ->where('created_at', '>=', $periodStart)
            ->count();

        $this->sendIfNotAlreadySent($company, 'chats', 'reached', [
            'current' => $chatCount,
            'limit' => $maxChats,
            'percentage' => 100,
        ], $periodStart);
    }

    /**
     * Called inline when token deduction fails (100%).
     */
    public function notifyTokensExhausted(Company $company): void
    {
        $monthlyAllowance = $company->monthly_token_allowance;
        if ($monthlyAllowance <= 0) return;

        $periodStart = $this->getBillingPeriodStart($company);
        $this->sendIfNotAlreadySent($company, 'tokens', 'reached', [
            'current' => $company->tokens_used_this_cycle,
            'limit' => $monthlyAllowance,
            'percentage' => 100,
        ], $periodStart);
    }

    private function evaluateAndNotify(Company $company, string $limitType, int $current, int $limit, Carbon $periodStart): void
    {
        $percentage = ($current / $limit) * 100;

        if ($percentage >= 100) {
            // Send both warning and reached if not already sent
            $this->sendIfNotAlreadySent($company, $limitType, 'warning', [
                'current' => $current, 'limit' => $limit, 'percentage' => round($percentage),
            ], $periodStart);
            $this->sendIfNotAlreadySent($company, $limitType, 'reached', [
                'current' => $current, 'limit' => $limit, 'percentage' => round($percentage),
            ], $periodStart);
        } elseif ($percentage >= 80) {
            $this->sendIfNotAlreadySent($company, $limitType, 'warning', [
                'current' => $current, 'limit' => $limit, 'percentage' => round($percentage),
            ], $periodStart);
        }
    }

    private function sendIfNotAlreadySent(Company $company, string $limitType, string $threshold, array $usageData, Carbon $periodStart): void
    {
        $notification = UsageLimitNotification::firstOrCreate([
            'company_id' => $company->id,
            'limit_type' => $limitType,
            'threshold' => $threshold,
            'billing_period_start' => $periodStart->toDateString(),
        ], [
            'sent_at' => now(),
        ]);

        if (!$notification->wasRecentlyCreated) {
            return; // Already sent this cycle
        }

        $admins = $company->users()->where('role', 'admin')->get();
        if ($admins->isEmpty()) {
            Log::warning("UsageLimitNotification: no admin users for company {$company->id}");
            return;
        }

        foreach ($admins as $admin) {
            Mail::to($admin->email)->queue(new UsageLimitReachedMail($admin, $company, $limitType, $threshold, $usageData));
        }

        Log::info("UsageLimitNotification: sent {$threshold} notification for {$limitType} to company {$company->id}");
    }

    private function getBillingPeriodStart(Company $company): Carbon
    {
        return Carbon::now()->startOfMonth();
    }
}
