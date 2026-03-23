# Superadmin Platform

The superadmin portal provides platform-wide management, company impersonation, AI pricing, and live visitor tracking.

## Login Flow

1. Superadmin logs in → redirected to `/superadmin/select-view`
2. **Select View page** offers:
   - **Superadmin Dashboard** → platform management with tabs
   - **Login as User** → browse companies → pick user → impersonate

## Platform Management (`/superadmin/dashboard`)

Standalone page (no sidebar) with tab navigation:

| Tab | Content |
|-----|---------|
| **Overview** | Stats (revenue, users, agents, uptime), latest sign-ups (real data), live visitors, revenue/growth charts |
| **All Companies** | Company table with inline detail view, "Login as" button per company |
| **Activity** | Platform activity feed (placeholder) |
| **Analytics** | Cross-company analytics (placeholder) |
| **Pricing & Plans** | AI model pricing with markup/fixed pricing + usage dashboard |
| **Transactions** | Transaction history (placeholder) |
| **Platform Settings** | Global config (placeholder) |

## Impersonation

- `POST /superadmin/impersonate/{userId}` creates scoped token (8h expiry)
- Superadmin token saved in localStorage for return
- Audit logged: superadmin, target user, IP, user agent
- Available from: Select View, Company detail "Login as" button

## AI Pricing System

### Configuration (platform_settings table)
Per-model pricing stored as JSON under key `ai_pricing`:
- **Pricing mode**: Markup % or Fixed price per chat
- **Markup %**: Applied on top of OpenAI base cost (default: 200%)
- **Fixed price**: Flat rate per conversation
- Base costs: GPT-4o ($2.50/$10.00 per 1M tokens), GPT-4o-mini ($0.15/$0.60 per 1M tokens)

### Cost Tracking (ai_usage_logs table)
Every AI API call logs: project_id, chat_id, model, input_tokens, output_tokens, base_cost, charged_cost.

### Usage Dashboard
- Total API calls, base cost, revenue, profit (last 30 days)
- Breakdown by model and by project (top 10)

## Live Visitor Tracking

- `GET /superadmin/live-visitors` returns visitors active in last 2 minutes
- Per visitor: customer name, current page, referral source, browser, device, project, page count
- Expandable page navigation history with timestamps
- Polls every 30s in the Overview tab

## Key Files

- `frontend/src/app/pages/dashboards/SuperadminPlatform.tsx` — Platform page + Pricing tab
- `frontend/src/app/pages/dashboards/SuperadminSelectView.tsx` — Login selector
- `frontend/src/app/components/superadmin/OverviewSection.tsx` — Overview with live visitors
- `backend/app/Http/Controllers/Api/SuperadminController.php` — Companies, agents, impersonate, live visitors
- `backend/app/Http/Controllers/Api/PlatformSettingsController.php` — Pricing CRUD + usage stats
- `backend/app/Models/PlatformSetting.php` — Key-value settings model
- `backend/app/Models/AiUsageLog.php` — Usage tracking model
