<?php
namespace Database\Seeders;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder {
    public function run(): void {
        $plans = [
            ['name' => 'Free', 'price_monthly' => 0, 'price_annual' => 0, 'is_popular' => false, 'features' => ['1 agent', '100 chats/month', 'Basic reporting', 'Email support']],
            ['name' => 'Starter', 'price_monthly' => 29, 'price_annual' => 290, 'is_popular' => false, 'features' => ['5 agents', '1,000 chats/month', 'Advanced reporting', 'Priority support', 'Integrations']],
            ['name' => 'Pro', 'price_monthly' => 79, 'price_annual' => 790, 'is_popular' => true, 'features' => ['20 agents', 'Unlimited chats', 'Custom reports', '24/7 support', 'All integrations', 'AI features']],
            ['name' => 'Enterprise', 'price_monthly' => 199, 'price_annual' => 1990, 'is_popular' => false, 'features' => ['Unlimited agents', 'Unlimited chats', 'Custom analytics', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'SSO', 'AI Automation']],
        ];
        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
