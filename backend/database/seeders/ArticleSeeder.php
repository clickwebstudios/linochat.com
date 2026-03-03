<?php
namespace Database\Seeders;
use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder {
    public function run(): void {
        $admin = User::where('email', 'admin@linochat.com')->first() ?? User::where('role', 'admin')->first();

        $articles = [
            [
                'title'       => 'Getting Started with LinoChat',
                'category'    => 'Getting Started',
                'category_id' => 'getting-started',
                'status'      => 'published',
                'views'       => 1240,
                'helpful'     => 95,
                'tags'        => ['onboarding', 'setup'],
                'excerpt'     => 'Learn how to set up your LinoChat account and start supporting customers in minutes.',
                'content'     => "# Getting Started with LinoChat\n\nWelcome to LinoChat! This guide walks you through the initial setup.\n\n## Step 1: Create Your Account\n\nSign up at linochat.com and verify your email.\n\n## Step 2: Set Up Your First Project\n\nA Project represents a product or website you want to support. Give it a name and add your website URL so our AI can analyze it.\n\n## Step 3: Add Your Team\n\nInvite agents from Settings → Team. Each agent gets an email invite.\n\n## Step 4: Install the Chat Widget\n\nCopy the embed snippet from your Project settings and paste it before `</body>` on your website.\n\nYou're live!",
            ],
            [
                'title'       => 'Managing Your Support Team',
                'category'    => 'Account Management',
                'category_id' => 'account-management',
                'status'      => 'published',
                'views'       => 890,
                'helpful'     => 82,
                'tags'        => ['team', 'agents', 'roles'],
                'excerpt'     => 'Learn how to invite agents, assign roles, and manage your support team effectively.',
                'content'     => "# Managing Your Support Team\n\n## Roles\n\n- **Admin**: Full access to settings, billing, and all conversations.\n- **Agent**: Can handle chats and tickets assigned to them.\n\n## Inviting Agents\n\nGo to Settings → Team → Invite Agent. Enter their email and select a role.\n\n## Assigning Agents to Projects\n\nFrom the Project settings page, click **Members** and add agents. They will only see chats and tickets for their assigned projects.\n\n## Removing an Agent\n\nGo to Settings → Team, click the agent name, then click **Deactivate**.",
            ],
            [
                'title'       => 'Understanding Billing & Plans',
                'category'    => 'Billing & Payments',
                'category_id' => 'billing-payments',
                'status'      => 'published',
                'views'       => 567,
                'helpful'     => 78,
                'tags'        => ['billing', 'plans', 'subscription'],
                'excerpt'     => 'Everything you need to know about our pricing plans and how billing works.',
                'content'     => "# Understanding Billing & Plans\n\n## Available Plans\n\n| Plan | Price | Agents | Chats |\n|------|-------|--------|-------|\n| Free | \$0 | 1 | 100/mo |\n| Starter | \$29/mo | 5 | 1,000/mo |\n| Pro | \$79/mo | 20 | Unlimited |\n| Enterprise | \$199/mo | Unlimited | Unlimited |\n\n## Billing Cycle\n\nWe bill monthly on the day you signed up. Annual plans receive a 17% discount.\n\n## Upgrading or Downgrading\n\nYou can change your plan at any time from Settings → Billing. Upgrades take effect immediately. Downgrades apply at the next billing cycle.\n\n## Refund Policy\n\nWe offer a 14-day money-back guarantee on all paid plans.",
            ],
            [
                'title'       => 'Setting Up Webhooks',
                'category'    => 'Integrations',
                'category_id' => 'integrations',
                'status'      => 'published',
                'views'       => 423,
                'helpful'     => 88,
                'tags'        => ['webhooks', 'api', 'integration'],
                'excerpt'     => 'Receive real-time events from LinoChat in your own systems using webhooks.',
                'content'     => "# Setting Up Webhooks\n\nWebhooks let your server receive real-time notifications when events happen in LinoChat.\n\n## Supported Events\n\n- `chat.created` — A new chat session starts\n- `message.sent` — A message is sent in any chat\n- `ticket.created` — A new ticket is opened\n- `ticket.updated` — A ticket status changes\n- `ticket.closed` — A ticket is resolved\n\n## Adding a Webhook\n\n1. Go to Settings → Integrations → Webhooks\n2. Click **Add Webhook**\n3. Enter your endpoint URL (must be HTTPS)\n4. Select the events you want to receive\n5. Click **Save**\n\n## Verifying Payloads\n\nEach request includes an `X-LinoChat-Signature` header. Verify it using your webhook secret to ensure requests come from us.",
            ],
            [
                'title'       => 'Using AI-Powered Responses',
                'category'    => 'Features',
                'category_id' => 'features',
                'status'      => 'published',
                'views'       => 312,
                'helpful'     => 91,
                'tags'        => ['ai', 'automation', 'knowledge-base'],
                'excerpt'     => 'Speed up your support with AI-suggested replies based on your knowledge base.',
                'content'     => "# Using AI-Powered Responses\n\nLinoChat's AI Suggest feature analyzes your knowledge base and suggests relevant replies to customer messages.\n\n## How It Works\n\n1. Agent opens a chat with a customer message\n2. Click the **AI Suggest** button in the reply toolbar\n3. The AI reads your KB articles and generates a suggested reply\n4. Review and edit the suggestion, then send\n\n## Building a Good Knowledge Base\n\nThe quality of AI suggestions depends on your KB. To get the best results:\n\n- Write clear, concise articles\n- Use the **Generate from Website** feature to auto-create articles from your site\n- Keep articles up to date\n\n## Privacy\n\nCustomer messages are only sent to the AI model to generate suggestions. No data is stored by the AI provider.",
            ],
            [
                'title'       => 'Chat Widget Customization',
                'category'    => 'Getting Started',
                'category_id' => 'getting-started',
                'status'      => 'published',
                'views'       => 198,
                'helpful'     => 75,
                'tags'        => ['widget', 'customization', 'branding'],
                'excerpt'     => 'Customize the chat widget colors, position, and welcome message to match your brand.',
                'content'     => "# Chat Widget Customization\n\nYou can fully customize the chat widget to match your brand identity.\n\n## Settings Location\n\nProject → Widget Settings\n\n## Available Options\n\n### Colors\nSet a primary color for the widget header and send button.\n\n### Position\nChoose bottom-right (default) or bottom-left.\n\n### Welcome Message\nCustomize the greeting customers see when they open the widget.\n\n### Agent Availability\nShow an online/offline indicator based on your team's status.\n\n### Launcher Icon\nUpload a custom icon (PNG, 64×64px recommended) instead of the default chat bubble.\n\n## Preview\n\nAll changes are previewed in real time before you save.",
            ],
            [
                'title'       => 'Exporting Data & Reports',
                'category'    => 'Account Management',
                'category_id' => 'account-management',
                'status'      => 'draft',
                'views'       => 0,
                'helpful'     => 0,
                'tags'        => ['export', 'reports', 'csv'],
                'excerpt'     => 'Export your tickets, chats, and performance reports in CSV or PDF format.',
                'content'     => "# Exporting Data & Reports\n\n## Exporting Tickets\n\nGo to Tickets → click **Export** → select CSV.\n\nYou can filter by date range, status, and agent before exporting.\n\n## Chat Transcripts\n\nOpen any chat → click **...** → Download Transcript.\n\n## Performance Reports\n\nGo to Reports → select a date range → click **Generate**. Reports can be downloaded as PDF.",
            ],
        ];

        foreach ($articles as $data) {
            Article::create(array_merge($data, [
                'author_id' => $admin?->id,
            ]));
        }
    }
}
