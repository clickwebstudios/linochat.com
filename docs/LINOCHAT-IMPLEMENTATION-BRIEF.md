# LinoChat — Twilio + Token System Implementation Brief

## Context for Claude Code

This document captures all strategic and technical decisions made during planning sessions for LinoChat's omnichannel messaging integration. Use this as the single source of truth when implementing.

---

## Implementation Status

**Phase 1 — Core Infrastructure** ✓ Implemented (2026-04-04)

The following was built and merged as Task 15 of the Twilio + Token + Stripe implementation:

**Backend:**
- `TokenActionType` enum — 10 action types with token costs
- `TokenTransaction` and `TokenPurchase` models + migrations
- `TokenService` — deduct, credit, completeTopUp, runMonthlyCycleReset, topUpPacks, canAfford
- `TwilioService` — createSubaccount, suspendSubaccount, closeSubaccount, getSubaccountClient, validateWebhookSignature
- `StripeService` — createCustomer, createCheckoutSession, createPortalSession, cancelSubscription, constructWebhookEvent
- `TwilioMessageService` — send() for outbound non-web messages with token deduction
- `CreateTwilioSubaccountJob` — queued, 3 retries
- `TokenMonthlyCycleCommand` (`tokens:monthly-cycle`) — Artisan scheduler command
- `BillingController` — Stripe checkout / portal / cancel / topup
- `TwilioWebhookController` — handles Twilio Conversations events
- `StripeWebhookController` — handles 6 Stripe events
- `MessengerController` — status / connect / disconnect
- `WhatsAppController` — sandboxStatus / sandboxConnect

**Migrations:**
- `add_twilio_token_fields_to_companies_table`
- `create_token_transactions_table`
- `create_token_purchases_table`
- `add_channel_to_chats_table`
- `add_stripe_subscription_id_to_subscriptions_table`

**Frontend:**
- `channelService.ts` — new service for channel integrations
- `billing.ts` — updated with Stripe checkout / portal / topup
- `BillingPage.tsx` — updated UI
- `IntegrationsView.tsx` — Messenger + WhatsApp sections

**Routes added:** `/billing/*`, `/integrations/messenger/*`, `/integrations/whatsapp/sandbox/*`, `/webhooks/twilio/{subaccount_sid}`, `/webhooks/stripe`

Phases 2–4 (channel activation, AI monetization, optimization) remain to be implemented.

---

## What is LinoChat?

LinoChat is a live chat SaaS platform — the "anti-Intercom." Core value proposition: transparent, flat pricing with AI included. No per-resolution fees, no surprise invoices.

- **Website:** linochat.com
- **Target customers:** e-commerce SMBs (Shopify/WooCommerce), SaaS startups, service businesses
- **Core features:** AI-powered live chat, smart ticketing, unified inbox, customer support tools

---

## Integration Decision: Twilio

We chose **Twilio Conversations API** as the single integration layer for:
- **Facebook Messenger** (Meta charges nothing — only Twilio platform fee)
- **WhatsApp** (Meta per-message fees + Twilio platform fee)
- **SMS** (future — same API)

### Why Twilio
- One API covers all channels — simplifies codebase
- Built-in multi-tenant support via **subaccounts**
- Pay-as-you-go with no fixed subscription for Conversations API
- Well-documented ISV/SaaS architecture patterns
- WhatsApp Tech Provider program with Embedded Signup flow

### Twilio Cost Structure
- **Twilio platform fee:** $0.005 per message sent AND per message received
- **Conversations API:** $0.05 per monthly active user (MAU)
- **WhatsApp Meta fees (on top of Twilio):**
  - Service messages (customer-initiated, within 24hr window): **FREE from Meta**
  - Utility templates (order confirmations, shipping): ~$0.05/msg (varies by country)
  - Marketing templates (promos, newsletters): ~$0.11–0.22/msg (varies by country)
  - Authentication templates (OTPs): ~$0.04/msg
