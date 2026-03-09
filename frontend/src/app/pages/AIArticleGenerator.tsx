import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Eye,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Clock,
  Plus,
} from 'lucide-react';
import { ProjectSelector } from '../components/ProjectSelector';

interface SuggestedArticle {
  id: string;
  title: string;
  category: string;
  estimatedReadTime: string;
  relevanceScore: number;
  suggestedTags: string[];
  content: string;
  summary: string;
}

// Mock suggested articles data
const mockSuggestedArticles: SuggestedArticle[] = [
  {
    id: '1',
    title: 'How to Reset Your Password',
    category: 'Account Management',
    estimatedReadTime: '3 min read',
    relevanceScore: 95,
    suggestedTags: ['password', 'security', 'account'],
    summary: 'Step-by-step guide to help users securely reset their password when they forget it or need to update it for security reasons.',
    content: `# How to Reset Your Password

If you've forgotten your password or need to reset it for security reasons, follow these simple steps:

## Step 1: Navigate to Login Page
Go to the login page and click on "Forgot Password?" link below the login form.

## Step 2: Enter Your Email
Enter the email address associated with your account. Make sure it's the same email you used when creating your account.

## Step 3: Check Your Email
You'll receive an email with a password reset link within 5 minutes. Check your spam folder if you don't see it in your inbox.

## Step 4: Create New Password
Click the link in the email and create a new password. Make sure your password:
- Is at least 8 characters long
- Contains at least one uppercase letter
- Contains at least one number
- Contains at least one special character

## Step 5: Log In
Once your password is reset, you can log in with your new credentials.

## Troubleshooting
If you don't receive the reset email:
- Check your spam/junk folder
- Verify you're using the correct email address
- Contact support if the issue persists

## Security Tips
- Never share your password with anyone
- Use a unique password for each account
- Consider using a password manager
- Enable two-factor authentication for added security`,
  },
  {
    id: '2',
    title: 'Getting Started with Your Dashboard',
    category: 'Getting Started',
    estimatedReadTime: '5 min read',
    relevanceScore: 92,
    suggestedTags: ['dashboard', 'tutorial', 'beginner'],
    summary: 'Complete introduction to your dashboard interface, covering all main features and navigation tips for new users.',
    content: `# Getting Started with Your Dashboard

Welcome to your new dashboard! This guide will help you understand all the key features and how to navigate efficiently.

## Dashboard Overview
Your dashboard is your central hub for managing all activities. Here's what you'll find:

### Main Sections
1. **Home** - Quick overview of your key metrics
2. **Analytics** - Detailed performance insights
3. **Projects** - Manage all your projects
4. **Settings** - Customize your preferences

## Key Features

### Quick Stats
At the top of your dashboard, you'll see important metrics like:
- Total active users
- Revenue this month
- Pending tasks
- Recent activity

### Navigation Menu
The left sidebar provides quick access to all sections. You can collapse it for more screen space.

### Search Functionality
Use the search bar (Ctrl/Cmd + K) to quickly find anything in your account.

### Notifications
Click the bell icon to view important updates and alerts.

## Customizing Your Dashboard

### Widgets
You can add, remove, or rearrange widgets to suit your needs:
1. Click the "Customize" button
2. Drag widgets to reposition them
3. Click "Add Widget" to include new ones
4. Save your layout

### Dark Mode
Toggle between light and dark themes in Settings > Appearance.

### Keyboard Shortcuts
- Ctrl/Cmd + K: Quick search
- Ctrl/Cmd + /: Show all shortcuts
- Ctrl/Cmd + B: Toggle sidebar

## Next Steps
- Complete your profile in Settings
- Set up your first project
- Invite team members
- Explore advanced features

Need help? Contact our support team anytime!`,
  },
  {
    id: '3',
    title: 'Understanding Your Billing and Invoices',
    category: 'Billing',
    estimatedReadTime: '4 min read',
    relevanceScore: 88,
    suggestedTags: ['billing', 'invoices', 'payments'],
    summary: 'Comprehensive guide about billing cycles, payment methods, downloading invoices, and managing subscriptions.',
    content: `# Understanding Your Billing and Invoices

This guide explains everything you need to know about billing, invoices, and payment management.

## Billing Cycles

### Subscription Plans
We offer flexible billing options:
- **Monthly**: Billed on the same day each month
- **Annual**: Billed once per year with 20% savings
- **Custom**: Enterprise plans with custom terms

### Billing Date
Your billing date is set when you first subscribe. You can view it in Settings > Billing.

## Payment Methods

### Accepted Payment Types
- Credit/Debit Cards (Visa, Mastercard, Amex)
- PayPal
- Bank Transfer (Enterprise plans)
- Invoice Payment (Custom arrangements)

### Adding a Payment Method
1. Go to Settings > Billing
2. Click "Add Payment Method"
3. Enter your payment details
4. Save and set as default (optional)

### Updating Payment Information
You can update your payment method anytime:
1. Navigate to Billing Settings
2. Click on the payment method
3. Update the information
4. Save changes

## Invoices

### Accessing Invoices
All invoices are available in Settings > Billing > Invoice History:
- View online
- Download as PDF
- Email to your accounting team

### Invoice Details
Each invoice includes:
- Invoice number
- Billing period
- Itemized charges
- Payment method used
- Company information

### Auto-Generated Invoices
Invoices are automatically generated after each successful payment.

## Managing Your Subscription

### Upgrading Your Plan
1. Go to Settings > Billing
2. Click "Change Plan"
3. Select your new plan
4. Confirm the change

Changes take effect immediately, and you'll be charged the prorated difference.

### Downgrading Your Plan
When downgrading:
- Change takes effect at the end of current billing cycle
- No immediate charge
- You keep current features until cycle ends

### Cancellation
To cancel your subscription:
1. Go to Settings > Billing
2. Click "Cancel Subscription"
3. Provide feedback (optional)
4. Confirm cancellation

You'll retain access until the end of your paid period.

## Common Issues

### Payment Failed
If a payment fails:
- Check your payment method is valid
- Ensure sufficient funds
- Update expired cards
- Contact your bank

We'll retry failed payments automatically.

### Disputed Charges
If you see an unexpected charge:
1. Review your billing history
2. Check for plan changes
3. Contact support with invoice number

### Refund Requests
Refund requests are handled case-by-case. Contact support with:
- Invoice number
- Reason for refund
- Date of charge

## Support
For billing questions, contact billing@linochat.com or use the chat widget.`,
  },
  {
    id: '4',
    title: 'How to Integrate with Third-Party Apps',
    category: 'Integrations',
    estimatedReadTime: '6 min read',
    relevanceScore: 85,
    suggestedTags: ['integrations', 'api', 'setup'],
    summary: 'Learn how to connect your favorite tools and apps with our platform using native integrations and API.',
    content: `# How to Integrate with Third-Party Apps

Connect your favorite tools and streamline your workflow with our integration capabilities.

## Available Integrations

### Communication Tools
- Slack - Get notifications in your workspace
- Microsoft Teams - Sync with your team channels
- Discord - Community management integration

### Project Management
- Trello - Sync tasks and boards
- Asana - Two-way task synchronization
- Jira - Developer workflow integration
- Monday.com - Visual project tracking

### CRM Systems
- Salesforce - Customer data sync
- HubSpot - Marketing automation
- Pipedrive - Sales pipeline integration

### Analytics
- Google Analytics - Track user behavior
- Mixpanel - Advanced analytics
- Segment - Data aggregation

## Setting Up Integrations

### General Setup Process
1. Navigate to Settings > Integrations
2. Find the app you want to connect
3. Click "Connect"
4. Authorize the connection
5. Configure sync settings
6. Test the integration

### Example: Slack Integration

#### Step 1: Install App
Go to Integrations > Slack and click "Add to Slack"

#### Step 2: Authorize
Select which Slack workspace to connect and authorize the app

#### Step 3: Configure Notifications
Choose which notifications to receive:
- New tickets
- Chat messages
- System alerts
- Performance reports

#### Step 4: Set Channels
Map notification types to specific Slack channels

#### Step 5: Test
Send a test notification to verify the setup

## API Access

### Getting Your API Key
1. Go to Settings > API
2. Click "Generate API Key"
3. Copy and store securely
4. Never share your API key

### API Documentation
Visit our developer portal at docs.linochat.com/api for:
- Complete API reference
- Code examples
- SDKs and libraries
- Rate limits

### Webhooks
Set up webhooks for real-time data:
1. Go to Settings > Webhooks
2. Add webhook URL
3. Select events to trigger
4. Configure payload format
5. Test the webhook

## Advanced Integration

### Custom Integrations
For custom needs:
- Use our REST API
- Implement OAuth 2.0
- Follow security best practices
- Monitor API usage

### Zapier Integration
Connect with 3,000+ apps through Zapier:
1. Search for "LinoChat" on Zapier
2. Create a Zap
3. Set up trigger and actions
4. Test and activate

## Managing Integrations

### Viewing Connected Apps
See all active integrations in Settings > Integrations

### Disconnecting Apps
1. Find the app in your integrations list
2. Click "Disconnect"
3. Confirm disconnection
4. Revoke access if prompted

### Troubleshooting
If an integration isn't working:
- Check authorization status
- Verify API key validity
- Review error logs
- Test connection
- Contact support

## Best Practices
- Keep API keys secure
- Use webhooks for real-time data
- Monitor integration health
- Update connected apps regularly
- Review permissions periodically

## Need Help?
Contact support or visit our Integration Help Center for detailed guides on each integration.`,
  },
  {
    id: '5',
    title: 'Data Security and Privacy Policy',
    category: 'Security',
    estimatedReadTime: '7 min read',
    relevanceScore: 90,
    suggestedTags: ['security', 'privacy', 'compliance'],
    summary: 'Detailed information about how we protect your data, our security measures, and compliance with privacy regulations.',
    content: `# Data Security and Privacy Policy

Your data security and privacy are our top priorities. Learn about our comprehensive security measures.

## Data Protection

### Encryption
- **In Transit**: TLS 1.3 encryption for all data transmission
- **At Rest**: AES-256 encryption for stored data
- **Backups**: Encrypted and stored in multiple locations

### Infrastructure Security
- SOC 2 Type II certified data centers
- 24/7 security monitoring
- Regular security audits
- DDoS protection
- Firewall protection

### Access Controls
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Single sign-on (SSO) support
- IP whitelisting for enterprise plans

## Privacy Commitment

### Data Collection
We only collect data necessary for:
- Service functionality
- User support
- Product improvement
- Legal compliance

### Data Usage
Your data is used for:
- Providing our services
- Customer support
- Security monitoring
- Product analytics (anonymized)

We NEVER:
- Sell your data to third parties
- Use your data for advertising
- Share data without consent

### User Rights
You have the right to:
- Access your data
- Export your data
- Delete your data
- Correct inaccuracies
- Opt-out of communications

## Compliance

### Regulations
We comply with:
- **GDPR**: European data protection
- **CCPA**: California privacy law
- **HIPAA**: Healthcare data (Enterprise)
- **SOC 2**: Security standards
- **ISO 27001**: Information security

### Data Residency
- Choose your data storage region
- Available regions: US, EU, UK, Canada, Australia
- Data stays in selected region

## Security Features

### For Administrators
- Audit logs for all actions
- Session management
- API key management
- Webhook security
- Custom security policies

### For End Users
- Strong password requirements
- Account activity monitoring
- Login history
- Device management
- Security notifications

## Incident Response

### Our Process
1. **Detection**: 24/7 monitoring
2. **Analysis**: Immediate investigation
3. **Containment**: Quick action to limit impact
4. **Notification**: Timely communication
5. **Resolution**: Complete remediation
6. **Review**: Post-incident analysis

### User Notification
In case of a security incident, we will:
- Notify affected users within 72 hours
- Provide clear information about the incident
- Explain steps taken
- Offer support and guidance

## Best Practices for Users

### Password Security
- Use strong, unique passwords
- Enable MFA
- Change passwords regularly
- Use a password manager

### Account Security
- Review login history regularly
- Update security settings
- Monitor connected devices
- Report suspicious activity

### Data Handling
- Be cautious with sensitive data
- Use secure file sharing
- Review access permissions
- Train team members

## Data Management

### Backup and Recovery
- Daily automated backups
- 30-day backup retention
- Point-in-time recovery
- Disaster recovery plan

### Data Retention
- Active data: Retained as long as account is active
- Deleted data: Permanently removed within 30 days
- Backup data: Removed after retention period
- Legal holds: Preserved as required

### Data Portability
Export your data anytime:
1. Go to Settings > Data Export
2. Select data to export
3. Choose format (JSON, CSV, XML)
4. Download securely

## Contact

### Security Team
- Email: security@linochat.com
- Report vulnerabilities: security-reports@linochat.com
- Responsible disclosure program available

### Privacy Team
- Email: privacy@linochat.com
- DPO contact: dpo@linochat.com

### Questions?
Read our complete privacy policy at linochat.com/privacy or contact our privacy team.

---

Last updated: December 2024
Version: 2.1`,
  },
  {
    id: '6',
    title: 'Mobile App: Features and How to Use',
    category: 'Mobile',
    estimatedReadTime: '4 min read',
    relevanceScore: 82,
    suggestedTags: ['mobile', 'ios', 'android'],
    summary: 'Complete guide to using our mobile apps on iOS and Android, including features, setup, and troubleshooting.',
    content: `# Mobile App: Features and How to Use

Stay productive on the go with our fully-featured mobile apps for iOS and Android.

## Getting Started

### Download the App
- **iOS**: Available on the App Store (iOS 14+)
- **Android**: Available on Google Play (Android 8+)

Search for "LinoChat" and look for our official app with the blue LC logo.

### First-Time Setup
1. Download and open the app
2. Sign in with your existing account
3. Enable notifications (recommended)
4. Complete quick tour
5. Customize your settings

## Key Features

### Real-Time Chat
- Instant messaging with customers
- Push notifications for new messages
- Quick replies and templates
- Emoji and file sharing
- Voice messages

### Ticket Management
- View all tickets
- Update ticket status
- Assign tickets to team members
- Add notes and comments
- Set priorities

### Notifications
- Customizable push notifications
- Sound and vibration settings
- Notification grouping
- Do Not Disturb mode

### Offline Mode
- Access recent conversations offline
- Draft responses while offline
- Auto-sync when connection restored
- Offline notification queue

## Navigation

### Main Tabs
- **Chats**: Active conversations
- **Tickets**: All support tickets
- **Dashboard**: Quick metrics
- **More**: Settings and options

### Gestures
- Swipe right: Mark as read
- Swipe left: Archive/Delete
- Pull down: Refresh
- Long press: Quick actions

## Chat Features

### Sending Messages
- Tap the message field to type
- Use voice input with microphone icon
- Send files with attachment icon
- Add emojis with emoji picker

### Quick Replies
Access saved responses:
1. Tap the shortcuts icon
2. Select a template
3. Customize if needed
4. Send

### Rich Messaging
- Send images and videos
- Share documents
- Send location
- Share contacts
- Record voice notes

## Ticket Management

### Creating Tickets
1. Tap + button
2. Select "New Ticket"
3. Fill in details
4. Assign priority
5. Submit

### Updating Tickets
- Change status with dropdown
- Add internal notes
- Update custom fields
- Attach files
- Set reminders

### Filters and Search
- Filter by status, priority, assignee
- Search by keyword
- Sort by date, priority, status
- Save favorite filters

## Settings and Customization

### Notification Settings
Customize notifications for:
- New chats
- Ticket updates
- @mentions
- High priority items
- Team messages

### Appearance
- Light/Dark mode
- Font size adjustment
- Chat bubble style
- Color themes

### Privacy
- Passcode lock
- Biometric authentication (Face ID/Touch ID)
- Hide message previews
- Secure mode

## Performance Tips

### Battery Optimization
- Enable battery saver mode
- Reduce notification frequency
- Close app when not in use
- Disable background refresh if needed

### Data Usage
- Enable Wi-Fi only sync
- Compress images before sending
- Download attachments manually
- Monitor data usage in settings

## Troubleshooting

### App Crashes
If the app crashes:
1. Force close the app
2. Clear app cache
3. Update to latest version
4. Reinstall if needed

### Sync Issues
If data isn't syncing:
- Check internet connection
- Log out and log back in
- Verify server status
- Contact support

### Notification Problems
If notifications aren't working:
- Check notification permissions
- Verify app settings
- Check device Do Not Disturb
- Ensure background app refresh is enabled

### Login Issues
Can't log in?
- Verify credentials
- Reset password if needed
- Check for app updates
- Clear app data

## Advanced Features

### Widgets (iOS)
Add widgets to home screen:
1. Long press home screen
2. Tap + icon
3. Find LinoChat
4. Select widget size
5. Place on home screen

### Shortcuts (iOS)
Create Siri shortcuts for:
- Quick chat access
- Ticket creation
- Status checks

### Quick Settings (Android)
Add quick tiles for:
- Toggle status
- New ticket
- Quick reply

## Updates and Support

### App Updates
- Auto-update: Enable in store settings
- Manual update: Check store regularly
- Update notifications: In-app alerts

### Getting Help
- In-app help: Tap ? icon
- Chat support: Available 24/7
- Email: mobile-support@linochat.com
- FAQ: app.linochat.com/help

## What's New

Check the "What's New" section in app settings to see:
- Latest features
- Improvements
- Bug fixes
- Release notes

---

Enjoying the app? Rate us in the App Store or Google Play!`,
  },
];

