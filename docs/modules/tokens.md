# Token System

LinoChat's token system gives customers a single unified meter for platform usage (AI, messaging, channel activity) instead of per-feature billing. Every plan includes a monthly token allowance; customers can top up when needed.

---

## Overview

**1 token = $0.01 of underlying cost to LinoChat.**

Tokens are consumed for:
- Sending or receiving messages via Twilio (Messenger, WhatsApp, SMS)
- AI auto-replies and AI resolutions

**Web widget live chat is always free** — 0 tokens, unlimited. This keeps the Free tier genuinely useful.

Customer-facing language: prefer "credits" or "message credits" over "tokens" in UI copy.

---

## Action Types and Costs

Defined in `App\Enums\TokenActionType`:

| Action | `TokenActionType` value | Tokens | Notes |
|--------|------------------------|--------|-------|
| Messenger message (any direction) | `messenger` | 1 | Twilio platform fee only |
| WhatsApp service message (customer-initiated, within 24hr window) | `whatsapp_service` | 1 | Twilio fee only; Meta charges nothing |
| WhatsApp utility template (business-initiated) | `whatsapp_utility` | 8 | Twilio + Meta fee |
| WhatsApp marketing template | `whatsapp_marketing` | 18 | Twilio + Meta fee |
| AI auto-reply (single response) | `ai_reply` | 1 | LLM API cost |
| AI resolution (full multi-turn conversation) | `ai_resolution` | 5 | LLM API cost |
| Web widget live chat | — | **0** | Always free |

**Credit-only actions** (positive balance changes, no cost):

| Action | `TokenActionType` value | Notes |
|--------|------------------------|-------|
| Monthly plan grant | `monthly_grant` | Credited at each billing cycle reset |
| Rollover | `rollover` | Unused included tokens carried forward one cycle |
| Expiry | `expiry` | Expired rollover tokens removed (negative credit) |
| Top-up purchase | `topup` | Manual or auto-recharge purchase |

---

## Plan Allowances

| Plan | Price | Monthly Tokens | Seats |
|------|-------|----------------|-------|
| Free | $0/mo | 100 | 1 |
| Starter | $19/mo | 1,000 | 2 |
| Growth | $49/mo | 5,000 | 5 |
| Scale | $149/mo | 20,000 | Unlimited |

`companies.monthly_token_allowance` stores the current value; it is updated when the company's plan changes.

---

## Top-Up Packs

Available via `GET /billing/topup-packs`. Purchased via `POST /billing/topup` (Stripe Checkout).

| Pack | `pack_type` | Tokens | Price | Per Token |
|------|------------|--------|-------|-----------|
| Starter Pack | `starter_500` | 500 | $7 | $0.014 |
| Growth Pack | `growth_2000` | 2,000 | $24 | $0.012 |
| Power Pack | `power_5000` | 5,000 | $50 | $0.010 |
| Scale Pack | `scale_15000` | 15,000 | $120 | $0.008 |

Purchased tokens **never expire**. Included monthly tokens roll over for one cycle, then expire.

Defined in `TokenService::topUpPacks()`.

---

## Monthly Cycle Reset Flow

Triggered by the `tokens:monthly-cycle` Artisan command (run via scheduler at the start of each billing period):

1. **Expire old rollover** — any tokens flagged as rollover from the previous cycle are removed (`expiry` transaction, negative amount)
2. **Carry forward unused included tokens** — remaining balance from monthly grant is recorded as `rollover`
3. **Grant new monthly allowance** — `monthly_grant` transaction credits `monthly_token_allowance` tokens
4. **Reset `tokens_used_this_cycle` to 0**
5. **Update `token_cycle_reset_at` to now**

Each step is recorded as an individual `token_transactions` row.

**Artisan command**: `App\Console\Commands\TokenMonthlyCycleCommand` (`tokens:monthly-cycle`)

---

## Zero-Balance Behavior

When `companies.token_balance` reaches 0:

- **AI auto-replies pause** — no new LLM calls are triggered
- **Outbound Twilio messages are blocked** — `TokenService::canAfford()` returns false
- **Live chat (web widget) continues unaffected** — 0 token cost
- **Human agent conversations continue unaffected** — agents can still reply via the dashboard
- **Dashboard shows a top-up banner** with recommended pack based on usage history

The soft cap (3× monthly allowance in one cycle) triggers an upgrade nudge, but does not hard-block usage.

---

## Key Methods — `TokenService`

| Method | Description |
|--------|-------------|
| `deduct($company, TokenActionType)` | Deduct tokens for a usage action; records transaction |
| `credit($company, int $amount, TokenActionType, ?string $referenceId)` | Credit tokens (grant, top-up, rollover) |
| `completeTopUp($company, TokenPurchase)` | Finalize a top-up purchase after Stripe confirms payment |
| `runMonthlyCycleReset($company)` | Execute the full monthly cycle reset for one company |
| `topUpPacks()` | Return the array of available top-up pack definitions |
| `canAfford($company, TokenActionType)` | Check if company has enough balance for an action |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/Enums/TokenActionType.php` | All 10 action types with `tokenCost()` and `isDebit()` helpers |
| `app/Services/TokenService.php` | Core token business logic (deduct, credit, reset, packs) |
| `app/Models/TokenTransaction.php` | Eloquent model for `token_transactions` table |
| `app/Models/TokenPurchase.php` | Eloquent model for `token_purchases` table |
| `app/Console/Commands/TokenMonthlyCycleCommand.php` | `tokens:monthly-cycle` Artisan command |
| `app/Http/Controllers/Api/BillingController.php` | Stripe Checkout, portal, cancel subscription, top-up endpoints |
