<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily auto-learn: review resolved chats and generate KB articles
Schedule::job(new \App\Jobs\DailyAutoLearnJob)->dailyAt('03:00');

// Chat inactivity: follow-up + auto-close silent chats
Schedule::job(new \App\Jobs\ChatInactivityJob)->everyMinute()->withoutOverlapping();

// Subscription lifecycle
Schedule::command('subscriptions:send-expiring-warnings')->dailyAt('09:00');
Schedule::command('subscriptions:purge-expired-data')->dailyAt('04:00');

// Usage limit email notifications (80% warning, 100% reached)
Schedule::command('usage-limits:check')->dailyAt('10:00');
