# LinoChat — Additional Channels Implementation Brief

## Context

This document extends the main `LINOCHAT-IMPLEMENTATION-BRIEF.md` with integration specs for four additional channels: **Instagram DMs**, **Telegram**, **Email**, and notes on **Google Business Messages** (deprecated). Read the main brief first for context on LinoChat's architecture, Twilio subaccounts, and the token system.

---

## Channel Overview

| Channel | Integration Method | Per-Message Cost to LinoChat | Tokens Charged | Multi-Tenant Approach |
|---------|-------------------|------------------------------|----------------|-----------------------|
| Instagram DMs | Meta Graph API (direct) | $0 (Meta free) | 0 tokens | Per-customer Facebook App or Page-scoped tokens |
| Telegram | Telegram Bot API (direct) | $0 (Telegram free) | 0 tokens | Per-customer bot via BotFather |
| Email | IMAP/SMTP or SendGrid API | ~$0.001 or less | 0 tokens | Per-customer forwarding rules |
| Google Business Messages | ❌ DEPRECATED | N/A | N/A | N/A |

**Key decision:** Instagram, Telegram, and Email are integrated **directly** (not via Twilio) because Twilio doesn't natively support these channels in the Conversations API, and all three are free from the platform side — making direct integration more cost-effective.

**Token impact:** All three channels cost 0 tokens for basic messaging. AI auto-replies triggered on these channels still cost tokens (1 token per AI reply, 5 tokens per AI resolution) — same as any other channel.

---

## ⚠️ Google Business Messages — DO NOT IMPLEMENT

Google Business Messages (GBM) was **permanently discontinued on July 31, 2024**. Google shut down the API, removed chat buttons from Google Maps and Search, and closed all existing conversations. There is no replacement API from Google for direct messaging from Search/Maps results.

**What to do instead:** Customers who want Google-originating conversations should use Click-to-WhatsApp from their Google Business Profile (Google now supports linking WhatsApp to Business Profiles in some regions). This routes back through our existing WhatsApp/Twilio integration.

---

## 1. Instagram DMs Integration

### Overview
Instagram Messaging uses the same **Meta Graph API** as Facebook Messenger. Since LinoChat already integrates Messenger, much of the auth and webhook infrastructure can be reused. Instagram DMs appear in the same unified inbox as all other channels.

### Prerequisites per LinoChat Customer
- An **Instagram Professional Account** (Business or Creator) — cannot be a personal account
- The Instagram account must be **connected to a Facebook Page** (Meta requirement for API access, though since July 2024, a linked Page is no longer required for some features)
- A **Meta App** with Instagram Messaging product enabled
- The customer must grant LinoChat the `instagram_manage_messages` permission via OAuth

### API Architecture

```
Customer's Instagram Account
  ↓ (user messages the business)
Meta sends webhook POST to:
  https://api.linochat.com/webhooks/instagram/{tenant_id}
  ↓
LinoChat backend:
  1. Identifies tenant from URL path
  2. Parses incoming message (text, image, story reply, etc.)
  3. Routes to unified inbox
  4. If AI auto-reply enabled → trigger AI → respond via Graph API
  5. If human agent → agent replies from inbox → Send API call
  ↓
Response sent via:
  POST https://graph.facebook.com/v19.0/me/messages
  Authorization: Bearer {page_access_token}
  Body: { recipient: { id: "{ig_scoped_user_id}" }, message: { text: "..." } }
```

### Webhook Setup
- **Webhook URL pattern:** `https://api.linochat.com/webhooks/instagram/{tenant_id}`
- **Subscribed fields:** `messages`, `messaging_postbacks`, `message_reactions`
- **Verify token:** LinoChat generates a unique verify token per tenant, stored in the tenants table
- Webhook verification uses the same challenge/response pattern as Messenger

### Key Technical Details
- **Message types supported:** Text, images, story replies, story mentions, quick replies, generic templates
- **24-hour messaging window:** Same as Messenger — businesses can only respond within 24 hours of the customer's last message. Outside this window, only "human agent" tagged messages are allowed (with approval)
- **Rate limits:** 200 API calls per user per hour (per Meta docs)
- **User identity:** Users are identified by an Instagram-Scoped User ID (IGSID), unique per Instagram account + business pair

