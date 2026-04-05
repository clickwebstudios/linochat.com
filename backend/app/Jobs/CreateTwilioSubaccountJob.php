<?php
namespace App\Jobs;

use App\Models\Company;
use App\Services\TwilioService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateTwilioSubaccountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [30, 60, 120];

    public function __construct(private Company $company) {}

    public function handle(TwilioService $twilioService): void
    {
        $twilioService->createSubaccount($this->company);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('CreateTwilioSubaccountJob permanently failed', [
            'company_id' => $this->company->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