export default function AIArticleGenerator() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [previewArticle, setPreviewArticle] = useState<SuggestedArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Simulate AI generation with loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second loading simulation

    return () => clearTimeout(timer);
  }, []);

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSaveSelected = () => {
    setIsSaving(true);
    const count = selectedArticles.length;
    // Simulate saving process
    setTimeout(() => {
      setIsSaving(false);
      setSavedCount(count);
      setShowConfirmation(true);
    }, 1500);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ProjectSelector />
          <div>
            <h1 className="font-semibold">AI Article Generator</h1>
            <p className="text-sm text-gray-500">Generate knowledge base articles from your website</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 scroll-smooth pb-24 bg-gray-50">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative mb-8">
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyzing Your Website</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Our AI is scanning your website content and generating helpful articles for your knowledge base...
            </p>
            <div className="space-y-3 w-full max-w-md">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-600">Scanning website pages...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="text-gray-600">Analyzing common questions...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                <span className="text-gray-600">Generating article drafts...</span>
              </div>
            </div>
          </div>
        ) : (
          // Suggested Articles List
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-1">AI-Generated Articles</h2>
                  <p className="text-gray-600">
                    Review and select articles to add to your knowledge base ({selectedArticles.length} selected)
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveSelected}
                    disabled={selectedArticles.length === 0 || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Selected ({selectedArticles.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedArticles(mockSuggestedArticles.map(a => a.id))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedArticles([])}
                >
                  Deselect All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const highRelevance = mockSuggestedArticles
                      .filter(a => a.relevanceScore >= 90)
                      .map(a => a.id);
                    setSelectedArticles(highRelevance);
                  }}
                >
                  Select High Relevance Only
                </Button>
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {mockSuggestedArticles.map((article) => {
                const isSelected = selectedArticles.includes(article.id);
                return (
                  <Card
                    key={article.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => toggleArticleSelection(article.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleArticleSelection(article.id)}
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {article.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRelevanceColor(article.relevanceScore)}`}
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {article.relevanceScore}% Relevance
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewArticle(article);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{article.summary}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.estimatedReadTime}
                        </div>
                        <div className="flex gap-1">
                          {article.suggestedTags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:left-24 bg-white border-t p-4 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedArticles.length} article{selectedArticles.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveSelected}
                    disabled={selectedArticles.length === 0 || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Selected ({selectedArticles.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Article Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                {previewArticle?.title}
              </div>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline">{previewArticle?.category}</Badge>
              <Badge variant="outline" className={getRelevanceColor(previewArticle?.relevanceScore || 0)}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {previewArticle?.relevanceScore}% Relevance
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {previewArticle?.estimatedReadTime}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
            <div className="whitespace-pre-wrap">{previewArticle?.content}</div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              {previewArticle?.suggestedTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewArticle(null)}>
                Close
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (previewArticle) {
                    toggleArticleSelection(previewArticle.id);
                    setPreviewArticle(null);
                  }
                }}
              >
                {selectedArticles.includes(previewArticle?.id || '') ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Selection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Articles Saved
              </div>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {savedCount} article{savedCount !== 1 ? 's' : ''} added to knowledge base
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Your selected articles have been successfully added to the knowledge base.</p>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowConfirmation(false);
                  navigate('/admin/dashboard', { state: { message: `Successfully added ${savedCount} articles to knowledge base!` } });
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}