### Multi-Tenant Handling
Unlike Twilio (which uses subaccounts), Instagram multi-tenancy is handled via:
1. Each LinoChat customer connects their own Instagram account via OAuth during onboarding
2. LinoChat stores the **Page Access Token** (long-lived, refreshed periodically) per tenant
3. Webhook routing uses the tenant_id in the URL path
4. All API calls use the tenant-specific access token

### Database Schema Additions
Add to the **Tenants table:**
```
instagram_account_id     — their Instagram Business Account ID
instagram_page_token     — encrypted long-lived page access token
instagram_webhook_verify — unique verify token for webhook setup
instagram_connected_at   — timestamp of connection
```

Add to the **Messages table:**
```
channel enum: add 'instagram' to existing values (web_chat, whatsapp, messenger, telegram, email)
```

### Onboarding Flow
1. Customer clicks "Connect Instagram" in LinoChat dashboard
2. OAuth flow redirects to Meta Login Dialog requesting `instagram_manage_messages`, `pages_messaging` permissions
3. Customer selects their Instagram account and linked Facebook Page
4. LinoChat stores the access token, subscribes webhook, and creates the channel in the inbox
5. Test message sent to confirm connection

### Implementation Priority: **HIGH**
Instagram is the #1 missing channel for e-commerce SMBs. Ship alongside or immediately after Messenger in Phase 2.

---

## 2. Telegram Integration

### Overview
Telegram provides a free, well-documented **Bot API** with webhook support. Each LinoChat customer gets their own Telegram bot that their end-customers message. The Bot API has zero per-message fees, making this an extremely cost-effective channel.

### Prerequisites per LinoChat Customer
- A **Telegram Bot** created via @BotFather (LinoChat can automate this or guide the customer)
- The bot token provided by BotFather
- The customer sets the bot as their support contact / links it on their website

### API Architecture

```
End-customer messages the Telegram bot
  ↓
Telegram sends webhook POST to:
  https://api.linochat.com/webhooks/telegram/{tenant_id}
  ↓
LinoChat backend:
  1. Validates request via secret_token header (X-Telegram-Bot-Api-Secret-Token)
  2. Parses Update object → extracts message, chat_id, user info
  3. Routes to unified inbox for this tenant
  4. If AI auto-reply enabled → trigger AI → respond via Bot API
  5. If human agent → agent replies → sendMessage API call
  ↓
Response sent via:
  POST https://api.telegram.org/bot{bot_token}/sendMessage
  Body: { chat_id: "{chat_id}", text: "...", parse_mode: "HTML" }
```

### Webhook Setup
```bash
# Set webhook for a customer's bot
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -d "url=https://api.linochat.com/webhooks/telegram/{tenant_id}" \
  -d "secret_token={generated_secret}" \
  -d "allowed_updates=[\"message\",\"callback_query\",\"edited_message\"]" \
  -d "max_connections=40"
```

