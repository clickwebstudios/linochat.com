<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\TokenService;
use Illuminate\Console\Command;

class TokenMonthlyCycleCommand extends Command
{
    protected $signature = 'tokens:monthly-cycle';

    protected $description = 'Run the monthly token cycle reset for all companies with active subscriptions';

    public function handle(TokenService $tokenService): int
    {
        $this->info('Starting monthly token cycle reset...');

        $processed = 0;
        $failed = 0;

        Company::whereHas('subscription', function ($query) {
            $query->where('status', 'active');
        })->chunkById(100, function ($companies) use ($tokenService, &$processed, &$failed) {
            foreach ($companies as $company) {
                try {
                    $tokenService->runMonthlyCycleReset($company);
                    $processed++;
                } catch (\Throwable $e) {
                    $failed++;
                    $this->error("Failed for company {$company->id}: {$e->getMessage()}");
                }
            }
        });

        $this->info("Done. Processed: {$processed}, Failed: {$failed}.");

        return $failed > 0 ? 1 : 0;
    }
}
