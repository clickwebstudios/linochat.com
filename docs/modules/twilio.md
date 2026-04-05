# Twilio Module

Covers multi-tenant Twilio subaccount management, channel activation (Messenger + WhatsApp), webhook routing, and token deduction on message events.

---

## Multi-Tenant Subaccount Architecture

LinoChat operates a single Twilio parent account. Every LinoChat company (tenant) gets its own **Twilio subaccount** — a fully isolated child account with its own SID, auth token, and phone numbers.

```
LinoChat Parent Account
├── Subaccount: Company A  (SID: ACxxx, own auth token, own numbers)
├── Subaccount: Company B
└── Subaccount: Company N  (one per tenant)
```

**Key properties:**
- Complete tenant isolation — no cross-company message leakage
- One subaccount = one WhatsApp Business Account (WABA) — Twilio requirement
- All usage bills to LinoChat's single parent account invoice
- The parent account is a management shell — no customer traffic flows through it

**Database fields** (on `companies` table):
- `twilio_subaccount_sid` — the subaccount's Account SID
- `twilio_auth_token` — encrypted auth token for the subaccount

---

## Subaccount Lifecycle

### 1. Creation

When a new company is created on LinoChat, a queued job provisions their Twilio subaccount:

- **Job**: `App\Jobs\CreateTwilioSubaccountJob`
- Dispatched automatically after company registration
- 3 retry attempts with exponential backoff
- Calls `TwilioService::createSubaccount($company)` which POSTs to the Twilio Accounts API
- On success: saves `twilio_subaccount_sid` and encrypted `twilio_auth_token` on the company record

### 2. Active Use

Once provisioned, all API calls for that company use `TwilioService::getSubaccountClient($company)` which returns a Twilio REST client authenticated with the subaccount credentials.

### 3. Suspension (non-payment / downgrade)

`TwilioService::suspendSubaccount($company)` — disables the subaccount. Messaging stops, no further Twilio charges accumulate. The subaccount and its data are preserved.

### 4. Closure (churn / account deletion)

`TwilioService::closeSubaccount($company)` — permanently closes the subaccount and releases all associated resources (numbers, conversations, etc.). This is irreversible.

---

## Webhook Routing

Each subaccount's Conversations Service is configured with a webhook callback URL that includes the subaccount SID:

```
POST https://api.linochat.com/api/webhooks/twilio/{subaccount_sid}
```

**Route**: Public (no Sanctum auth), verified by Twilio signature.

**Flow:**
1. Twilio sends a POST to the route with the `subaccount_sid` path parameter
2. `TwilioWebhookController` looks up the company by `twilio_subaccount_sid`
3. Validates the webhook signature using `TwilioService::validateWebhookSignature()`
4. Routes the event to the appropriate handler (inbound message, status callback, etc.)
5. Creates or updates the corresponding `Chat` and `ChatMessage` records
6. Deducts tokens from the company's balance via `TokenService`

**Supported event types:**
- `onMessageAdded` — inbound message from customer
- `onConversationAdded` — new conversation started
- Status callbacks: `delivered`, `read`, `failed`

---

## Messenger Activation Flow

1. Admin navigates to Integrations > Messenger in the dashboard
2. Frontend calls `GET /integrations/messenger/status` — returns whether a Page is connected
3. Admin initiates Facebook OAuth (handled externally), then calls `POST /integrations/messenger/connect` with their `page_id`
4. Backend calls `TwilioService::getSubaccountClient()` and configures the Messenger channel on the subaccount's Conversations Service
5. `companies.messenger_page_id` is saved
6. Inbound Messenger messages now arrive via the Twilio webhook and are routed to the company's inbox

To disconnect: `DELETE /integrations/messenger/disconnect` — removes the Page binding and clears `messenger_page_id`.

**Controller**: `App\Http\Controllers\Api\MessengerController`  
**Methods**: `status`, `connect`, `disconnect`

---

## WhatsApp Sandbox Setup

The WhatsApp Sandbox allows testing before a full WABA is approved.

1. Admin calls `GET /integrations/whatsapp/sandbox/status` — returns sandbox activation state
2. Admin calls `POST /integrations/whatsapp/sandbox/connect` — enables Twilio's shared WhatsApp Sandbox on the company's subaccount
3. Test messages can be sent/received through Twilio's sandbox number
4. Production WhatsApp requires Embedded Signup (WABA registration via Meta), which sets `companies.whatsapp_waba_id`

**Controller**: `App\Http\Controllers\Api\WhatsAppController`  
**Methods**: `sandboxStatus`, `sandboxConnect`

---

## Token Deduction on Messages

Every inbound or outbound non-web message triggers a token deduction. The webhook controller calls `TokenService::deduct($company, $actionType)` after persisting the message.

| Channel / Action | `TokenActionType` | Tokens |
|-----------------|-------------------|--------|
| Messenger (any direction) | `messenger` | 1 |
| WhatsApp service (customer-initiated, within 24hr) | `whatsapp_service` | 1 |
| WhatsApp utility template (business-initiated) | `whatsapp_utility` | 8 |
| WhatsApp marketing template | `whatsapp_marketing` | 18 |

If the company has zero token balance, the message is still delivered (Twilio has already accepted it) but a low-balance flag is set and the dashboard shows a top-up banner.

**Outbound messages** are sent via `TwilioMessageService::send($company, $conversation_sid, $body, $actionType)` which deducts tokens before dispatching to Twilio.

---

## Key Files

| File | Purpose |
|------|---------|
| `app/Services/TwilioService.php` | Subaccount CRUD, webhook signature validation, subaccount client factory |
| `app/Services/TwilioMessageService.php` | Outbound message sending with token deduction |
| `app/Http/Controllers/Api/TwilioWebhookController.php` | Receives and routes Twilio Conversations events |
| `app/Http/Controllers/Api/MessengerController.php` | Messenger connect / disconnect / status |
| `app/Http/Controllers/Api/WhatsAppController.php` | WhatsApp Sandbox activation |
| `app/Jobs/CreateTwilioSubaccountJob.php` | Queued job — provisions a new Twilio subaccount |
