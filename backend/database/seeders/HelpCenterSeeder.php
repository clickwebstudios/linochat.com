<?php

namespace Database\Seeders;

use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class HelpCenterSeeder extends Seeder
{
    public function run(): void
    {
        // Find or create the help center project
        $superadmin = User::where('role', 'superadmin')->first();
        if (!$superadmin) {
            $this->command->warn('No superadmin user found. Skipping help center seeder.');
            return;
        }

        $project = Project::firstOrCreate(
            ['name' => 'LinoChat Help Center'],
            [
                'user_id' => $superadmin->id,
                'website' => 'https://linochat.com/help',
                'color' => '#2563EB',
                'status' => 'active',
                'description' => 'Platform help center articles managed by superadmin.',
            ]
        );

        $this->command->info("Help center project ID: {$project->id}");
        $this->command->info("Set HELP_CENTER_PROJECT_ID={$project->id} in your .env");

        $categories = [
            'Getting Started' => [
                ['title' => 'Welcome to LinoChat — Quick Start Guide', 'content' => "# Welcome to LinoChat\n\nLinoChat is an AI-powered customer support platform. Here's how to get started in 5 minutes:\n\n## Step 1: Create Your Account\nSign up at linochat.com/signup with your email and company details.\n\n## Step 2: Set Up Your First Project\nAfter registration, your first project is automatically created from your website. Our AI analyzes your site and builds a knowledge base.\n\n## Step 3: Add the Widget to Your Site\nGo to **Chat Widget → Embed Code** and copy the script tag into your website's HTML, before the closing `</body>` tag.\n\n## Step 4: Customize Your Widget\nVisit **Chat Widget → Appearance** to change colors, position, greeting message, and design.\n\n## Step 5: Invite Your Team\nGo to **Users** and click **Invite Agent** to add team members.\n\nThat's it! Your AI assistant is now live on your website, answering customer questions 24/7."],
                ['title' => 'Adding the Chat Widget to Your Website', 'content' => "# Adding the Chat Widget\n\nThe LinoChat widget is a single script tag that you add to your website.\n\n## Getting Your Embed Code\n1. Go to your project dashboard\n2. Click **Chat Widget** → **Embed Code**\n3. Copy the code snippet\n\n## Installation\nPaste the script tag before the closing `</body>` tag on every page where you want the chat:\n\n```html\n<script>\n(function() {\n    var s = document.createElement('script');\n    s.src = 'https://linochat.com/widget/?id=YOUR_WIDGET_ID';\n    s.async = true;\n    document.body.appendChild(s);\n})();\n</script>\n```\n\n## Supported Platforms\n- **WordPress**: Add to your theme's footer.php or use a plugin like Insert Headers and Footers\n- **Shopify**: Add to theme.liquid before `</body>`\n- **Wix**: Use the HTML embed element\n- **Squarespace**: Add via Code Injection in Settings\n- **Custom HTML**: Paste directly in your HTML\n\nThe widget loads asynchronously and won't slow down your page."],
                ['title' => 'Inviting Team Members', 'content' => "# Inviting Team Members\n\nAdd agents to your projects to help manage customer conversations.\n\n## How to Invite\n1. Go to **Users** in the sidebar\n2. Click **Invite Agent**\n3. Enter their email address\n4. They'll receive an invitation email with a link to create their account\n\n## Roles\n- **Admin**: Full access to project settings, billing, and team management\n- **Agent**: Can view and respond to chats, manage tickets, and access the knowledge base\n\n## Invitation Expiry\nInvitations expire after 7 days. You can resend expired invitations.\n\n## Removing Team Members\nGo to the project's Team Members tab and click the remove button next to the agent you want to remove."],
                ['title' => 'Configuring AI Settings', 'content' => "# Configuring Your AI Assistant\n\nCustomize how your AI responds to customers.\n\n## System Prompt\nGo to **AI Settings → Prompt** to define your AI's personality, knowledge scope, and response style.\n\nTips for a great prompt:\n- Describe your business and what you offer\n- Set the tone (friendly, professional, casual)\n- Define what topics the AI should and shouldn't discuss\n- Include escalation rules (when to hand off to a human)\n\n## Generate with AI\nEnter your website URL and click **Generate** — LinoChat will analyze your site and create a system prompt automatically.\n\n## Knowledge Base\nThe AI uses your knowledge base to answer questions. Go to **AI Settings → Training Data Sources** to:\n- Upload documents (PDF, DOC, TXT)\n- Add website URLs to scrape\n- Manually create knowledge base articles\n\n## Configuration\nAdjust AI behavior in **AI Settings → Configuration**:\n- AI Model selection\n- Response temperature (creativity level)\n- Maximum response length\n- Language preferences"],
                ['title' => 'Customizing Widget Appearance', 'content' => "# Widget Customization\n\nMake the chat widget match your brand.\n\n## Appearance Settings\nGo to **Chat Widget → Appearance** to customize:\n\n### Color\nChoose a primary color that matches your brand. This affects the button, header, and message bubbles.\n\n### Design\nPick from 8 design styles: Modern, Minimal, Classic, Bubble, Compact, Professional, Friendly, Gradient.\n\n### Position\nPlace the widget in any corner: Bottom Right (default), Bottom Left, Top Right, or Top Left.\n\n### Widget Title\nThe name shown in the chat header (e.g., your company name).\n\n### Welcome Message\nThe first message customers see when they open the chat.\n\n## Greeting Bubble\nGo to **Chat Widget → Greeting** to enable a pop-up message that appears on your site to encourage visitors to start a conversation.\n\n## Animations\nGo to **Chat Widget → Animations** to add attention-grabbing effects to the chat button (bounce, pulse, shake, etc.)."],
            ],
            'Account & Billing' => [
                ['title' => 'Managing Your Account Settings', 'content' => "# Account Settings\n\nManage your profile and account preferences.\n\n## Profile\nClick your avatar in the top-right corner → **Settings** to update:\n- First name and last name\n- Email address\n- Phone number\n- Avatar/profile picture\n\n## Password\nChange your password from the Security section in Settings.\n\n## Notification Preferences\nConfigure which notifications you receive:\n- Email notifications for new chats and tickets\n- Desktop browser notifications\n- Sound alerts\n- Weekly summary emails"],
                ['title' => 'Understanding Plans and Pricing', 'content' => "# Plans & Pricing\n\nLinoChat offers flexible plans for businesses of all sizes.\n\n## Free Plan\nPerfect for getting started:\n- 1 project\n- AI-powered chat widget\n- Basic knowledge base\n- Community support\n\n## Starter Plan\nFor small teams:\n- Multiple projects\n- Team member invitations\n- Advanced widget customization\n- Email support\n\n## Pro Plan\nFor growing businesses:\n- Unlimited projects\n- Priority support\n- Advanced analytics\n- Custom integrations\n\n## Enterprise\nFor large organizations:\n- Custom pricing\n- Dedicated support\n- SLA guarantees\n- Custom AI training\n\nVisit [linochat.com/pricing](/pricing) for current pricing details."],
                ['title' => 'How to Delete Your Account', 'content' => "# Deleting Your Account\n\nYou can delete your LinoChat account at any time.\n\n## What Gets Deleted\n- Your profile and account data\n- All projects you own\n- All chat conversations and tickets\n- Knowledge base articles\n- Team member associations\n- Notification preferences\n\n## How to Delete\n1. Go to **Settings** → **Account**\n2. Scroll to the bottom\n3. Click **Delete Account**\n4. Confirm the deletion\n\n## Data Retention\n- Your data is permanently deleted immediately\n- Encrypted backups are purged within 30 days\n- Anonymized activity logs may be retained for security auditing\n\nAlternatively, email privacy@linochat.com to request account deletion."],
                ['title' => 'Resetting Your Password', 'content' => "# Password Reset\n\nForgot your password? Here's how to reset it.\n\n## Steps\n1. Go to the [login page](/login)\n2. Click **Forgot Password?**\n3. Enter your email address\n4. Check your inbox for the reset link\n5. Click the link and create a new password\n\n## Requirements\n- Minimum 8 characters\n- The reset link expires in 60 minutes\n\n## Didn't Receive the Email?\n- Check your spam/junk folder\n- Make sure you entered the correct email\n- Wait a few minutes and try again\n- Contact support if the issue persists\n\n## Google Sign-In Users\nIf you signed up with Google, you don't need a password. Just click **Sign in with Google** on the login page."],
            ],
            'Chat & Messaging' => [
                ['title' => 'Using the Agent Chat Dashboard', 'content' => "# Agent Chat Dashboard\n\nThe chat dashboard is where you manage customer conversations.\n\n## Layout\n- **Left panel**: List of active and recent chats\n- **Center**: Active conversation with message history\n- **Right panel**: Customer info and actions\n\n## Taking a Chat\nClick on an unassigned chat and click **Take** to assign it to yourself.\n\n## Sending Messages\nType in the message box at the bottom and press Enter to send.\n\n## Quick Actions\n- **Canned Responses**: Click the template icon for pre-written replies\n- **KB Articles**: Search and share knowledge base articles\n- **Attachments**: Upload files to share with the customer\n\n## Chat Status\n- **AI Handling**: The AI is responding to the customer\n- **Waiting**: Customer requested a human agent\n- **Active**: An agent is handling the conversation\n- **Closed**: Conversation has ended"],
                ['title' => 'Understanding AI Responses', 'content' => "# AI Responses\n\nLinoChat uses AI to automatically respond to customer inquiries.\n\n## How It Works\n1. Customer sends a message via the chat widget\n2. The AI reads the message and checks your knowledge base\n3. It generates a contextual response based on your system prompt and KB\n4. The response is sent to the customer instantly\n\n## When AI Hands Off to Humans\nThe AI will request a human agent when:\n- The customer explicitly asks for a human\n- The question is outside the AI's knowledge\n- The conversation requires personal judgment\n- You've configured escalation rules in the system prompt\n\n## Monitoring AI Responses\n- All AI messages are labeled with an **AI Assistant** badge\n- You can review conversations in the Chats tab\n- Toggle AI on/off per conversation using the AI toggle button\n\n## Improving AI Quality\n- Add more articles to your knowledge base\n- Refine your system prompt\n- Review conversations where the AI struggled"],
                ['title' => 'Managing Canned Responses', 'content' => "# Canned Responses\n\nSave time with pre-written message templates.\n\n## Using Canned Responses\n1. In an active chat, click **Canned Responses** below the message input\n2. Browse or search available templates\n3. Click to insert the response\n4. Edit if needed, then send\n\n## Creating Templates\nCanned responses are managed at the project level. Common templates include:\n- Greeting messages\n- FAQ answers\n- Escalation notices\n- Closing messages\n- Business hours information"],
            ],
            'Tickets & Support' => [
                ['title' => 'Creating and Managing Tickets', 'content' => "# Support Tickets\n\nTickets help you track and manage customer issues.\n\n## How Tickets Are Created\n- **From chat**: The AI can create tickets from chat conversations (e.g., booking requests)\n- **From email**: Inbound emails are converted to tickets\n- **Manually**: Agents can create tickets from the Tickets tab\n\n## Ticket Fields\n- **Subject**: Brief description of the issue\n- **Status**: Open, In Progress, Waiting, Resolved, Closed\n- **Priority**: Low, Medium, High, Urgent\n- **Assigned To**: The agent responsible\n- **Customer**: Name and email of the requester\n\n## Working with Tickets\n1. Go to **Tickets** in the sidebar\n2. Click on a ticket to view details\n3. Add replies, change status, or reassign\n4. The customer receives email notifications for replies\n\n## Ticket Email Threading\nCustomers can reply to ticket notification emails. Replies are automatically added to the ticket conversation."],
                ['title' => 'Ticket Status Workflow', 'content' => "# Ticket Status Workflow\n\nUnderstand how ticket statuses work.\n\n## Status Flow\n1. **Open** — New ticket, not yet being worked on\n2. **In Progress** — An agent is actively working on it\n3. **Waiting** — Waiting for customer response\n4. **Resolved** — Issue has been fixed\n5. **Closed** — Ticket is complete and archived\n\n## Automatic Status Changes\n- When an agent takes a ticket: Open → In Progress\n- When an agent replies: status stays or changes to Waiting\n- When customer replies to a resolved ticket: Resolved → Open\n\n## Best Practices\n- Always update the status when you make progress\n- Use **Waiting** when you need info from the customer\n- Resolve tickets promptly to maintain good CSAT scores"],
            ],
            'Knowledge Base' => [
                ['title' => 'Building Your Knowledge Base', 'content' => "# Knowledge Base\n\nYour knowledge base powers the AI's responses.\n\n## Why It Matters\nThe AI uses KB articles to answer customer questions accurately. Better KB = better AI responses.\n\n## Adding Content\nGo to **Knowledge** in the sidebar:\n\n### Manual Articles\n1. Click **Add Article**\n2. Choose a category\n3. Write the article content\n4. Publish when ready\n\n### AI Generation from Website\n1. Go to **AI Settings → Training Data Sources**\n2. Click **Generate from Website**\n3. LinoChat scrapes your site and creates articles automatically\n\n### Document Upload\n1. Upload PDF, DOC, or TXT files\n2. LinoChat extracts content and creates articles\n\n## Categories\nOrganize articles into categories for better navigation:\n- Product information\n- Pricing and billing\n- Technical support\n- Company policies"],
                ['title' => 'Training Your AI with Documents', 'content' => "# Training with Documents\n\nUpload documents to expand your AI's knowledge.\n\n## Supported Formats\n- PDF files (up to 10MB)\n- Word documents (.doc, .docx)\n- Text files (.txt)\n- CSV files (.csv)\n\n## How It Works\n1. Go to **AI Settings → Training Data Sources**\n2. Click **Upload Document**\n3. Select your file\n4. LinoChat extracts the content and adds it to your knowledge base\n5. The AI can now use this information to answer questions\n\n## Best Practices\n- Upload your product documentation\n- Include FAQ sheets\n- Add policy documents (returns, shipping, etc.)\n- Keep documents up to date — re-upload when content changes"],
            ],
            'Integrations' => [
                ['title' => 'Widget Embed Code and Installation', 'content' => "# Widget Installation Guide\n\nStep-by-step guide for adding LinoChat to your website.\n\n## Getting the Code\n1. Go to **Chat Widget → Embed Code**\n2. Click **Copy Code**\n\n## Platform-Specific Instructions\n\n### WordPress\n1. Go to Appearance → Theme Editor → footer.php\n2. Paste the code before `</body>`\n3. Or use a plugin like \"Insert Headers and Footers\"\n\n### Shopify\n1. Go to Online Store → Themes → Edit Code\n2. Open theme.liquid\n3. Paste before `</body>`\n\n### Next.js / React\nAdd the script to your `_document.tsx` or use a `<Script>` component.\n\n### Static HTML\nPaste the code directly in your HTML file before `</body>`.\n\n## Verifying Installation\nGo to **Chat Widget → Embed Code** and click **Verify Installation** to check if the widget is detected on your site."],
                ['title' => 'API and Webhook Integration', 'content' => "# API & Webhooks\n\nConnect LinoChat with your existing tools.\n\n## OAuth API\nLinoChat provides an OAuth 2.0 API for programmatic access:\n1. Go to project **Settings → Integrations**\n2. Click **Create OAuth App**\n3. Use the client ID and secret to authenticate\n4. Available scopes: projects:read, chats:read, chats:write\n\n## Webhooks\nReceive real-time notifications when events happen:\n- New chat started\n- Message received\n- Ticket created\n- Chat transferred to human\n\n## Available API Endpoints\n- `GET /api/v1/projects` — List projects\n- `GET /api/v1/chats` — List chats\n- `POST /api/v1/chats/{id}/message` — Send message\n- `GET /api/v1/chats/{id}` — Get chat details\n\nFull API documentation available at linochat.com/resources#docs."],
            ],
            'Security & Privacy' => [
                ['title' => 'Data Security at LinoChat', 'content' => "# Security\n\nLinoChat takes security seriously. Here's how we protect your data.\n\n## Encryption\n- All data in transit is encrypted with TLS 1.3\n- Passwords are hashed using bcrypt\n- API tokens use SHA-256 hashing\n\n## Authentication\n- Sanctum-based API authentication\n- Rate limiting on sensitive endpoints\n- Account lockout after 5 failed login attempts\n- Optional Google OAuth sign-in\n\n## Data Isolation\n- Complete company data isolation — your data never mixes with other companies\n- WebSocket channels are authenticated and scoped per user\n- Database queries are company-scoped at the application level\n\n## Infrastructure\n- HTTPS-only access\n- Regular security audits\n- Automated vulnerability scanning\n- Regular encrypted backups\n\n## Compliance\n- GDPR-aware data handling\n- Right to deletion supported\n- Data export available on request\n- Privacy policy and terms of service publicly available"],
                ['title' => 'GDPR and Data Privacy', 'content' => "# GDPR & Privacy\n\nLinoChat is designed with privacy in mind.\n\n## Your Rights\nAs a LinoChat user, you can:\n- **Access** your data — request a full export\n- **Rectify** — update your information in Settings\n- **Delete** — delete your account and all associated data\n- **Portability** — export data in standard format\n- **Object** — contact us to object to specific processing\n\n## For Your Customers\nAs a LinoChat customer, you should:\n- Add LinoChat to your privacy policy\n- Inform visitors about the chat widget\n- Provide opt-out options where required\n- Respond to data subject requests for chat data\n\n## Data Processing\n- We act as a data processor on your behalf\n- Chat data is processed to provide the support service\n- AI responses are generated using OpenAI (data shared per our privacy policy)\n- No data is sold or used for advertising\n\nRead our full [Privacy Policy](/privacy) for details."],
            ],
        ];

        foreach ($categories as $categoryName => $articles) {
            $category = KbCategory::firstOrCreate(
                ['project_id' => $project->id, 'slug' => Str::slug($categoryName)],
                ['name' => $categoryName, 'description' => "Help articles about {$categoryName}"]
            );

            foreach ($articles as $articleData) {
                KbArticle::firstOrCreate(
                    ['project_id' => $project->id, 'slug' => Str::slug($articleData['title'])],
                    [
                        'category_id' => $category->id,
                        'author_id' => $superadmin->id,
                        'title' => $articleData['title'],
                        'content' => $articleData['content'],
                        'status' => 'published',
                        'is_published' => true,
                        'is_ai_generated' => false,
                        'views_count' => 0,
                        'helpful_count' => 0,
                        'not_helpful_count' => 0,
                    ]
                );
            }

            $this->command->info("  Created category '{$categoryName}' with " . count($articles) . " articles");
        }

        $this->command->info("Done! Total: " . collect($categories)->flatten(1)->count() . " articles in " . count($categories) . " categories");
    }
}
