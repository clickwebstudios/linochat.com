# Module: Frubix CRM Integration

## Overview

Frubix is a CRM / appointment-scheduling platform. LinoChat integrates with it as both an OAuth consumer (connecting to Frubix) and an OAuth provider (Frubix connects back to LinoChat).

---

## Two Directions of Integration

```
LinoChat ──OAuth2──► Frubix   (LinoChat is consumer)
    - Book appointments
    - Create leads from tickets/chats
    - Sync chat messages

Frubix ──OAuth2──► LinoChat   (LinoChat is provider)
    - Frubix sends messages to chats
    - Frubix registers/unregisters connections
    - Frubix checks agent status
```

---

## LinoChat as OAuth Consumer (Connecting to Frubix)

### Setup Flow

1. Admin goes to project Integrations tab
2. Clicks "Connect Frubix"
3. `GET /projects/{projectId}/integrations/frubix/authorize` — returns Frubix OAuth URL
4. User redirected to Frubix to approve
5. Frubix redirects back to `POST /integrations/frubix/callback`
6. Tokens stored in `projects.integrations['frubix']`:

```json
{
  "frubix": {
    "enabled": true,
    "access_token": "...",
    "refresh_token": "...",
    "url": "https://frubix.com",
    "client_id": "..."
  }
}
```

### FrubixService (Static Methods)

`app/Services/FrubixService.php`

| Method | Description |
|--------|-------------|
| `createLead($config, $data)` | Create a CRM lead from ticket/chat |
| `sendMessage($config, $data)` | Forward agent message to Frubix |
| `getSchedule($config)` | Fetch appointments |
| `createAppointment($config, $data)` | Book appointment |
| `updateAppointment($config, $id, $data)` | Update appointment |
| `getClients($config)` | Fetch Frubix client list |

All methods take `$config` (the stored tokens from `projects.integrations['frubix']`).

### Auto Lead Creation

When a ticket is created:
- If `integrations.frubix.enabled = true` and `access_token` is set
- `TicketService::create()` calls `FrubixService::createLead()`
- Lead maps: `customer_name`, `customer_email`, `customer_phone` → Frubix lead
- Failure is logged but does NOT block ticket creation

### Manual Lead Creation

`POST /agent/tickets/{ticketId}/frubix-lead` — manually push existing ticket to Frubix.

---

## LinoChat as OAuth Provider (Frubix Connecting Back)

### OAuth 2.0 Provider Implementation

Custom OAuth 2.0 authorization code flow.

Scopes:
- `projects:read` — read projects and chats
- `projects:write` — modify project settings, register connections
- `chats:read` — read chat messages
- `chats:write` — send messages, toggle AI, typing indicators

### Frubix Registration Flow

1. Frubix authenticates via `/oauth/token`
2. Calls `POST /v1/projects/{projectId}/frubix-connect` (scope: `projects:write`)
3. LinoChat stores connection data in `projects.integrations['frubix_managed']`
4. Frubix can now:
   - Send messages to chats (`POST /v1/chats/{chatId}/message`)
   - Toggle AI (`POST /v1/chats/{chatId}/toggle-ai`)
   - Get reply suggestions (`POST /v1/chats/{chatId}/suggest-replies`)

### Frubix Webhooks

`POST /api/webhooks/frubix` → `FrubixWebhookController::handle`

Processes Frubix events (appointment updates, lead status changes, inbound messages).
Signature verification to ensure authenticity.

---

## Message Forwarding

When an agent sends a message in LinoChat:
1. `AgentController::sendMessage` calls `forwardToFrubix()`
2. If project has Frubix integration active
3. `FrubixService::sendMessage()` called with message content + sender info
4. Failure is silently logged — doesn't affect the LinoChat message

---

## Key Files

| File | Purpose |
|------|---------|
| `app/Services/FrubixService.php` | All Frubix API calls |
| `app/Http/Controllers/Api/IntegrationsController.php` | OAuth flow + settings |
| `app/Http/Controllers/Api/FrubixWebhookController.php` | Inbound Frubix events |
| `app/Http/Controllers/Api/OAuthController.php` | LinoChat OAuth provider |
| `app/Http/Controllers/Api/OAuthClientController.php` | OAuth client management |

---

## Config Keys

Backend `.env`:
```
FRUBIX_URL=https://frubix.com
FRUBIX_CLIENT_ID=
FRUBIX_CLIENT_SECRET=
FRUBIX_REDIRECT_URI=${APP_URL}/api/integrations/frubix/callback
```
