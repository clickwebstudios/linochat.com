<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

class PurgeExpiredCompanyData extends Command
{
    protected $signature = 'subscriptions:purge-expired-data';
    protected $description = 'Deactivate excess company data 30 days after subscription expiry (Free plan limits)';

    // Free plan limits
    const FREE_AGENT_LIMIT = 1;
    const FREE_PROJECT_LIMIT = 1;
    const FREE_KB_ARTICLE_LIMIT = 10;

    public function handle(): int
    {
        $cutoff = now()->subDays(30);

        $subscriptions = Subscription::with('company')
            ->where('status', 'cancelled')
            ->where('ends_at', '<=', $cutoff)
            ->whereHas('company', fn($q) => $q->where('plan', 'Free'))
            ->get();

        foreach ($subscriptions as $sub) {
            $company = $sub->company;
            if (!$company) {
                continue;
            }

            $this->purgeAgents($company);
            $this->purgeProjects($company);
            $this->purgeKbArticles($company);
        }

        $this->info("Purged data for {$subscriptions->count()} expired subscription(s).");

        return self::SUCCESS;
    }

    private function purgeAgents($company): void
    {
        $company->users()
            ->where('role', 'agent')
            ->whereNotIn('status', ['Deactivated', 'Invited'])
            ->orderBy('id')
            ->skip(self::FREE_AGENT_LIMIT)
            ->each(function ($agent) {
                $agent->update(['status' => 'Deactivated', 'deactivated_reason' => 'plan_downgrade']);
            });
    }

    private function purgeProjects($company): void
    {
        $company->projects()
            ->orderBy('id')
            ->skip(self::FREE_PROJECT_LIMIT)
            ->each(function ($project) {
                $project->update(['is_active' => false]);
            });
    }

    private function purgeKbArticles($company): void
    {
        $company->projects()->each(function ($project) {
            \App\Models\KbArticle::where('project_id', $project->id)
                ->orderBy('id')
                ->skip(self::FREE_KB_ARTICLE_LIMIT)
                ->each(function ($article) {
                    $article->update(['status' => 'archived']);
                });
        });
    }
}
