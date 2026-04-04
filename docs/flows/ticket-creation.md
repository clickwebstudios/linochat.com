# Flow: Ticket Creation

All paths that create a ticket converge at `TicketService::create()`.

---

## Entry Points

| How | Route | Who |
|-----|-------|-----|
| Agent creates manually | `POST /agent/tickets` | Agent/admin in dashboard |
| Widget contact form | `POST /api/widget/{id}/create-ticket` | Visitor via widget |
| Inbound email | `POST /api/email/inbound` | Email provider webhook |
| Chat → ticket | Agent clicks "Create Ticket" in chat | Passes `chat_id` |

---

## Step 1 — Validation

**File**: `app/Http/Requests/Ticket/StoreTicketRequest.php`

Required fields:
- `project_id` — must exist in `projects`
- `customer_email` — valid email
- `subject` — string max 255
- `description` — string

Optional:
- `customer_name`
- `priority` — `low|medium|high|urgent` (default: `medium`)
- `category`
- `assigned_to` — user ID (if pre-assigned, status becomes `in_progress`)
- `chat_id` — links ticket to a chat

Validation errors return `{success: false, message: "Validation error", errors: {...}}` (HTTP 422).

---

## Step 2 — `TicketService::create()`

**File**: `app/Services/TicketService.php`

### 2a. Create Ticket Record

```php
Ticket::create([
    'project_id', 'chat_id', 'customer_email', 'customer_name',
    'subject', 'description', 'priority',
    'status' => $assignedTo ? 'in_progress' : 'open',
    'assigned_to',
]);
```

### 2b. Get ticket_number and access_token

`$ticket->refresh()` — triggers the `booted()` hook which sets:
- `ticket_number` = `TKT-{YEAR}-{00001}`
- `access_token` = random 48-char string

### 2c. System Message in Linked Chat (if `chat_id` set)

```php
ChatMessage::create([
    'chat_id', 'sender_type' => 'system',
    'content' => "Ticket TKT-2026-00042 created: {subject}"
]);
broadcast(new MessageSent($systemMessage))->toOthers();
```

### 2d. Initial Ticket Message

```php
TicketMessage::create([
    'ticket_id', 'sender_type' => 'customer',
    'sender_id' => $ticket->customer_email,
    'content' => $ticket->description,
]);
```

### 2e. Customer Confirmation Email

**Mail class**: `TicketCreatedMail`  
**To**: `customer_email`  
**Contains**: Ticket number, subject, link to public ticket URL (`/ticket/{access_token}`)

On failure: logged to `notification_logs` with status=`failed`. Does NOT throw.

### 2f. Team Notification Emails

**Mail class**: `NewTicketMail`  
**To**: All project agents + project owner (deduplicated)  
**Contains**: New ticket details

Each send logged to `notification_logs`.

### 2g. Activity Log

```php
ActivityLog::log('ticket_created', "Ticket #{number} created", "{customer} — {subject}", [
    'company_id', 'user_id' (actor), 'project_id',
]);
```

### 2h. Frubix Lead Creation (if integration enabled)

Checks `project.integrations['frubix']['enabled']` and `access_token`.

```php
FrubixService::createLead($frubixConfig, [
    'name', 'email', 'phone', 'source' => 'linochat',
    'status' => 'new', 'notes' => "[LinoChat Ticket {number}] {subject}\n\n{description}",
]);
```

Failure is logged (`Log::error`) but does NOT block ticket creation.

---

## Step 3 — Response

```json
{
  "success": true,
  "message": "Ticket created",
  "data": { ...ticket fields... },
  "ticket_number": "TKT-2026-00042"
}
```

HTTP 201.

**Note**: `data` is the raw `$ticket` model, not `TicketResource` — see `issues.md` (M4).

---

## Public Ticket View

The customer receives an email with:
```
{FRONTEND_URL}/ticket/{access_token}
```

This page uses `PublicTicketController::show` (no auth):
- Shows ticket status, messages
- Allows customer to reply via `POST /public/tickets/{token}/reply`
