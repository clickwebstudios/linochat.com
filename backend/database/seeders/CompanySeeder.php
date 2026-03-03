<?php
namespace Database\Seeders;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder {
    public function run(): void {
        $companies = [
            ['name' => 'TechCorp Solutions', 'plan' => 'Enterprise'],
            ['name' => 'StartupXYZ', 'plan' => 'Pro'],
            ['name' => 'Global Services Inc', 'plan' => 'Starter'],
            ['name' => 'Innovation Labs', 'plan' => 'Enterprise'],
            ['name' => 'Digital Dynamics', 'plan' => 'Pro'],
            ['name' => 'NovaTech Industries', 'plan' => 'Enterprise'],
            ['name' => 'GreenLeaf Organics', 'plan' => 'Pro'],
            ['name' => 'BrightPath Education', 'plan' => 'Pro'],
            ['name' => 'Apex Fitness Co', 'plan' => 'Starter'],
            ['name' => 'CloudSync Solutions', 'plan' => 'Enterprise'],
        ];
        foreach ($companies as $data) {
            $company = Company::create(['name' => $data['name'], 'plan' => $data['plan']]);
            $plan = Plan::where('name', $data['plan'])->first();
            if ($plan) {
                Subscription::create(['company_id' => $company->id, 'plan_id' => $plan->id, 'billing_cycle' => 'monthly', 'status' => 'active', 'started_at' => now()->subMonths(rand(1, 12))]);
            }
        }
    }
}
