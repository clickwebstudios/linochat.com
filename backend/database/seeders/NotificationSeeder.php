<?php
namespace Database\Seeders;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder {
    public function run(): void {
        // ── Notifications for TechCorp Admin ─────────────────────────────────
        $this->seedFor('admin@linochat.com', [
            ['type' => 'alert',    'title' => 'High CPU Usage Alert',         'description' => 'Server CPU usage exceeded 90% for the last 10 minutes. Consider scaling up.',          'read_at' => null,  'hours_ago' => 1],
            ['type' => 'security', 'title' => 'Failed Login Attempts',        'description' => 'Multiple failed login attempts detected for user john@example.com from IP 203.0.113.5.','read_at' => null,  'hours_ago' => 3],
            ['type' => 'user',     'title' => 'New Agent Joined',             'description' => 'Sarah Chen has joined the TechCorp Solutions team as a Support Agent.',                 'read_at' => 'now', 'hours_ago' => 6],
            ['type' => 'billing',  'title' => 'Payment Successful',           'description' => 'Monthly subscription payment of $199 (Enterprise plan) was processed successfully.',    'read_at' => 'now', 'hours_ago' => 24],
            ['type' => 'system',   'title' => 'System Update Complete',       'description' => 'LinoChat has been updated to version 2.4.1. See release notes for what\'s new.',        'read_at' => 'now', 'hours_ago' => 48],
            ['type' => 'success',  'title' => 'Daily Backup Completed',       'description' => 'Database backup completed successfully at 03:00 UTC. Size: 2.4 GB.',                    'read_at' => 'now', 'hours_ago' => 20],
            ['type' => 'alert',    'title' => 'High Ticket Volume',           'description' => 'Ticket volume is 45% above average today. Consider adding more agents.',                 'read_at' => null,  'hours_ago' => 2],
            ['type' => 'user',     'title' => 'Agent Status Changed',         'description' => 'Emma Davis changed her status to Away. 3 chats may need reassignment.',                  'read_at' => null,  'hours_ago' => 4],
            ['type' => 'success',  'title' => 'Knowledge Base Updated',       'description' => 'AI generated 5 new articles from your website. Review them in the KB section.',          'read_at' => 'now', 'hours_ago' => 72],
            ['type' => 'billing',  'title' => 'Upcoming Renewal Reminder',   'description' => 'Your Enterprise plan renews in 7 days on April 1 for $199.',                             'read_at' => null,  'hours_ago' => 12],
        ]);

        // ── Notifications for StartupXYZ Admin ───────────────────────────────
        $this->seedFor('admin@startupxyz.com', [
            ['type' => 'user',     'title' => 'New Team Member Invited',      'description' => 'You invited nina@startupxyz.com to join as an Agent. Invite pending.',                  'read_at' => null,  'hours_ago' => 1],
            ['type' => 'alert',    'title' => 'Zapier Integration Error',     'description' => 'Webhook delivery to Zapier failed 12 times in the last hour. Check your endpoint.',     'read_at' => null,  'hours_ago' => 2],
            ['type' => 'billing',  'title' => 'Trial Ending Soon',            'description' => 'Your 14-day free trial ends in 3 days. Upgrade to Pro to keep all features.',           'read_at' => null,  'hours_ago' => 5],
            ['type' => 'success',  'title' => 'First Chat Resolved',          'description' => 'Priya Sharma resolved the first customer chat. Great start!',                            'read_at' => 'now', 'hours_ago' => 10],
            ['type' => 'system',   'title' => 'Widget Installed',             'description' => 'The LinoChat widget was detected on app.startupxyz.com. You\'re live!',                 'read_at' => 'now', 'hours_ago' => 36],
        ]);

        // ── Notifications for Global Services Admin ───────────────────────────
        $this->seedFor('admin@globalservices.com', [
            ['type' => 'alert',    'title' => 'Bulk Import Failed',           'description' => 'CSV import of 750 users failed at row 501. File may exceed size limits.',               'read_at' => null,  'hours_ago' => 1],
            ['type' => 'user',     'title' => 'Agent Offline',               'description' => 'Amir Hassan has been offline for 2 hours. 4 chats are unassigned.',                      'read_at' => null,  'hours_ago' => 2],
            ['type' => 'billing',  'title' => 'Invoice Ready',               'description' => 'Your February invoice for $29 (Starter plan) is ready to download.',                     'read_at' => 'now', 'hours_ago' => 48],
            ['type' => 'success',  'title' => 'Report Generated',            'description' => 'Monthly performance report for February is ready. Download from Reports.',               'read_at' => 'now', 'hours_ago' => 24],
        ]);

        // ── Notifications for Superadmin ──────────────────────────────────────
        $this->seedFor('superadmin@linochat.com', [
            ['type' => 'user',     'title' => 'New Company Registered',       'description' => 'CloudSync Solutions signed up for Enterprise plan.',                                     'read_at' => null,  'hours_ago' => 1],
            ['type' => 'user',     'title' => 'New Company Registered',       'description' => 'BrightPath Education signed up for Pro plan.',                                          'read_at' => null,  'hours_ago' => 3],
            ['type' => 'billing',  'title' => 'MRR Milestone Reached',       'description' => 'Monthly Recurring Revenue crossed $10,000. Current MRR: $10,240.',                      'read_at' => null,  'hours_ago' => 6],
            ['type' => 'alert',    'title' => 'Company Trial Expiring',       'description' => 'StartupXYZ trial expires in 3 days. No payment method on file.',                        'read_at' => null,  'hours_ago' => 8],
            ['type' => 'security', 'title' => 'Suspicious Activity Detected', 'description' => 'Unusual API usage spike from Innovation Labs (1,200 req/min vs limit of 1,000).',      'read_at' => null,  'hours_ago' => 2],
            ['type' => 'system',   'title' => 'Database Backup Complete',     'description' => 'Full platform backup completed at 03:00 UTC. Stored in S3 for 30 days.',                'read_at' => 'now', 'hours_ago' => 20],
            ['type' => 'user',     'title' => 'Company Churned',             'description' => 'Apex Fitness Co cancelled their Starter plan after 3 months.',                           'read_at' => 'now', 'hours_ago' => 72],
            ['type' => 'success',  'title' => 'Platform Uptime 99.99%',      'description' => 'LinoChat maintained 99.99% uptime in February. 0 incidents reported.',                  'read_at' => 'now', 'hours_ago' => 48],
        ]);
    }

    private function seedFor(string $email, array $notifications): void {
        $user = User::where('email', $email)->first();
        if (!$user) return;

        foreach ($notifications as $n) {
            AppNotification::create([
                'user_id'     => $user->id,
                'type'        => $n['type'],
                'title'       => $n['title'],
                'description' => $n['description'],
                'read_at'     => $n['read_at'] === 'now' ? now() : null,
                'created_at'  => now()->subHours($n['hours_ago']),
                'updated_at'  => now()->subHours($n['hours_ago']),
            ]);
        }
    }
}
