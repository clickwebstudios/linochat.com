<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\KbGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateKbFromWebsiteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The project instance.
     *
     * @var Project
     */
    protected Project $project;

    /**
     * The user ID who initiated the generation.
     *
     * @var int|null
     */
    protected ?int $userId;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 30;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(Project $project, ?int $userId = null)
    {
        $this->project = $project;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(KbGeneratorService $kbGenerator): void
    {
        Log::info('Starting KB generation job', [
            'project_id' => $this->project->id,
            'website' => $this->project->website,
            'user_id' => $this->userId,
        ]);

        try {
            // Проверяем, что у проекта есть website
            if (empty($this->project->website)) {
                Log::warning('Project has no website URL, skipping KB generation', [
                    'project_id' => $this->project->id,
                ]);
                return;
            }

            // Запускаем генерацию
            $result = $kbGenerator->generateFromWebsite(
                $this->project->id,
                $this->project->website,
                $this->userId
            );

            if ($result['success']) {
                Log::info('KB generation job completed successfully', [
                    'project_id' => $this->project->id,
                    'articles_created' => $result['data']['articles_created'] ?? 0,
                ]);
            } else {
                Log::error('KB generation job failed', [
                    'project_id' => $this->project->id,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Если есть ошибка, бросаем исключение для retry
                throw new \Exception($result['error'] ?? 'KB generation failed');
            }

        } catch (\Exception $e) {
            Log::error('Exception in KB generation job', [
                'project_id' => $this->project->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('KB generation job failed permanently', [
            'project_id' => $this->project->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
