# Frubix Integration

LinoChat integrates with [Frubix](https://frubix.com) — a field service management CRM — to sync leads, look up clients, and manage appointments directly from chat.

## Overview

- **OAuth 2.0** connection flow (authorization code grant)
- **Automatic lead creation** when tickets are created
- **Manual lead creation** from ticket details dropdown
- **AI-powered** client lookup, schedule checking, appointment booking, and rescheduling
- **Webhook receiver** for two-way sync of appointment and lead events

## Environment Variables

```env
FRUBIX_URL=https://frubix.com
FRUBIX_CLIENT_ID=<from Frubix OAuth Apps>
FRUBIX_CLIENT_SECRET=<from Frubix OAuth Apps>
FRUBIX_REDIRECT_URI=https://yourdomain.com/api/integrations/frubix/callback
```

Configured in `backend/config/services.php` under `frubix`.

## Connection Flow (OAuth)

1. Admin clicks "Connect with Frubix" in Project Settings → Integrations tab (or Agent Dashboard → Integrations)
2. Frontend requests authorization URL: `GET /projects/{id}/integrations/frubix/authorize`
3. OAuth popup opens at `{FRUBIX_URL}/oauth/authorize` with scopes: `leads:write`, `clients:read`, `schedule:read`, `schedule:write`
4. User logs into Frubix and grants consent
5. Frubix redirects to `FrubixCallbackPage` at `/integrations/frubix/callback`
6. Callback page sends `POST /api/integrations/frubix/callback` with the auth code
7. Backend exchanges code for tokens via `FrubixService::exchangeCode()`
8. Tokens are stored in `projects.integrations` JSON column as `integrations.frubix.access_token` / `refresh_token`
9. Popup sends `postMessage` to parent window, UI updates to "Connected"

**Token refresh**: When any API call returns 401, `FrubixService` automatically refreshes the token and persists new tokens back to the project record.

## Lead Creation

### Automatic (on ticket creation)
When a ticket is created (`TicketController::store()`), if Frubix is connected, a lead is automatically created in Frubix with:
- Customer name, email
- Source: `linochat`
- Notes: ticket number + subject + description

### Manual (from ticket details)
Agent clicks "Create Frubix Lead" in the ticket dropdown menu → `POST /agent/tickets/{id}/frubix-lead`. Response includes `frubix_lead_id` and `frubix_lead_url` for a direct link.

## AI Control Tokens

The AI agent uses control tokens in its responses to trigger Frubix operations:

| Token | Action |
|-------|--------|
| `[LOOKUP_CLIENT: phone_or_email]` | Search Frubix clients by phone/email |
| `[CHECK_SCHEDULE: phone_or_email]` | Get upcoming appointments (30 days) |
| `[CHECK_SCHEDULE: ALL]` | Get all upcoming schedule entries |
| `[RESCHEDULE_APPOINTMENT: id][NEW_DATE: YYYY-MM-DD][NEW_TIME: HH:MM]` | Reschedule an appointment |
| `[CREATE_BOOKING]` with `[BOOKING_DATE]` / `[BOOKING_TIME]` | Book new appointment |

### Handover Prevention
When Frubix is connected and a customer asks about appointments, the AI handles it directly instead of handing over to a human agent. It asks for phone/email to look up the customer's appointments.

### Conflict Detection
Before booking, the system checks existing Frubix schedule for the requested date/time. If a conflict is found, the booking is created as a ticket for manual scheduling.

## Webhook Receiver

**Endpoint**: `POST /api/webhooks/frubix` (public, verified by `X-Frubix-Signature` header)

Supported events:
- `appointment.created` — adds system message to active chat
- `appointment.updated` — adds rescheduled notification to chat
- `appointment.cancelled` — adds cancellation notification to chat
- `lead.updated` — syncs lead status to ticket metadata

Configure the webhook secret in the project's integration settings (`integrations.frubix.webhook_secret`).

## API Endpoints

### Authenticated (require `auth:sanctum`)
| Method | Endpoint | Handler |
|--------|----------|---------|
| `GET` | `/projects/{id}/integrations` | `IntegrationsController::getSettings` |
| `GET` | `/projects/{id}/integrations/frubix/authorize` | `IntegrationsController::frubixAuthorizeUrl` |
| `GET` | `/projects/{id}/integrations/frubix/clients` | `IntegrationsController::frubixClients` |
| `GET` | `/projects/{id}/integrations/frubix/schedule` | `IntegrationsController::frubixSchedule` |
| `POST` | `/projects/{id}/integrations/frubix/schedule` | `IntegrationsController::frubixCreateAppointment` |
| `PATCH` | `/projects/{id}/integrations/frubix/schedule/{appointmentId}` | `IntegrationsController::frubixUpdateAppointment` |
| `DELETE` | `/projects/{id}/integrations/frubix` | `IntegrationsController::disconnectFrubix` |
| `POST` | `/agent/tickets/{id}/frubix-lead` | `TicketController::createFrubixLead` |

### Public
| Method | Endpoint | Handler |
|--------|----------|---------|
| `POST` | `/integrations/frubix/callback` | `IntegrationsController::frubixCallback` |
| `POST` | `/webhooks/frubix` | `FrubixWebhookController::handle` |

## Key Files

- `backend/app/Services/FrubixService.php` — API client with token refresh
- `backend/app/Http/Controllers/Api/IntegrationsController.php` — OAuth + CRUD endpoints
- `backend/app/Http/Controllers/Api/FrubixWebhookController.php` — Webhook receiver
- `backend/app/Http/Controllers/Api/TicketController.php` — Lead creation (auto + manual)
- `backend/app/Services/AiChatService.php` — AI control tokens + booking flow
- `frontend/src/app/components/project-details/IntegrationsTab.tsx` — Admin OAuth UI
- `frontend/src/app/components/agent-dashboard/IntegrationsView.tsx` — Agent OAuth UI
- `frontend/src/app/pages/oauth/FrubixCallbackPage.tsx` — OAuth callback handler
- `frontend/src/app/types/frubix.ts` — Shared TypeScript types