### Key Technical Details
- **Message types supported:** Text, photos, documents, voice messages, video, stickers, location, contact, callback queries (inline buttons)
- **No messaging window restrictions** — unlike WhatsApp/Instagram, bots can message users anytime after the user starts a conversation
- **Rate limits:** 30 messages/second to the same chat, 20 messages/minute to the same group. No global rate limit for different chats.
- **Webhook requirements:** HTTPS with valid SSL certificate (Let's Encrypt works), ports 443, 80, 88, or 8443
- **File size limits:** Bots can send files up to 50MB, receive files up to 20MB
- **Rich features:** Inline keyboards, reply keyboards, HTML/Markdown formatting, media groups
- **Bot API is free** — no platform fees, no per-message costs, no subscription

### Multi-Tenant Handling
1. Each LinoChat customer either creates their own bot via @BotFather or LinoChat provides a guided flow
2. Customer enters their bot token in the LinoChat dashboard
3. LinoChat calls `setWebhook` on the bot, pointing to LinoChat's webhook endpoint with the tenant_id
4. LinoChat stores the bot token (encrypted) and uses it for all outbound messages for that tenant
5. Each bot is completely independent — full tenant isolation by design

### Database Schema Additions
Add to the **Tenants table:**
```
telegram_bot_token       — encrypted bot token from BotFather
telegram_bot_username    — the @username of the bot
telegram_webhook_secret  — secret token for webhook validation
telegram_connected_at    — timestamp of connection
```

### Security Considerations
- **Validate every webhook request** using the `secret_token` header — never trust unvalidated requests
- **Encrypt bot tokens at rest** — a compromised token gives full control of the bot
- **Bot tokens cannot be rotated without BotFather** — if compromised, customer must revoke via BotFather and reconnect

### Onboarding Flow
1. Customer clicks "Connect Telegram" in LinoChat dashboard
2. LinoChat shows instructions: "Open Telegram → message @BotFather → /newbot → copy the token"
3. Customer pastes bot token into LinoChat
4. LinoChat validates the token (calls `getMe`), sets the webhook, and confirms connection
5. Customer shares the bot link (t.me/BotUsername) on their website or support pages

### Implementation Priority: **MEDIUM**
Strong differentiator, especially for international customers. Ship in Phase 3 after core channels are stable.

---

## 3. Email Integration

### Overview
Email is table-stakes for any customer support platform. LinoChat will support email as a channel in the unified inbox, converting incoming emails into conversations and allowing agents to reply from the same interface they use for chat, WhatsApp, and Messenger.

### Architecture Options

**Option A: Email Forwarding + SendGrid Inbound Parse (Recommended)**
- Customer sets up email forwarding from their support address (support@theirdomain.com) to a LinoChat-provided address (tenant123@inbound.linochat.com)
- SendGrid Inbound Parse webhook receives the email and POSTs it to LinoChat's backend
- Outbound replies are sent via SendGrid API (or SMTP) with the customer's domain as the sender (requires DNS verification)

**Option B: Direct IMAP/SMTP Connection**
- Customer provides IMAP credentials; LinoChat polls for new emails
- Outbound replies sent via customer's SMTP server
- Downside: polling introduces latency, credential storage is more sensitive, OAuth support varies by provider

**Option C: Custom Domain with LinoChat MX Records**
- Customer points MX records for their support subdomain (e.g., support.theirdomain.com) to LinoChat
- LinoChat fully manages inbound email delivery
- Most seamless but requires DNS changes from the customer

**Recommended: Option A** for initial launch — simplest to implement, SendGrid (owned by Twilio) integrates well, and forwarding is easy for customers to set up. Option C can be added later as a premium feature.

### API Architecture (Option A)

```
Customer's email (support@theirdomain.com)
  → Forwarding rule to: tenant123@inbound.linochat.com
  ↓
SendGrid Inbound Parse receives email
  → POST webhook to: https://api.linochat.com/webhooks/email/{tenant_id}
  → Payload includes: from, to, subject, body (text + HTML), attachments
  ↓
LinoChat backend:
  1. Identifies tenant from the inbound address or URL path
  2. Checks if sender already has an open conversation → thread into it
  3. If new sender → create new conversation in inbox
  4. Parse email body, strip signatures/quoted text for clean display
  5. If AI auto-reply enabled → generate response → send via SendGrid API
  6. If human agent → agent replies in inbox → send via SendGrid API
  ↓
Outbound email sent via:
  SendGrid API v3 — POST /v3/mail/send
  From: "Customer's Brand" <support@theirdomain.com>  (requires domain verification)
  Reply-To: tenant-specific inbound address (for threading)
```

### Key Technical Details
- **Email threading:** Use `In-Reply-To` and `References` headers to maintain conversation threads. Also match by sender email + subject line as a fallback.
- **Signature stripping:** Use a library like `email-reply-parser` to strip quoted text and signatures from replies for clean inbox display
- **Attachments:** Store in cloud storage (S3/GCS), link in the conversation. Set size limit (e.g., 25MB per email, matching Gmail limits)
- **HTML rendering:** Display HTML emails in a sandboxed iframe or render a text-only version in the inbox
- **Spam filtering:** Rely on the customer's email provider for spam filtering (since they're forwarding, spam is already filtered). Additionally, implement basic checks (SPF/DKIM validation on inbound)
- **SendGrid Inbound Parse:** Free on all SendGrid plans, no per-email cost. Outbound sending costs ~$0.001/email at scale.

### Multi-Tenant Handling
1. Each LinoChat customer gets a unique inbound address: `{tenant_slug}@inbound.linochat.com`
2. Customer sets up forwarding from their support email to this address
3. Outbound emails use the customer's domain as the `From` address (verified via SendGrid domain authentication — customer adds CNAME records)
4. All email data is isolated by tenant_id in the database