- **Messenger Meta fees:** None — completely free from Meta's side
- **Free entry points:** Messages from Click-to-WhatsApp ads are free for 72 hours

---

## Multi-Tenant Architecture (Twilio Subaccounts)

### Structure
```
LinoChat Parent Account (Prod)
├── Subaccount: Customer A (own SID, auth token, phone numbers)
├── Subaccount: Customer B
├── Subaccount: Customer C
└── ... (one per LinoChat customer)

LinoChat Parent Account (Dev/Staging)
├── Subaccount: Test environment
└── Subaccount: Staging environment
```

### Key Rules
- **1 subaccount = 1 LinoChat customer** — complete tenant isolation
- **1 subaccount = 1 WhatsApp Business Account (WABA)** — Twilio requirement
- Parent account is a shell — no sending occurs from it
- All subaccount usage bills to LinoChat's single parent account invoice
- Subaccounts are created/managed programmatically via Twilio Accounts API

### Subaccount Lifecycle
1. **Customer signs up on LinoChat** → backend creates Twilio subaccount via POST to Accounts API
2. **Customer activates WhatsApp** → trigger Embedded Signup flow, create WABA, register sender via Senders API using subaccount credentials
3. **Customer activates Messenger** → connect Facebook Page via subaccount
4. **Customer downgrades/churns** → suspend or close subaccount via API
5. **Non-payment** → suspend subaccount (disables messaging, no further charges)

### Webhook Routing
- Each subaccount has its own webhook callback URL
- Recommended pattern: `https://api.linochat.com/webhooks/twilio/{subaccount_sid}`
- Incoming messages hit webhook → LinoChat routes to correct customer's inbox
- Status callbacks (delivered, read, failed) follow same pattern

### Usage Tracking
- Twilio Usage API provides per-subaccount billing data
- Use this to deduct tokens from each customer's balance
- Poll usage periodically OR use status callbacks for real-time token deduction

---

## Token System

### Core Concept
Every LinoChat plan includes a monthly pool of **tokens**. Tokens are consumed when the platform performs work: sending messages via Twilio, generating AI replies, processing AI resolutions. This gives customers one simple number instead of multiple confusing meters.

### Token Conversion Rate
**1 token = $0.01 of underlying cost to LinoChat**

### Token Costs Per Action

| Action | LinoChat's Real Cost | Tokens Charged | Margin |
|--------|---------------------|----------------|--------|
| WhatsApp message (customer-initiated, service) | $0.005 (Twilio only) | 1 token | 50% |
| WhatsApp message (business-initiated, utility) | ~$0.055 (Meta + Twilio) | 8 tokens | ~45% |
| WhatsApp message (marketing template) | ~$0.13 (Meta + Twilio) | 18 tokens | ~38% |
| Messenger message (any direction) | $0.005 (Twilio only) | 1 token | 50% |
| AI auto-reply (single response) | ~$0.004–0.008 (LLM API) | 1 token | ~25–60% |
| AI resolution (full conversation) | ~$0.02–0.05 (multi-turn LLM) | 5 tokens | ~50%+ |
| Live chat (web widget, no AI) | ~$0 (own infra) | 0 tokens | ∞ |

**Important:** Web widget live chat is always free (0 tokens, unlimited). This keeps the free tier genuinely useful.

### Tier Structure with Token Allowances

| Tier | Price | Monthly Tokens | Seats | Key Features |
|------|-------|---------------|-------|-------------|
| Free | $0/mo | 100 | 1 | Web chat only, basic AI, LinoChat branding |
| Starter | $19/mo | 1,000 | 2 | + Messenger, basic AI auto-replies |
| Growth (flagship) | $49/mo | 5,000 | 5 | + WhatsApp, full AI agent, chatbot builder, analytics |
| Scale | $149/mo | 20,000 | Unlimited | All channels, advanced AI, CRM integrations, custom branding |

### Top-Up Token Packs

