<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\UsageLimitNotificationService;
use Illuminate\Console\Command;

class CheckUsageLimitsCommand extends Command
{
    protected $signature = 'usage-limits:check';

    protected $description = 'Check all companies for usage limit thresholds and send email notifications';

    public function handle(UsageLimitNotificationService $service): int
    {
        $companies = Company::whereNotIn('plan', ['enterprise'])
            ->with(['subscription', 'users'])
            ->get();

        $processed = 0;
        $failed = 0;

        foreach ($companies as $company) {
            try {
                $service->checkAndNotify($company);
                $processed++;
            } catch (\Throwable $e) {
                $failed++;
                $this->error("Failed for company {$company->id}: {$e->getMessage()}");
            }
        }

        $this->info("Usage limits checked: {$processed} companies processed, {$failed} failed.");
        return self::SUCCESS;
    }
}
