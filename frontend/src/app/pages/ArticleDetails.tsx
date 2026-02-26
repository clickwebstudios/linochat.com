import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Tag as TagIcon,
  Calendar,
  User,
  CheckCircle,
  Loader2,
  X,
  Clock,
  Edit,
  ThumbsUp,
  BarChart,
  Sparkles,
  Trash2,
  AlertCircle,
  FolderOpen,
  FolderKanban,
} from 'lucide-react';
import { getDynamicArticle, deleteDynamicArticle, saveDynamicArticle } from '../lib/articleStore';
import { mockProjects } from '../data/mockData';
import { toast } from 'sonner';

// Category-to-project mapping (mirrors AgentKnowledgeView categories)
const categoryProjectMap: Record<string, string> = {
  '1': 'proj-1',
  '2': 'proj-1',
  '3': 'proj-2',
  '4': 'proj-3',
};

// Mock article detail data keyed by article id
const articleDetailData: Record<string, {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  status: 'published' | 'draft';
  updatedAt: string;
  createdAt: string;
  author: string;
  views: number;
  helpful: number;
  tags: string[];
  excerpt: string;
  content: string;
}> = {
  'a1': {
    id: 'a1', title: 'Getting Started with LinoChat', category: 'Getting Started', categoryId: '1',
    status: 'published', updatedAt: '2026-02-08', createdAt: '2026-01-15', author: 'Sarah Chen',
    views: 1250, helpful: 45, tags: ['onboarding', 'setup', 'beginner'],
    excerpt: 'A comprehensive guide to help new users get started with LinoChat, from account setup to sending your first message.',
    content: `# Getting Started with LinoChat

Welcome to LinoChat! This guide will walk you through everything you need to know to get up and running with our customer support platform.

## 1. Creating Your Account

After receiving your invitation email, click the activation link to set up your account. You'll need to:

- Choose a secure password (minimum 8 characters)
- Set up your profile with name and avatar
- Configure your notification preferences

## 2. Navigating the Dashboard

The LinoChat dashboard is your central hub for all customer interactions. Here's what you'll find:

- **Home**: Overview of your activity and key metrics
- **Conversations**: Live chat interface for real-time customer support
- **Tickets**: Track and manage support tickets
- **Knowledge Base**: Access and manage help articles

## 3. Setting Up Your First Project

Projects help you organize your support channels. To create your first project:

1. Navigate to the Projects section
2. Click "New Project"
3. Enter a project name and description
4. Configure your chat widget settings
5. Install the widget on your website

## 4. Handling Your First Conversation

When a customer initiates a chat, you'll receive a notification. Click on the conversation to:

- View the customer's message and context
- Type your response in the message area
- Use canned responses for common questions
- Transfer to another agent if needed

## 5. Best Practices

- Respond to customers within 2 minutes
- Use a friendly, professional tone
- Leverage the knowledge base for consistent answers
- Tag conversations for easy tracking
- Follow up on unresolved issues`
  },
  'a2': {
    id: 'a2', title: 'Setting Up Your First Project', category: 'Getting Started', categoryId: '1',
    status: 'published', updatedAt: '2026-02-06', createdAt: '2026-01-18', author: 'Michael Torres',
    views: 980, helpful: 38, tags: ['project', 'setup', 'configuration'],
    excerpt: 'Learn how to create and configure your first LinoChat project to start managing customer conversations.',
    content: `# Setting Up Your First Project

Projects in LinoChat are the foundation of your customer support workflow. Each project can have its own chat widget, team members, and configuration.

## Creating a New Project

1. From the dashboard, click **Projects** in the sidebar
2. Click the **New Project** button
3. Fill in the project details:
   - **Project Name**: Choose a descriptive name
   - **Description**: Brief overview of the project's purpose
   - **Website URL**: The domain where the widget will be installed

## Configuring the Chat Widget

After creating your project, you'll need to configure the chat widget:

### Appearance
- Choose your brand color
- Upload your company logo
- Set the widget position (bottom-right or bottom-left)
- Customize the welcome message

### Behavior
- Set business hours for auto-replies
- Configure offline message handling
- Enable or disable file attachments
- Set up pre-chat forms

## Installing the Widget

Copy the installation code snippet and paste it into your website's HTML, just before the closing \`</body>\` tag:

\`\`\`html
<script src="https://cdn.linochat.com/widget.js" data-project="YOUR_PROJECT_ID"></script>
\`\`\`

## Adding Team Members

Invite your team to collaborate:

1. Go to **Project Settings** > **Team**
2. Click **Invite Member**
3. Enter the email address and select a role
4. The team member will receive an invitation email`
  },
  'a3': {
    id: 'a3', title: 'Understanding the Dashboard', category: 'Getting Started', categoryId: '1',
    status: 'published', updatedAt: '2026-02-05', createdAt: '2026-01-20', author: 'Sarah Chen',
    views: 870, helpful: 29, tags: ['dashboard', 'navigation', 'overview'],
    excerpt: 'A walkthrough of the LinoChat dashboard interface and its key features.',
    content: `# Understanding the Dashboard

The LinoChat dashboard provides a comprehensive overview of your support operations. This guide will help you navigate each section effectively.

## Dashboard Overview

When you log in, you'll see the main dashboard with key metrics including active conversations, open tickets, response times, and customer satisfaction scores.

## Navigation Sidebar

The sidebar contains links to all major sections of the platform. Each icon represents a different area of functionality, and you can hover over them to see labels.

## Key Metrics

- **Active Chats**: Number of ongoing conversations
- **Open Tickets**: Unresolved support tickets
- **Avg Response Time**: Your team's average first response time
- **CSAT Score**: Customer satisfaction rating

## Quick Actions

Use the quick action buttons to start new conversations, create tickets, or access frequently used features without navigating away from the dashboard.`
  },
  'a4': {
    id: 'a4', title: 'Quick Start: Chat Widget Installation', category: 'Getting Started', categoryId: '1',
    status: 'published', updatedAt: '2026-02-04', createdAt: '2026-01-22', author: 'David Kim',
    views: 1100, helpful: 52, tags: ['widget', 'installation', 'quick-start'],
    excerpt: 'A quick-start guide for installing the LinoChat widget on your website in minutes.',
    content: `# Quick Start: Chat Widget Installation

Get the LinoChat chat widget running on your website in under 5 minutes.

## Step 1: Get Your Widget Code

Navigate to **Settings > Chat Widget** and copy the embed code provided.

## Step 2: Add to Your Website

Paste the code snippet just before the closing \`</body>\` tag of your website's HTML.

## Step 3: Verify Installation

Visit your website and look for the chat widget icon in the bottom-right corner. Click it to test the chat functionality.

## Troubleshooting

If the widget doesn't appear, check the browser console for errors and ensure your domain is whitelisted in the project settings.`
  },
  'a5': {
    id: 'a5', title: 'Onboarding Checklist for New Users', category: 'Getting Started', categoryId: '1',
    status: 'draft', updatedAt: '2026-02-03', createdAt: '2026-01-25', author: 'Emily Rodriguez',
    views: 640, helpful: 21, tags: ['onboarding', 'checklist', 'new-users'],
    excerpt: 'A step-by-step checklist to help new users complete their LinoChat setup.',
    content: `# Onboarding Checklist for New Users

Use this checklist to ensure you've completed all the essential setup steps.

## Account Setup
- [ ] Create your account
- [ ] Set up your profile
- [ ] Configure notification preferences
- [ ] Enable two-factor authentication

## Project Configuration
- [ ] Create your first project
- [ ] Configure the chat widget
- [ ] Install the widget on your website
- [ ] Set up business hours

## Team Setup
- [ ] Invite team members
- [ ] Assign roles and permissions
- [ ] Create canned responses
- [ ] Set up routing rules

## Knowledge Base
- [ ] Create help categories
- [ ] Write your first articles
- [ ] Review and publish content`
  },
  'a6': {
    id: 'a6', title: 'How to Reset Your Password', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-09', createdAt: '2026-01-10', author: 'Sarah Chen',
    views: 890, helpful: 78, tags: ['password', 'account', 'security'],
    excerpt: 'Step-by-step instructions for resetting your LinoChat account password.',
    content: `# How to Reset Your Password

If you've forgotten your password or need to change it for security reasons, follow these steps.

## Option 1: Reset via Email

1. Go to the login page
2. Click **Forgot Password**
3. Enter your registered email address
4. Check your inbox for the reset link
5. Click the link and enter your new password

## Option 2: Change from Settings

If you're already logged in:

1. Click your avatar in the top-right corner
2. Select **Profile Settings**
3. Scroll to the **Security** section
4. Click **Change Password**
5. Enter your current password and new password

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

## Troubleshooting

If you don't receive the reset email, check your spam folder or contact support.`
  },
  'a7': {
    id: 'a7', title: 'Managing Team Members', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-07', createdAt: '2026-01-12', author: 'Michael Torres',
    views: 560, helpful: 34, tags: ['team', 'management', 'roles'],
    excerpt: 'Learn how to add, remove, and manage team members in your LinoChat workspace.',
    content: `# Managing Team Members

Effective team management ensures smooth customer support operations.

## Adding Team Members

1. Navigate to **Settings > Team**
2. Click **Invite Member**
3. Enter the email address
4. Select a role (Agent, Admin, or Viewer)
5. Click **Send Invitation**

## Roles and Permissions

- **Agent**: Can handle conversations and tickets
- **Admin**: Full access to settings and management
- **Viewer**: Read-only access to reports and analytics

## Removing a Team Member

1. Go to **Settings > Team**
2. Find the team member
3. Click the three-dot menu
4. Select **Remove from Team**
5. Confirm the removal`
  },
  'a8': {
    id: 'a8', title: 'Updating Profile Information', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-06', createdAt: '2026-01-14', author: 'Emily Rodriguez',
    views: 430, helpful: 22, tags: ['profile', 'settings', 'account'],
    excerpt: 'How to update your profile details, avatar, and personal preferences.',
    content: `# Updating Profile Information

Keep your profile up to date so your team and customers can identify you easily.

## Editing Your Profile

1. Click your avatar in the top-right corner
2. Select **Profile Settings**
3. Update your information:
   - Display name
   - Email address
   - Avatar/profile picture
   - Bio/description
   - Time zone

## Notification Preferences

Configure how you receive notifications for new chats, ticket updates, and team mentions.`
  },
  'a9': {
    id: 'a9', title: 'Two-Factor Authentication Setup', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-05', createdAt: '2026-01-16', author: 'David Kim',
    views: 720, helpful: 41, tags: ['2fa', 'security', 'authentication'],
    excerpt: 'Secure your account with two-factor authentication for an extra layer of protection.',
    content: `# Two-Factor Authentication Setup

Two-factor authentication (2FA) adds an extra layer of security to your account.

## Setting Up 2FA

1. Go to **Profile Settings > Security**
2. Click **Enable Two-Factor Authentication**
3. Scan the QR code with your authenticator app
4. Enter the verification code
5. Save your backup codes in a secure location

## Supported Authenticator Apps

- Google Authenticator
- Authy
- 1Password
- Microsoft Authenticator`
  },
  'a10': {
    id: 'a10', title: 'Role Permissions Explained', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-04', createdAt: '2026-01-18', author: 'Sarah Chen',
    views: 610, helpful: 36, tags: ['roles', 'permissions', 'access-control'],
    excerpt: 'Detailed breakdown of role-based permissions in LinoChat.',
    content: `# Role Permissions Explained

LinoChat uses role-based access control to manage what each team member can do.

## Available Roles

### Agent
- Handle live conversations
- Create and manage tickets
- Access knowledge base
- View personal performance metrics

### Admin
- All Agent permissions
- Manage team members
- Configure project settings
- Access full analytics and reports
- Manage knowledge base categories

### Super Admin
- All Admin permissions
- Manage billing and subscriptions
- Access audit logs
- Configure SSO and security settings
- Manage multiple workspaces`
  },
  'a11': {
    id: 'a11', title: 'Account Deactivation Guide', category: 'Account Management', categoryId: '2',
    status: 'draft', updatedAt: '2026-02-03', createdAt: '2026-01-20', author: 'Michael Torres',
    views: 290, helpful: 15, tags: ['deactivation', 'account', 'close'],
    excerpt: 'How to deactivate or permanently delete your LinoChat account.',
    content: `# Account Deactivation Guide

If you need to deactivate or delete your account, follow these steps carefully.

## Deactivation vs. Deletion

- **Deactivation**: Temporarily disables your account. You can reactivate it later.
- **Deletion**: Permanently removes your account and all associated data.

## How to Deactivate

1. Go to **Profile Settings > Account**
2. Scroll to **Account Status**
3. Click **Deactivate Account**
4. Confirm your decision

## Data Retention

After deactivation, your data is retained for 30 days. After deletion, data is permanently removed within 14 days.`
  },
  'a12': {
    id: 'a12', title: 'SSO Configuration', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-02', createdAt: '2026-01-22', author: 'David Kim',
    views: 380, helpful: 27, tags: ['sso', 'enterprise', 'authentication'],
    excerpt: 'Configure Single Sign-On for your organization.',
    content: `# SSO Configuration

Set up Single Sign-On (SSO) to allow team members to log in with their organizational credentials.

## Supported Providers

- SAML 2.0
- OAuth 2.0 / OpenID Connect
- Google Workspace
- Microsoft Azure AD
- Okta

## Setup Steps

1. Navigate to **Settings > Security > SSO**
2. Select your identity provider
3. Enter the required configuration details
4. Test the connection
5. Enable SSO for your organization`
  },
  'a13': {
    id: 'a13', title: 'API Key Management', category: 'Account Management', categoryId: '2',
    status: 'published', updatedAt: '2026-02-01', createdAt: '2026-01-24', author: 'Emily Rodriguez',
    views: 450, helpful: 31, tags: ['api', 'keys', 'developer'],
    excerpt: 'How to create, manage, and revoke API keys for LinoChat integrations.',
    content: `# API Key Management

API keys allow you to integrate LinoChat with your existing tools and workflows.

## Creating an API Key

1. Go to **Settings > API**
2. Click **Generate New Key**
3. Name your key and set permissions
4. Copy the key — it won't be shown again

## Best Practices

- Use descriptive names for your keys
- Set minimum required permissions
- Rotate keys regularly
- Never expose keys in client-side code`
  },
  'a14': {
    id: 'a14', title: 'Billing FAQs', category: 'Billing & Payments', categoryId: '3',
    status: 'published', updatedAt: '2026-02-08', createdAt: '2026-01-10', author: 'Sarah Chen',
    views: 560, helpful: 34, tags: ['billing', 'faq', 'payment'],
    excerpt: 'Answers to frequently asked questions about billing and payments.',
    content: `# Billing FAQs

Find answers to common billing questions below.

## When am I billed?
Billing occurs on the same day each month as your original signup date.

## Can I change my plan?
Yes, you can upgrade or downgrade your plan at any time from the billing settings page.

## What payment methods do you accept?
We accept Visa, Mastercard, American Express, and PayPal.

## How do I get a receipt?
Receipts are automatically sent to your billing email after each payment. You can also download them from the billing history page.

## Is there a free trial?
Yes, all paid plans include a 14-day free trial with full features.`
  },
  'a15': {
    id: 'a15', title: 'Understanding Your Invoice', category: 'Billing & Payments', categoryId: '3',
    status: 'published', updatedAt: '2026-02-06', createdAt: '2026-01-12', author: 'Michael Torres',
    views: 480, helpful: 28, tags: ['invoice', 'billing', 'charges'],
    excerpt: 'A detailed guide to understanding your LinoChat invoice line items.',
    content: `# Understanding Your Invoice

Learn how to read and understand your LinoChat invoice.

## Invoice Sections

- **Subscription Charge**: Your monthly or annual plan cost
- **Add-ons**: Any additional features or agent seats
- **Usage Charges**: Overage charges for exceeding plan limits
- **Credits**: Any promotional credits or refunds applied
- **Tax**: Applicable taxes based on your billing address

## Downloading Invoices

Navigate to **Settings > Billing > Invoice History** to download past invoices in PDF format.`
  },
  'a16': {
    id: 'a16', title: 'Upgrading Your Plan', category: 'Billing & Payments', categoryId: '3',
    status: 'published', updatedAt: '2026-02-05', createdAt: '2026-01-14', author: 'Emily Rodriguez',
    views: 720, helpful: 45, tags: ['upgrade', 'plan', 'pricing'],
    excerpt: 'How to upgrade your LinoChat subscription plan for more features and capacity.',
    content: `# Upgrading Your Plan

Upgrade your plan to unlock more features, agent seats, and higher limits.

## How to Upgrade

1. Go to **Settings > Billing**
2. Click **Change Plan**
3. Select your desired plan
4. Review the prorated charges
5. Confirm the upgrade

## Prorated Billing

When you upgrade mid-cycle, you'll only be charged the prorated difference for the remaining days in your billing period.`
  },
  'a17': {
    id: 'a17', title: 'Payment Methods Guide', category: 'Billing & Payments', categoryId: '3',
    status: 'published', updatedAt: '2026-02-04', createdAt: '2026-01-16', author: 'David Kim',
    views: 390, helpful: 19, tags: ['payment', 'credit-card', 'methods'],
    excerpt: 'How to add, update, or remove payment methods from your account.',
    content: `# Payment Methods Guide

Manage your payment methods to ensure uninterrupted service.

## Adding a Payment Method

1. Go to **Settings > Billing > Payment Methods**
2. Click **Add Payment Method**
3. Enter your card details or PayPal information
4. Set as default if desired

## Updating a Payment Method

Click the edit icon next to your existing payment method to update the details.

## Removing a Payment Method

You can remove a payment method as long as you have at least one active method on file.`
  },
  'a18': {
    id: 'a18', title: 'Refund Policy', category: 'Billing & Payments', categoryId: '3',
    status: 'published', updatedAt: '2026-02-03', createdAt: '2026-01-18', author: 'Sarah Chen',
    views: 310, helpful: 16, tags: ['refund', 'cancellation', 'policy'],
    excerpt: 'Our refund policy and how to request a refund for your subscription.',
    content: `# Refund Policy

We want you to be satisfied with LinoChat. Here's our refund policy.

## Eligibility

- Refunds are available within 30 days of purchase for annual plans
- Monthly plans can be cancelled at any time with no refund for the current period
- Unused credits are non-refundable

## How to Request a Refund

Contact our support team with your account details and reason for the refund request.`
  },
  'a19': {
    id: 'a19', title: 'Tax & Compliance Information', category: 'Billing & Payments', categoryId: '3',
    status: 'draft', updatedAt: '2026-02-02', createdAt: '2026-01-20', author: 'Michael Torres',
    views: 250, helpful: 12, tags: ['tax', 'compliance', 'vat'],
    excerpt: 'Information about tax calculations and compliance for LinoChat subscriptions.',
    content: `# Tax & Compliance Information

Understand how taxes are applied to your LinoChat subscription.

## Tax Calculation

Taxes are calculated based on your billing address and applicable local tax laws. VAT is applied for EU customers.

## Tax Exemption

If your organization is tax-exempt, please provide your exemption certificate through the billing settings page.`
  },
  'a20': {
    id: 'a20', title: 'Troubleshooting Chat Widget Issues', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-09', createdAt: '2026-01-08', author: 'David Kim',
    views: 1340, helpful: 67, tags: ['troubleshooting', 'widget', 'issues'],
    excerpt: 'Common chat widget issues and how to resolve them.',
    content: `# Troubleshooting Chat Widget Issues

If your chat widget isn't working as expected, try these solutions.

## Widget Not Appearing

1. Check that the embed code is placed before \`</body>\`
2. Verify your domain is whitelisted in project settings
3. Clear your browser cache
4. Check for JavaScript errors in the browser console
5. Ensure no ad blockers are interfering

## Widget Not Connecting

- Verify your internet connection
- Check the LinoChat status page for outages
- Try disabling browser extensions
- Test in an incognito window

## Styling Conflicts

If the widget looks broken, check for CSS conflicts with your website's stylesheets. Use the custom CSS option in widget settings to override conflicting styles.`
  },
  'a21': {
    id: 'a21', title: 'API Integration Guide', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-08', createdAt: '2026-01-10', author: 'Emily Rodriguez',
    views: 980, helpful: 54, tags: ['api', 'integration', 'developer'],
    excerpt: 'Complete guide to integrating with the LinoChat REST API.',
    content: `# API Integration Guide

Integrate LinoChat with your existing systems using our REST API.

## Authentication

All API requests require an API key passed in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Base URL

\`\`\`
https://api.linochat.com/v1
\`\`\`

## Key Endpoints

- \`GET /conversations\` — List conversations
- \`POST /conversations\` — Create a conversation
- \`GET /tickets\` — List tickets
- \`POST /tickets\` — Create a ticket
- \`GET /contacts\` — List contacts

## Rate Limits

API requests are limited to 100 requests per minute per API key.`
  },
  'a22': {
    id: 'a22', title: 'Webhook Configuration', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-07', createdAt: '2026-01-12', author: 'David Kim',
    views: 870, helpful: 43, tags: ['webhook', 'events', 'integration'],
    excerpt: 'Set up webhooks to receive real-time notifications about events in LinoChat.',
    content: `# Webhook Configuration

Webhooks allow your application to receive real-time notifications when events occur in LinoChat.

## Setting Up a Webhook

1. Go to **Settings > Integrations > Webhooks**
2. Click **Add Webhook**
3. Enter your endpoint URL
4. Select the events you want to subscribe to
5. Test the webhook
6. Save

## Available Events

- conversation.created
- conversation.closed
- message.received
- ticket.created
- ticket.updated
- contact.created`
  },
  'a23': {
    id: 'a23', title: 'Error Codes Reference', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-06', createdAt: '2026-01-14', author: 'Sarah Chen',
    views: 1120, helpful: 61, tags: ['errors', 'api', 'reference'],
    excerpt: 'A complete reference of LinoChat error codes and their meanings.',
    content: `# Error Codes Reference

This document lists all error codes you may encounter when using the LinoChat API.

## HTTP Status Codes

- **400** Bad Request — Invalid parameters
- **401** Unauthorized — Invalid or missing API key
- **403** Forbidden — Insufficient permissions
- **404** Not Found — Resource doesn't exist
- **429** Too Many Requests — Rate limit exceeded
- **500** Internal Server Error — Server-side issue

## Application Error Codes

- **E1001** — Invalid conversation ID
- **E1002** — Message too long
- **E1003** — Attachment size exceeds limit
- **E2001** — Invalid ticket status transition
- **E2002** — Ticket already closed`
  },
  'a24': {
    id: 'a24', title: 'Performance Optimization Tips', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-05', createdAt: '2026-01-16', author: 'Michael Torres',
    views: 760, helpful: 39, tags: ['performance', 'optimization', 'speed'],
    excerpt: 'Tips for optimizing LinoChat widget performance on your website.',
    content: `# Performance Optimization Tips

Ensure the LinoChat widget loads quickly and doesn't impact your website's performance.

## Loading Strategy

- Use async loading for the widget script
- Enable lazy loading to defer widget initialization
- Minimize custom CSS overrides

## Caching

The widget automatically caches static assets. Ensure your CDN configuration doesn't interfere with caching headers.

## Mobile Optimization

The widget is mobile-responsive by default. For best results, avoid custom CSS that overrides the responsive behavior.`
  },
  'a25': {
    id: 'a25', title: 'Mobile SDK Setup', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-04', createdAt: '2026-01-18', author: 'Emily Rodriguez',
    views: 640, helpful: 32, tags: ['mobile', 'sdk', 'ios', 'android'],
    excerpt: 'How to integrate the LinoChat SDK into your iOS and Android apps.',
    content: `# Mobile SDK Setup

Add in-app messaging to your mobile applications with the LinoChat SDK.

## iOS Setup

Install via CocoaPods or Swift Package Manager and initialize with your project key.

## Android Setup

Add the dependency to your build.gradle file and initialize in your Application class.

## React Native

Install the React Native package and follow the linking instructions for both platforms.`
  },
  'a26': {
    id: 'a26', title: 'Browser Compatibility Guide', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-03', createdAt: '2026-01-20', author: 'David Kim',
    views: 520, helpful: 25, tags: ['browser', 'compatibility', 'support'],
    excerpt: 'Supported browsers and known compatibility issues.',
    content: `# Browser Compatibility Guide

LinoChat supports all modern browsers. Here's the full compatibility breakdown.

## Supported Browsers

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+
- Opera 67+

## Known Issues

- IE 11: Not supported
- Safari private browsing: Limited local storage`
  },
  'a27': {
    id: 'a27', title: 'Debugging Network Issues', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-02-02', createdAt: '2026-01-22', author: 'Sarah Chen',
    views: 890, helpful: 48, tags: ['debugging', 'network', 'connectivity'],
    excerpt: 'How to diagnose and fix network-related issues with LinoChat.',
    content: `# Debugging Network Issues

If you're experiencing connectivity problems, follow these diagnostic steps.

## Check Connection

1. Verify your internet connection is stable
2. Check the LinoChat status page
3. Test with a different network

## Firewall Configuration

Ensure your firewall allows connections to \`*.linochat.com\` on ports 443 (HTTPS) and 8443 (WebSocket).

## Proxy Settings

If you're behind a corporate proxy, configure it to allow WebSocket connections.`
  },
  'a28': {
    id: 'a28', title: 'Custom CSS Styling Guide', category: 'Technical Support', categoryId: '4',
    status: 'draft', updatedAt: '2026-02-01', createdAt: '2026-01-24', author: 'Michael Torres',
    views: 430, helpful: 22, tags: ['css', 'styling', 'customization'],
    excerpt: 'How to customize the appearance of the chat widget using CSS.',
    content: `# Custom CSS Styling Guide

Customize the look and feel of your LinoChat widget to match your brand.

## Using the Style Editor

Navigate to **Widget Settings > Appearance > Custom CSS** to add your custom styles.

## Available CSS Variables

- \`--lc-primary-color\`: Main brand color
- \`--lc-font-family\`: Widget font family
- \`--lc-border-radius\`: Corner roundness
- \`--lc-header-bg\`: Header background color`
  },
  'a29': {
    id: 'a29', title: 'Firewall & Proxy Configuration', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-01-31', createdAt: '2026-01-26', author: 'David Kim',
    views: 380, helpful: 18, tags: ['firewall', 'proxy', 'network'],
    excerpt: 'Configure your firewall and proxy settings for LinoChat.',
    content: `# Firewall & Proxy Configuration

Ensure LinoChat works correctly behind corporate firewalls and proxies.

## Required Domains

Allow traffic to these domains:
- \`app.linochat.com\`
- \`api.linochat.com\`
- \`cdn.linochat.com\`
- \`ws.linochat.com\`

## Required Ports

- 443 (HTTPS)
- 8443 (WebSocket)`
  },
  'a30': {
    id: 'a30', title: 'Data Export & Backup', category: 'Technical Support', categoryId: '4',
    status: 'published', updatedAt: '2026-01-30', createdAt: '2026-01-28', author: 'Emily Rodriguez',
    views: 510, helpful: 29, tags: ['export', 'backup', 'data'],
    excerpt: 'How to export your LinoChat data for backup or migration purposes.',
    content: `# Data Export & Backup

Export your LinoChat data for backup, compliance, or migration purposes.

## Available Exports

- Conversations (JSON/CSV)
- Tickets (JSON/CSV)
- Contacts (JSON/CSV)
- Knowledge Base Articles (JSON/Markdown)
- Analytics Reports (PDF/CSV)

## How to Export

1. Go to **Settings > Data Management**
2. Select the data type to export
3. Choose the format and date range
4. Click **Export**
5. Download the file when ready`
  },
  'a31': {
    id: 'a31', title: 'Server Status & Monitoring', category: 'Technical Support', categoryId: '4',
    status: 'draft', updatedAt: '2026-01-29', createdAt: '2026-01-30', author: 'David Kim',
    views: 340, helpful: 14, tags: ['status', 'monitoring', 'uptime'],
    excerpt: 'How to monitor LinoChat server status and set up alerts.',
    content: `# Server Status & Monitoring

Stay informed about LinoChat's operational status and set up alerts for outages.

## Status Page

Visit status.linochat.com for real-time updates on all LinoChat services.

## Subscribe to Alerts

Sign up for email or SMS notifications when incidents are reported or resolved.

## API Health Check

Use the \`GET /health\` endpoint to programmatically check the API status.`
  },
};