| Pack | Tokens | Price | Per Token | Discount |
|------|--------|-------|-----------|----------|
| Starter Pack | 500 | $7 | $0.014 | — |
| Growth Pack | 2,000 | $24 | $0.012 | 14% off |
| Power Pack | 5,000 | $50 | $0.010 | 29% off |
| Scale Pack | 15,000 | $120 | $0.008 | 43% off |

### Token Policies
- **Rollover:** Unused included tokens roll over for 1 billing cycle, then expire
- **Purchased tokens:** Never expire once bought
- **Soft cap:** 3× monthly allowance in a single month triggers upgrade suggestion (no hard cutoff)
- **Zero balance behavior:** AI auto-replies pause, but live chat and human agent conversations continue. Dashboard shows top-up banner.
- **Auto top-up:** Allow customers to set an auto-recharge threshold (optional feature)

### Upsell Logic
- Customer on Growth buying 2+ top-ups/month = spending ~$97+/mo → show upgrade nudge to Scale ($149)
- Dashboard should surface: "You'd save $XX/mo on the Scale plan"

---

## Database Schema Considerations

### Tenants / Customers Table
- `twilio_subaccount_sid` — the Twilio subaccount SID for this customer
- `twilio_auth_token` — encrypted auth token for the subaccount
- `whatsapp_waba_id` — their WhatsApp Business Account ID (if activated)
- `messenger_page_id` — their connected Facebook Page ID (if activated)
- `token_balance` — current token balance (integer)
- `monthly_token_allowance` — based on their plan tier
- `tokens_used_this_cycle` — for soft cap enforcement
- `token_rollover` — carried over from previous month

### Token Transactions Table
- `tenant_id`
- `action_type` — enum: whatsapp_service, whatsapp_utility, whatsapp_marketing, messenger, ai_reply, ai_resolution, topup, monthly_grant, rollover, expiry
- `tokens_amount` — positive for grants/purchases, negative for usage
- `twilio_message_sid` — for reconciliation with Twilio usage data
- `created_at`

### Token Packs / Purchases Table
- `tenant_id`
- `pack_type` — enum matching the pack tiers
- `tokens_purchased`
- `amount_paid`
- `payment_provider_ref`
- `created_at`

---

## Implementation Priority

### Phase 1 — Core Infrastructure
1. Twilio parent account setup (prod + dev)
2. Subaccount creation/management API integration
3. Webhook endpoint for receiving messages
4. Token balance system (grant, deduct, track)
5. Web chat widget (0 tokens, always works)

### Phase 2 — Channel Activation
1. Facebook Messenger integration via Twilio subaccounts
2. WhatsApp integration with Embedded Signup flow
3. Token deduction on message send/receive
4. Usage dashboard showing token balance + history

### Phase 3 — AI + Monetization
1. AI auto-reply engine (LLM integration)
2. AI resolution tracking (multi-turn conversation = 1 resolution)
3. Top-up token purchase flow (payment integration)
4. Auto top-up feature
5. Upgrade nudge logic

### Phase 4 — Optimization
1. Twilio Usage API reconciliation (verify token deductions match actual Twilio billing)
2. Multi-tenancy throughput management (Even/Weighted distribution)
3. Compliance monitoring per subaccount
4. Analytics: cost-per-resolution, token burn rate, margin per customer

---

## Important Constraints

- **No free trial** — LinoChat doesn't offer free trials. CTAs use "Get started," "See it in action," or "Book a demo"
- **Growth tier is the flagship** — always position as "Most Popular"
- **Flat pricing is the brand** — tokens are an "allowance within a flat plan," NOT "usage-based billing"
- **Customer-facing naming:** Consider calling tokens "credits" or "message credits" instead of "tokens" — friendlier for non-technical users
- **Dashboard UX:** Token balance should be a calm progress bar, not a ticking counter

---

## Reference Files
- `linochat-token-pricing-framework.html` — Visual pricing framework document (internal strategy)
- `LinoChat-Market-Analysis-2026.html` — Full competitive analysis report

---

*Generated April 2026 from LinoChat planning sessions.*
