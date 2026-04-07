<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionExpiringSoonMail;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendExpiringSubscriptionWarnings extends Command
{
    protected $signature = 'subscriptions:send-expiring-warnings';
    protected $description = 'Send warning emails to users whose cancelled subscriptions expire in ~7 days';

    public function handle(): int
    {
        $subscriptions = Subscription::with(['plan', 'company.users'])
            ->where('status', 'cancelled')
            ->whereBetween('ends_at', [now()->addDays(6), now()->addDays(8)])
            ->get();

        $count = 0;
        foreach ($subscriptions as $sub) {
            $admins = $sub->company->users->where('role', 'admin');
            foreach ($admins as $admin) {
                Mail::to($admin->email)->queue(new SubscriptionExpiringSoonMail($admin, $sub));
                $count++;
            }
        }

        $this->info("Sent {$count} expiring subscription warning email(s) for {$subscriptions->count()} subscription(s).");

        return self::SUCCESS;
    }
}