const categoryMap: Record<string, string> = {
  '1': 'Getting Started',
  '2': 'Account Management',
  '3': 'Billing & Payments',
  '4': 'Technical Support',
};

export default function ArticleDetails() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/agent') ? '/agent' : '/admin';
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiArticle, setApiArticle] = useState<any>(null);

  // Store project ID for API calls
  const [projectId, setProjectId] = useState<string>('');

  // Fetch article from API if not in mock data
  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setLoading(false);
        return;
      }

      // First check mock data
      const mockArticle = articleDetailData[articleId];
      if (mockArticle) {
        setApiArticle(mockArticle);
        setLoading(false);
        return;
      }

      // Check dynamic store
      const dynamicArticle = getDynamicArticle(articleId);
      if (dynamicArticle) {
        setApiArticle(dynamicArticle);
        setLoading(false);
        return;
      }

      // Try to fetch from API
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/kb/articles/${articleId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const article = data.data;
            // Get project ID from category
            const catResponse = await fetch(`/api/kb/articles/${articleId}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (catResponse.ok) {
              const catData = await catResponse.json();
              if (catData.success && catData.data?.category?.project_id) {
                setProjectId(catData.data.category.project_id);
              }
            }
            setApiArticle({
              id: article.id,
              title: article.title,
              category: article.category?.name || article.category || 'Uncategorized',
              categoryId: article.category_id || article.categoryId || '',
              status: article.is_published ? 'published' : 'draft',
              updatedAt: article.updated_at?.substring(0, 10) || '',
              createdAt: article.created_at?.substring(0, 10) || '',
              author: article.author?.name || article.author || 'AI Assistant',
              views: article.views || article.views_count || 0,
              helpful: article.helpful_count || 0,
              tags: article.tags || [],
              excerpt: article.excerpt || article.summary || '',
              content: article.content || article.body || 'No content available',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
      }
      
      setLoading(false);
    };

    fetchArticle();
  }, [articleId]);

  const article = apiArticle;

  // Fallback: check route state
  const routeArticle = (location.state as { article?: typeof article })?.article ?? null;
  const resolvedArticle = article || routeArticle;

  const [editData, setEditData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    status: 'draft' as 'published' | 'draft',
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  const [successDialogStatus, setSuccessDialogStatus] = useState<'published' | 'draft'>('draft');
  const [showProjectSelectDialog, setShowProjectSelectDialog] = useState(false);
  const [userProjects, setUserProjects] = useState<Array<{id: string, name: string}>>([]);
  const [pendingStatus, setPendingStatus] = useState<'published' | 'draft'>('draft');

  // Sync editData when article is loaded
  useEffect(() => {
    if (resolvedArticle) {
      setEditData({
        title: resolvedArticle.title || '',
        excerpt: resolvedArticle.excerpt || '',
        content: resolvedArticle.content || '',
        category: resolvedArticle.category || '',
        status: resolvedArticle.status || 'draft',
        tags: resolvedArticle.tags || [],
      });
    }
  }, [resolvedArticle]);

  // Load user projects for project selection
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserProjects(data.data.map((p: any) => ({ id: p.id, name: p.name })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    
    fetchProjects();
  }, []);

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-600 mb-4 animate-spin" />
        <h2 className="text-xl mb-2">Loading article...</h2>
      </div>
    );
  }

  if (!resolvedArticle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl mb-2">Article Not Found</h2>
        <p className="text-gray-500 mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate(`${basePath}/knowledge`)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const handleSave = async (status?: 'published' | 'draft', selectedProjectId?: string) => {
    if (!articleId || !resolvedArticle) return;
    
    setIsSaving(true);
    
    // Сохраняем статус локально для диалога
    const dialogStatus = status || editData.status;
    
    // Если нет projectId и не передан selectedProjectId, показываем диалог выбора
    if (!projectId && !selectedProjectId) {
      if (userProjects.length === 0) {
        toast.error('No projects available. Please create a project first.');
        setIsSaving(false);
        return;
      }
      setPendingStatus(dialogStatus);
      setShowProjectSelectDialog(true);
      setIsSaving(false);
      return;
    }
    
    const targetProjectId = projectId || selectedProjectId;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        setIsSaving(false);
        return;
      }

      // Determine if this is a dynamic article or API article
      const dynamicArticle = getDynamicArticle(articleId);
      
      console.log('Saving article via API to project:', targetProjectId);
      
      // Проверяем, существует ли статья на сервере или это новая AI-статья
      const isExistingApiArticle = !dynamicArticle || apiArticle?.id === articleId;
      
      const articleData: any = {
        title: editData.title,
        content: editData.content,
        is_published: status === 'published',
      };
      
      // Если у статьи есть categoryId (из AI генератора), добавляем его
      if (resolvedArticle.categoryId || editData.category) {
        articleData.category_id = resolvedArticle.categoryId || editData.category;
      }
      
      let response;
      
      if (isExistingApiArticle) {
        // Обновляем существующую статью
        console.log('Updating existing article via PUT');
        response = await fetch(`/api/projects/${targetProjectId}/kb/articles/${articleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });
      } else {
        // Создаем новую статью (AI статья еще не на сервере)
        console.log('Creating new article via POST');
        response = await fetch(`/api/projects/${targetProjectId}/kb/articles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...articleData,
            category_id: resolvedArticle.categoryId || 'default',
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to save article');
      }

      const data = await response.json();
      if (data.success) {
        const newStatus = status || resolvedArticle.status;
        // Update local state
        setApiArticle(prev => prev ? {
          ...prev,
          title: editData.title,
          content: editData.content,
          excerpt: editData.excerpt,
          status: newStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        } : null);
        // Sync editData with saved state
        setEditData(prev => ({
          ...prev,
          status: newStatus,
        }));
        toast.success(status === 'published' ? 'Article published!' : 'Draft saved!');
      } else if (dynamicArticle) {
        console.log('Saving dynamic article in memory');
        // Update dynamic article in memory (only if no projectId)
        const updatedStatus = status || editData.status;
        const updatedArticle = {
          ...dynamicArticle,
          title: editData.title,
          content: editData.content,
          excerpt: editData.excerpt,
          status: updatedStatus,
          category: editData.category,
          tags: editData.tags,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        // Update in store
        saveDynamicArticle(updatedArticle);
        setApiArticle(updatedArticle);
        setEditData(prev => ({ ...prev, status: updatedStatus }));
        toast.success(updatedStatus === 'published' ? 'Article published!' : 'Draft saved!');
      }
      
      setIsEditing(false);
      // Устанавливаем статус диалога и открываем его
      setSuccessDialogStatus(dialogStatus);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to save article:', error);
      toast.error('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      // Check if it's a dynamic article
      const dynamicArticle = getDynamicArticle(articleId);
      
      if (dynamicArticle) {
        // Delete from dynamic store
        deleteDynamicArticle(articleId);
        toast.success('Article deleted');
        navigate(`${basePath}/knowledge`);
        return;
      }

      // Delete via API
      if (projectId) {
        const response = await fetch(`/api/projects/${projectId}/kb/articles/${articleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete article');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Article deleted');
          navigate(`${basePath}/knowledge`);
        }
      } else {
        // No project ID, just navigate back
        toast.success('Article deleted');
        navigate(`${basePath}/knowledge`);
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast.error('Failed to delete article');
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !editData.tags.includes(currentTag.trim())) {
      setEditData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={i} className="text-2xl mb-4 mt-6 first:mt-0">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-xl mb-3 mt-5">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-lg mb-2 mt-4">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('- [ ] ')) {
        return (
          <div key={i} className="flex items-center gap-2 py-1 ml-4">
            <div className="h-4 w-4 border rounded border-gray-300" />
            <span className="text-sm">{trimmed.slice(6)}</span>
          </div>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 py-0.5 ml-4">
            <span className="text-gray-400 mt-1">•</span>
            <span className="text-sm">{renderInlineMarkdown(trimmed.slice(2))}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 ml-4">
              <span className="text-gray-500 min-w-[1.5rem] text-sm">{match[1]}.</span>
              <span className="text-sm">{renderInlineMarkdown(match[2])}</span>
            </div>
          );
        }
      }
      if (trimmed.startsWith('```')) {
        return null; // Skip code fence markers
      }
      if (trimmed === '') {
        return <div key={i} className="h-3" />;
      }
      return <p key={i} className="text-sm text-gray-700 leading-relaxed">{renderInlineMarkdown(trimmed)}</p>;
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-semibold">{part.slice(2, -2)}</span>;
      }
      // Handle inline code
      const codeParts = part.split(/(`.*?`)/g);
      return codeParts.map((codePart, j) => {
        if (codePart.startsWith('`') && codePart.endsWith('`')) {
          return <code key={`${i}-${j}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">{codePart.slice(1, -1)}</code>;
        }
        return <span key={`${i}-${j}`}>{codePart}</span>;
      });
    });
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const path = location.pathname;
              if (path.startsWith('/agent/')) {
                navigate('/agent/knowledge');
              } else if (path.startsWith('/admin/')) {
                navigate('/admin/knowledge');
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold truncate">{isEditing ? 'Editing Article' : resolvedArticle.title}</h1>
              <Badge
                variant={resolvedArticle.status === 'published' ? 'default' : 'outline'}
                className={`flex-shrink-0 ${resolvedArticle.status === 'published' ? 'bg-green-100 text-green-700' : 'text-orange-600 border-orange-200'}`}
              >
                {resolvedArticle.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 truncate">{resolvedArticle.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    title: resolvedArticle.title,
                    excerpt: resolvedArticle.excerpt,
                    content: resolvedArticle.content,
                    category: resolvedArticle.category,
                    status: resolvedArticle.status,
                    tags: resolvedArticle.tags,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Draft
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSave('published')}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Publish
              </Button>
            </>
          ) : (
            <>
              {resolvedArticle.status === 'draft' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave('draft')}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSave('published')}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Publish
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Initialize edit data from current article
                  if (resolvedArticle) {
                    setEditData({
                      title: resolvedArticle.title || '',
                      excerpt: resolvedArticle.excerpt || '',
                      content: resolvedArticle.content || '',
                      category: resolvedArticle.category || '',
                      status: resolvedArticle.status || 'draft',
                      tags: resolvedArticle.tags || [],
                    });
                  }
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {isEditing ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Article Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editData.title}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-excerpt">Short Description</Label>
                        <Textarea
                          id="edit-excerpt"
                          value={editData.excerpt}
                          onChange={(e) => setEditData(prev => ({ ...prev, excerpt: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select
                          value={editData.category}
                          onValueChange={(val) => setEditData(prev => ({ ...prev, category: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(categoryMap).map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Article Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={editData.content}
                        onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                        rows={30}
                        className="font-mono text-sm min-h-[500px]"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Supports Markdown formatting. Use # for headings, ** for bold, * for italic, etc.
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    {/* AI Generated Banner */}
                    {resolvedArticle.tags?.includes('ai-generated') && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                        <p className="text-sm text-blue-800 italic flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          Article generated from {resolvedArticle.excerpt?.replace('Article generated from ', '') || 'AI'}
                        </p>
                      </div>
                    )}
                    {resolvedArticle.excerpt && !resolvedArticle.tags?.includes('ai-generated') && (
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-r-lg">
                        <p className="text-sm text-blue-900 italic">{resolvedArticle.excerpt}</p>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {renderContent(resolvedArticle.content)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Article Meta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Article Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Author</p>
                      <p className="font-medium">{resolvedArticle.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{resolvedArticle.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium">{resolvedArticle.updatedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium">{resolvedArticle.category}</p>
                    </div>
                  </div>
                  {(() => {
                    const projectId = categoryProjectMap[resolvedArticle.categoryId];
                    const project = projectId ? mockProjects.find(p => p.id === projectId) : null;
                    return project ? (
                      <div className="flex items-center gap-3 text-sm">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Project</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <p className="font-medium">{project.name}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TagIcon className="h-4 w-4 text-blue-600" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          className="text-sm"
                        />
                        <Button onClick={handleAddTag} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {resolvedArticle.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resolvedArticle.tags.length === 0 && (
                        <p className="text-sm text-gray-500">No tags</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete Article
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resolvedArticle.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Article
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {successDialogStatus === 'published' ? 'Article Published!' : 'Draft Saved'}
            </DialogTitle>
            <DialogDescription>
              {successDialogStatus === 'published' 
                ? `"${editData.title}" has been published successfully.` 
                : `Your changes to "${editData.title}" have been saved as a draft.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button onClick={() => setShowSuccessDialog(false)} className="bg-blue-600 hover:bg-blue-700">
              Continue Editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Selection Dialog */}
      <Dialog open={showProjectSelectDialog} onOpenChange={setShowProjectSelectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
            <DialogDescription>
              Please select a project to save this article to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userProjects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects available. Please create a project first.</p>
            ) : (
              <div className="space-y-2">
                {userProjects.map((project) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowProjectSelectDialog(false);
                      handleSave(pendingStatus, project.id);
                    }}
                  >
                    <FolderKanban className="h-4 w-4 mr-2" />
                    {project.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowProjectSelectDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}