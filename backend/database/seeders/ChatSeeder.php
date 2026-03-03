<?php
namespace Database\Seeders;
use App\Models\Project;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder {
    public function run(): void {
        $this->seedCompanyChats('TechCorp Solutions', [
            [
                'customer_name' => 'Lisa Anderson', 'status' => 'active', 'is_ai_bot' => false, 'unread_count' => 2,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'Hi, I need help with my account. I can\'t log in after resetting my password.',         'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hello Lisa! I\'d be happy to help. Can you tell me what error message you\'re seeing?',  'is_read' => true],
                    ['sender' => 'customer', 'text' => 'It says "Invalid credentials" even though I just set the new password.',                  'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Got it. Please try clearing your browser cache and cookies, then try again.',            'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Still the same issue. This is really frustrating.',                                       'is_read' => false],
                    ['sender' => 'customer', 'text' => 'Can you just reset it for me on your end?',                                               'is_read' => false],
                ],
            ],
            [
                'customer_name' => 'Tom Baker', 'status' => 'active', 'is_ai_bot' => false, 'unread_count' => 1,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'Hey, I\'m trying to upgrade my plan but the payment page keeps failing.',  'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hi Tom! Let me check that for you. Which plan are you trying to upgrade to?', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'The Pro plan. I\'ve tried Visa and Mastercard, both fail at the last step.', 'is_read' => true],
                    ['sender' => 'agent',    'text' => 'I\'m checking our payment logs now. Can you confirm the last 4 digits of your card?', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Visa ends in 4242, Mastercard ends in 5555.',                                'is_read' => false],
                ],
            ],
            [
                'customer_name' => 'Maria Garcia', 'status' => 'active', 'is_ai_bot' => false, 'unread_count' => 0,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'How do I export my data to CSV?',                                               'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hi Maria! Go to Settings → Data Export → select CSV format and click Export.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Found it, thank you so much!',                                                   'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Great! Let me know if you need anything else.',                                  'is_read' => true],
                    ['sender' => 'system',   'text' => 'Chat resolved',                                                                  'is_read' => true],
                ],
            ],
            [
                'customer_name' => 'David Kim', 'status' => 'offline', 'is_ai_bot' => false, 'unread_count' => 0,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'Does your API support webhooks for real-time events?',                  'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Yes! We support webhooks for chat.created, message.sent, and ticket.updated events.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Perfect. Where can I find the documentation for setting them up?',       'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Check out api.techcorp.com/webhooks — full guide with examples there.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Thanks, exactly what I needed.',                                         'is_read' => true],
                ],
            ],
            [
                'customer_name' => 'Sophie Chen', 'status' => 'active', 'is_ai_bot' => true, 'unread_count' => 3,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'My subscription was charged twice this month!',                          'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hi Sophie, I\'m sorry to hear that. I\'m pulling up your billing records now.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'I have two $79 charges on March 1st.',                                   'is_read' => true],
                    ['sender' => 'customer', 'text' => 'I want a refund immediately.',                                            'is_read' => false],
                    ['sender' => 'customer', 'text' => 'Is anyone there??',                                                       'is_read' => false],
                    ['sender' => 'customer', 'text' => 'This is unacceptable, I\'m going to dispute the charge.',                'is_read' => false],
                ],
            ],
        ]);

        $this->seedCompanyChats('StartupXYZ', [
            [
                'customer_name' => 'Ryan Thompson', 'status' => 'active', 'is_ai_bot' => false, 'unread_count' => 1,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'Hi, can I integrate your product with Zapier?',                          'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hi Ryan! Yes, we have a native Zapier integration. Here\'s the link: zapier.com/apps/startupxyz', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Great, does it support triggers for new signups?',                       'is_read' => false],
                ],
            ],
            [
                'customer_name' => 'Emma Wilson', 'status' => 'offline', 'is_ai_bot' => false, 'unread_count' => 0,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'Your onboarding flow is confusing. The step 3 button doesn\'t work on mobile.', 'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Thanks for the feedback Emma! Which phone and browser are you using?',           'is_read' => true],
                    ['sender' => 'customer', 'text' => 'iPhone 15, Safari.',                                                              'is_read' => true],
                    ['sender' => 'agent',    'text' => 'I\'ve filed a bug report. We\'ll fix this in the next release. Sorry for the inconvenience!', 'is_read' => true],
                ],
            ],
        ]);

        $this->seedCompanyChats('Global Services Inc', [
            [
                'customer_name' => 'Oliver Marsh', 'status' => 'active', 'is_ai_bot' => false, 'unread_count' => 0,
                'messages' => [
                    ['sender' => 'customer', 'text' => 'We need to onboard 50 new users next week. Is bulk import supported?',   'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Hi Oliver! Yes, you can bulk import via CSV from Settings → Team → Import.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Perfect, do you have a template CSV we can use?',                         'is_read' => true],
                    ['sender' => 'agent',    'text' => 'Yes! Download it from the same page — there\'s a "Download Template" button.', 'is_read' => true],
                    ['sender' => 'customer', 'text' => 'Got it, thank you!',                                                       'is_read' => true],
                ],
            ],
        ]);
    }

    private function seedCompanyChats(string $companyName, array $chats): void {
        $company  = \App\Models\Company::where('name', $companyName)->first();
        $projects = Project::where('company_id', $company?->id)->get();
        $agents   = User::where('role', 'agent')->where('company_id', $company?->id)->get();

        if ($projects->isEmpty()) return;

        foreach ($chats as $data) {
            $messages    = $data['messages'] ?? [];
            $unreadCount = $data['unread_count'] ?? 0;
            $agent       = $agents->isNotEmpty() ? $agents->random() : null;

            $chat = Chat::create([
                'customer_name'   => $data['customer_name'],
                'customer_avatar' => implode('', array_map(fn($w) => strtoupper($w[0]), explode(' ', $data['customer_name']))),
                'status'          => $data['status'],
                'is_ai_bot'       => $data['is_ai_bot'],
                'unread_count'    => $unreadCount,
                'project_id'      => $projects->random()->id,
                'assigned_to'     => $agent?->id,
                'last_message_at' => now()->subMinutes(rand(1, 200)),
            ]);

            foreach ($messages as $i => $msg) {
                $chat->messages()->create([
                    'sender'     => $msg['sender'],
                    'text'       => $msg['text'],
                    'is_read'    => $msg['is_read'],
                    'created_at' => now()->subMinutes(count($messages) - $i),
                ]);
            }
        }
    }
}
