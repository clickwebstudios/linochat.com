<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\StripeClient;

class SetupStripeTestProducts extends Command
{
    protected $signature = 'stripe:setup-test-products';

    protected $description = 'Create Starter and Pro products/prices in Stripe test mode and output the price IDs for .env';

    public function handle(): int
    {
        $stripe = new StripeClient(config('services.stripe.secret'));

        $plans = [
            'starter' => [
                'name'           => 'Starter',
                'description'    => 'Up to 5 agents, unlimited chats & tickets, email & chat support',
                'price_monthly'  => 1900,  // $19.00
                'price_annual'   => 1500,  // $15.00/mo billed annually
            ],
            'pro' => [
                'name'           => 'Pro',
                'description'    => 'Unlimited agents, AI chatbots, advanced analytics, priority support',
                'price_monthly'  => 4900,  // $49.00
                'price_annual'   => 3900,  // $39.00/mo billed annually
            ],
        ];

        $output = [];

        foreach ($plans as $key => $plan) {
            $this->info("Creating product: {$plan['name']}...");

            $product = $stripe->products->create([
                'name'        => $plan['name'],
                'description' => $plan['description'],
            ]);

            $monthly = $stripe->prices->create([
                'product'        => $product->id,
                'currency'       => 'usd',
                'unit_amount'    => $plan['price_monthly'],
                'recurring'      => ['interval' => 'month'],
                'nickname'       => "{$plan['name']} Monthly",
            ]);

            $annual = $stripe->prices->create([
                'product'        => $product->id,
                'currency'       => 'usd',
                'unit_amount'    => $plan['price_annual'] * 12,
                'recurring'      => ['interval' => 'year'],
                'nickname'       => "{$plan['name']} Annual",
            ]);

            $this->line("  ✓ {$plan['name']} monthly: {$monthly->id}");
            $this->line("  ✓ {$plan['name']} annual:  {$annual->id}");

            $output["{$key}_monthly"] = $monthly->id;
            $output["{$key}_annual"]  = $annual->id;
        }

        $this->newLine();
        $this->info('Add these to your .env file:');
        $this->newLine();

        foreach ($output as $key => $priceId) {
            $envKey = 'STRIPE_PRICE_' . strtoupper($key);
            $this->line("{$envKey}={$priceId}");
        }

        $this->newLine();
        $this->info('Also update config/services.php price_ids array to match these keys.');

        return 0;
    }
}
