<?php
namespace Database\Seeders;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder {
    public function run(): void {
        $this->seedCompanyTickets('TechCorp Solutions', [
            ['subject' => 'Cannot access dashboard after latest update',  'status' => 'open',    'priority' => 'high',   'customer_name' => 'John Doe',      'customer_email' => 'john@example.com',    'description' => 'After upgrading to v2.4 the dashboard shows a blank screen. Cleared cache, still broken. Affects all team members.'],
            ['subject' => 'Payment not processing — Stripe error 402',    'status' => 'open',    'priority' => 'high',   'customer_name' => 'Jane Smith',    'customer_email' => 'jane@example.com',    'description' => 'Getting Stripe error 402 on checkout. Card is valid and has funds. Started happening 2 hours ago.'],
            ['subject' => 'Feature request: dark mode for agent dashboard','status' => 'pending', 'priority' => 'medium', 'customer_name' => 'Bob Wilson',    'customer_email' => 'bob@example.com',     'description' => 'Our agents work night shifts and would really benefit from a dark mode option. Happy to beta test.'],
            ['subject' => 'CSV export truncates rows over 10,000',        'status' => 'pending', 'priority' => 'low',    'customer_name' => 'Alice Brown',   'customer_email' => 'alice@example.com',   'description' => 'When exporting more than 10,000 rows to CSV the file is cut off. We have 45,000 tickets to export.'],
            ['subject' => 'SSO login broken after Okta config change',    'status' => 'open',    'priority' => 'high',   'customer_name' => 'Eve Martinez',  'customer_email' => 'eve@example.com',     'description' => 'After updating our Okta SAML settings the SSO redirect loop indefinitely. Works fine with password login.'],
            ['subject' => 'API rate limit too low for our use case',      'status' => 'closed',  'priority' => 'medium', 'customer_name' => 'Frank Lee',     'customer_email' => 'frank@example.com',   'description' => 'We hit the 1,000 req/min limit during peak hours. Requesting a custom limit increase for our Enterprise plan.'],
            ['subject' => 'Billing discrepancy — charged for cancelled plan', 'status' => 'pending', 'priority' => 'high', 'customer_name' => 'Grace Kim', 'customer_email' => 'grace@example.com',   'description' => 'We downgraded from Enterprise to Pro on Feb 28 but were charged the Enterprise rate on March 1.'],
            ['subject' => 'Webhook not firing for ticket.updated event',  'status' => 'open',    'priority' => 'medium', 'customer_name' => 'Henry Park',    'customer_email' => 'henry@example.com',   'description' => 'Our webhook endpoint receives chat.created fine but ticket.updated never fires. Endpoint is correct.'],
            ['subject' => 'Mobile app crashes on Android 14',            'status' => 'open',    'priority' => 'high',   'customer_name' => 'Iris Nguyen',   'customer_email' => 'iris@example.com',    'description' => 'App crashes immediately on launch on Pixel 8 running Android 14. Works fine on Android 13.'],
            ['subject' => 'Bulk assign tickets to agent not working',     'status' => 'closed',  'priority' => 'low',    'customer_name' => 'Jack Turner',   'customer_email' => 'jack@example.com',    'description' => 'Selecting 20+ tickets and clicking "Assign to Agent" shows success toast but assignments don\'t save.'],
        ]);

        $this->seedCompanyTickets('StartupXYZ', [
            ['subject' => 'Zapier trigger not working for new signups',   'status' => 'open',    'priority' => 'high',   'customer_name' => 'Lucy Patel',    'customer_email' => 'lucy@startuptest.com', 'description' => 'The Zapier trigger "New Signup" stopped firing 3 days ago. Existing Zaps are broken.'],
            ['subject' => 'Onboarding step 3 button unresponsive on iOS', 'status' => 'pending', 'priority' => 'medium', 'customer_name' => 'Marco Rossi',   'customer_email' => 'marco@example.com',   'description' => 'On iPhone 15 with Safari, the "Complete Setup" button on step 3 does nothing. Works on desktop.'],
            ['subject' => 'Cannot invite team member — email not sent',   'status' => 'open',    'priority' => 'medium', 'customer_name' => 'Sara Woods',    'customer_email' => 'sara@example.com',    'description' => 'Invited 3 team members but none received the invite email. Checked spam folders.'],
        ]);

        $this->seedCompanyTickets('Global Services Inc', [
            ['subject' => 'Bulk user import fails for rows > 500',        'status' => 'open',    'priority' => 'high',   'customer_name' => 'Oliver Marsh',  'customer_email' => 'oliver@globaltest.com','description' => 'CSV import succeeds for small files but hangs and times out when importing 500+ users.'],
            ['subject' => 'Report PDF export shows corrupted fonts',      'status' => 'pending', 'priority' => 'medium', 'customer_name' => 'Chloe Durand',  'customer_email' => 'chloe@example.com',   'description' => 'The monthly report PDF shows garbled characters for non-ASCII names (accented letters).'],
        ]);
    }

    private function seedCompanyTickets(string $companyName, array $tickets): void {
        $company  = Company::where('name', $companyName)->first();
        $projects = Project::where('company_id', $company?->id)->get();
        $agents   = User::where('role', 'agent')->where('company_id', $company?->id)->get();

        if ($projects->isEmpty()) return;

        foreach ($tickets as $data) {
            $agent = $agents->isNotEmpty() ? $agents->random() : null;
            Ticket::create(array_merge($data, [
                'project_id'  => $projects->random()->id,
                'assigned_to' => $agent?->id,
            ]));
        }
    }
}
