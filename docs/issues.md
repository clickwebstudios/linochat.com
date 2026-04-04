# Known Issues & Inconsistencies

Issues found during codebase exploration. Update status when resolved.

---

## HIGH Priority

### H1 — Duplicate Migrations (Open)

**What**: Two sets of migrations exist for the same tables:
- Early set: `2026_02_17_*` (created during initial prototyping)
- Canonical set: `2026_03_02_*` (rebuilt with correct schema)

Affected tables: `chats`, `chat_messages`, `projects`, `tickets`, `kb_articles`, `kb_categories`, and `project_user`.

The early migrations have different column names (e.g. `sender` instead of `sender_type`, `text` instead of `content`, `is_read` instead of `read_at`) which means `php artisan migrate:fresh` or a fresh install will fail on subsequent migrations that reference columns from the canonical schema.

**Impact**: Fresh database setup / staging environments / CI will fail.

**Fix**: Delete or squash the early `2026_02_17_*` migrations that create tables which are recreated in `2026_03_02_*`. The canonical set should be the only ones that create these tables.

Files to review and likely remove:
- `2026_02_17_065758_create_chats_table.php`
- `2026_02_17_065759_create_chat_messages_table.php`
- `2026_02_17_064740_create_projects_table.php`
- `2026_02_17_064741_create_kb_categories_table.php`
- `2026_02_17_064742_create_kb_articles_table.php`
- `2026_02_17_074224_create_project_user_table.php`
- `2026_02_17_075523_create_tickets_table.php`
- `2026_02_17_075524_create_ticket_messages_table.php`

---

### H2 — Mixed Authentication Mechanisms (Open)

**What**: `InvitationController::accept` uses `tymon/jwt-auth` to issue tokens (`auth('api')->login($user)`), while all other controllers use Laravel Sanctum. The frontend receives the same token shape but they are fundamentally different token systems.

```php
// InvitationController::accept — JWT
$accessToken  = auth('api')->login($user);
$refreshToken = auth('api')->claims(['refresh' => true])->fromUser($user);

// AuthController — Sanctum
$accessToken  = $user->createToken('access-token')->plainTextToken;
$refreshToken = $user->createToken('refresh-token')->plainTextToken;
```

**Impact**: After accepting an invitation, the user holds a JWT token. If they try to refresh it via `/auth/refresh` (Sanctum-based), it will fail. The user would need to log in again.

**Fix**: Replace the JWT token generation in `InvitationController::accept` with Sanctum token generation to match the rest of the auth system. Verify `tymon/jwt-auth` can be removed from `composer.json`.

---

## MEDIUM Priority

### M1 — Duplicate Mail Classes (Open)

**What**: Two nearly identical invitation mail classes exist:
- `app/Mail/AgentInvitationMail.php`
- `app/Mail/AgentInviteMail.php`

`AgentInvitationMail.php` is used by `InvitationService` and both controllers. `AgentInviteMail.php` status is unknown.

**Impact**: Confusion about which is canonical; dead code.

**Fix**: Determine which class is used (grep for `AgentInviteMail`), delete the unused one.

---

### M2 — Chat Model Missing `assignedTo` and `lastMessage` Relationships (Open)

**What**: `ChatController::show` calls:
```php
$chat->load('project', 'assignedTo', 'lastMessage')
```

But the `Chat` model only defines `agent()` (not `assignedTo`) and has no `lastMessage` relationship.

**Impact**: `ChatController::show` will fail at runtime with a relationship not found error. However, `AgentController::show` (the more commonly used path) loads `agent` correctly.

**Fix**: Either add `assignedTo` and `lastMessage` relationships to the `Chat` model, or fix `ChatController::show` to use `agent`.

Suggested additions to `Chat` model:
```php
public function assignedTo() {
    return $this->belongsTo(User::class, 'agent_id');
}
public function lastMessage() {
    return $this->hasOne(ChatMessage::class)->latestOfMany();
}
```

---

### M3 — `company_name` Denormalized on User (Open)

**What**: `users.company_name` stores the company name as a string on the user record (set during registration). There's also a `companies` table with a `name` column. These two sources can diverge.

**Impact**: Inconsistent company name display if one is updated but not the other.

**Fix**: Long-term, remove `users.company_name` and rely on the `companies` table. Short-term, ensure both are updated together.

---

### M4 — `Ticket::store` Returns Raw `$ticket` (Open)

**What**: `TicketController::store` returns the raw `$ticket` model in `data`, not wrapped in `TicketResource`:
```php
'data' => $ticket,  // Should be: new TicketResource($ticket)
```

Other responses in the same controller use `TicketResource`. This means the ticket creation response has a different shape than the ticket GET responses.

**Impact**: Frontend may receive inconsistent ticket object shapes.

**Fix**: Change to `'data' => new TicketResource($ticket->load('project', 'assignedAgent'))`.

---

### M5 — `AgentController` Imports Unused Event (Open)

**What**: `AgentController` imports `NewChatForAgent` but never uses it.

**Impact**: Minor — dead import, no functional issue.

**Fix**: Remove the unused import.

---

## LOW Priority

### L1 — Queue Driver is `database` in Default Config (Open)

**What**: Default `QUEUE_CONNECTION=database` means queue jobs are stored in MySQL. Under load, this creates table contention.

**Impact**: Performance degradation under high traffic.

**Fix**: Switch to Redis (`QUEUE_CONNECTION=redis`) for production.

---

### L2 — No Automated Database Backup Configured (Open)

**What**: No backup script, cron job, or cloud backup is set up.

**Impact**: Data loss risk in case of server failure.

**Fix**: Add daily mysqldump cron or configure a managed backup service.

---

### L3 — Wrong Log Level in `TicketController` (Open)

**What**: In `TicketController::store` (now in `TicketService::create`):
```php
Log::error('Frubix lead created for ticket', ['ticket_id' => $ticket->id]);
```

This uses `Log::error` for a success message — it should be `Log::info`.

**Impact**: False errors in logs.

**Fix**: Change to `Log::info`.

---

### L4 — `company_id` on Projects Inconsistency (Open)

**What**: `projects` table has a `company_id` FK (from `2026_03_02_075136_create_projects_table.php`) but the `Project` model's `$fillable` does not include `company_id`. Also, `User::getCompanyProjectIds()` queries projects by `user_id` (not `company_id`).

**Impact**: `company_id` on projects may not be populated.

**Fix**: Either populate `company_id` during project creation and use it for company isolation, or remove the column if it's not used.

---

### L5 — SSG Only for Marketing Pages (Open — by design, documented)

**What**: `react-snap` pre-renders only `/`, `/features`, `/pricing`, `/resources`, `/about`, `/contact`. Dashboard routes are client-only.

**Impact**: Dashboards have no SSR/SSG — no SEO, slower initial load on poor connections. This is intentional.

**Note**: This is by design (dashboards require auth), not a bug.