### Database Schema Additions
Add to the **Tenants table:**
```
email_inbound_address    — generated unique inbound address (e.g., tenant123@inbound.linochat.com)
email_from_address       — customer's support email (e.g., support@theirdomain.com)
email_from_name          — display name for outbound emails (e.g., "Acme Support")
email_domain_verified    — boolean, whether SendGrid domain auth is complete
email_connected_at       — timestamp of connection
```

Add a **Email Threads table** (for proper threading):
```
thread_id                — internal conversation ID
tenant_id
email_message_id         — the Message-ID header from the original email
email_in_reply_to        — In-Reply-To header value
email_references         — References header values (array)
subject
from_address
to_address
created_at
```

### Onboarding Flow
1. Customer clicks "Connect Email" in LinoChat dashboard
2. LinoChat generates a unique inbound address and displays it
3. Customer sets up forwarding in their email provider (Gmail, Outlook, etc.) — LinoChat shows provider-specific instructions
4. Customer verifies their sending domain by adding CNAME records (LinoChat provides the values)
5. LinoChat sends a test email to confirm the forwarding is working
6. Channel is live in the unified inbox

### Implementation Priority: **HIGH**
Email is expected by every customer segment. Ship in Phase 2 alongside Instagram.

---

## Implementation Phases (Updated)

### Phase 2 — Channel Activation (Updated)
1. Facebook Messenger integration via Twilio subaccounts
2. WhatsApp integration with Embedded Signup flow
3. **Instagram DMs** integration via Meta Graph API ← NEW
4. **Email** integration via SendGrid Inbound Parse ← NEW
5. Token deduction on message send/receive (WhatsApp/Messenger only — Instagram, Telegram, Email are 0 tokens)
6. Usage dashboard showing token balance + history

### Phase 3 — AI + Monetization + Telegram
1. AI auto-reply engine (LLM integration)
2. AI resolution tracking (multi-turn conversation = 1 resolution)
3. **Telegram** integration via Bot API ← NEW
4. Top-up token purchase flow (payment integration)
5. Auto top-up feature
6. Upgrade nudge logic

---

## Unified Inbox Requirements

All channels must flow into a single inbox interface. Each conversation must display:
- **Channel badge** — icon/label showing which channel (web chat, WhatsApp, Messenger, Instagram, Telegram, email)
- **Customer identity** — name, avatar (when available), email address, phone number — merged across channels when possible
- **Conversation history** — full thread regardless of channel, with channel-switching noted
- **Agent assignment** — same assignment and routing rules apply across all channels
- **AI toggle** — per-conversation ability to enable/disable AI auto-replies

### Channel-Specific UI Considerations
- **Instagram:** Show story replies and mentions with the original story content (image/video)
- **Telegram:** Support inline keyboard button rendering in the inbox
- **Email:** Show subject line, render HTML safely, display attachments as downloadable links
- **WhatsApp:** Show template message type labels (service/utility/marketing)

---

## Webhook Security Checklist

All webhook endpoints must implement:
1. **Signature/token validation** — verify the request is from the claimed platform
   - Meta (Instagram/Messenger): Validate `X-Hub-Signature-256` header using app secret
   - Telegram: Validate `X-Telegram-Bot-Api-Secret-Token` header
   - Twilio: Validate request signature using auth token
   - SendGrid: Validate using signed event webhook (or IP allowlisting)
2. **Idempotency** — handle duplicate webhook deliveries (store and check message IDs)
3. **Quick response** — return 200 OK immediately, process asynchronously (queue the message for processing)
4. **Rate limiting** — protect against webhook floods
5. **Logging** — log all incoming webhooks for debugging (redact sensitive content)

---

## Environment Variables Required

```
# Twilio (existing)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Meta (Messenger + Instagram — shared app)
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=

# Telegram (no global keys — per-tenant bot tokens only)
# Bot tokens are stored per-tenant in the database

# SendGrid (Email)
SENDGRID_API_KEY=
SENDGRID_INBOUND_DOMAIN=inbound.linochat.com

# General
WEBHOOK_BASE_URL=https://api.linochat.com
ENCRYPTION_KEY=  # for encrypting stored tokens/credentials
```

---

## Reference Documents
- `LINOCHAT-IMPLEMENTATION-BRIEF.md` — Main brief with Twilio architecture, token system, pricing tiers
- `linochat-token-pricing-framework.html` — Visual pricing framework (internal strategy)
- `LinoChat-Market-Analysis-2026.html` — Full competitive analysis report

---

*Generated April 2026 from LinoChat planning sessions.*
