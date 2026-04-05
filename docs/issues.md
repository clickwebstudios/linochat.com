# Known Issues & Inconsistencies

Issues found during codebase exploration. Update status when resolved.

---

## HIGH Priority

### H1 — Duplicate Migrations (Resolved)

**What**: Two sets of migrations exist for the same tables:
- Early set: `2026_02_17_*` (created during initial prototyping)
- Canonical set: `2026_03_02_*` (rebuilt with correct schema)

Affected tables: `chats`, `chat_messages`, `projects`, `tickets`, `kb_articles`, `kb_categories`, and `project_user`.

The early migrations have different column names (e.g. `sender` instead of `sender_type`, `text` instead of `content`, `is_read` instead of `read_at`) which means `php artisan migrate:fresh` or a fresh install will fail on subsequent migrations that reference columns from the canonical schema.

**Impact**: Fresh database setup / staging environments / CI will fail.

**Fix applied**: After inspection, the Feb `2026_02_17_*` migrations are correct (they have `agent_id`, `sender_type`, `content` etc. matching the running code). The March `2026_03_02_*` versions had a simplified/different schema that never ran on production. Deleted the 5 conflicting March migrations:
- `2026_03_02_075136_create_projects_table.php` (used wrong `company_id` FK instead of `user_id`)
- `2026_03_02_075137_create_project_user_table.php`
- `2026_03_02_075138_create_tickets_table.php`
- `2026_03_02_075139_create_chats_table.php` (used `assigned_to` instead of `agent_id`)
- `2026_03_02_075140_create_chat_messages_table.php` (used `sender`/`text`/`is_read` instead of `sender_type`/`content`/`read_at`)

Note: `config/auth.php` still has the `api` guard configured as `sanctum`. The `tymon/jwt-auth` package remains in `composer.json` but is now unused — run `composer remove tymon/jwt-auth` and delete `config/jwt.php` to clean it up fully.

---

### H2 — Mixed Authentication Mechanisms (Resolved)

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

**Fix applied**: Replaced JWT token generation in `InvitationController::accept` with `$user->createToken('access-token')->plainTextToken` (Sanctum), matching the exact pattern used by `AuthController`. Response shape is unchanged — `access_token`, `refresh_token`, `token_type`, `expires_in: 3600`.

Confirmed `config/auth.php` has `'api' => ['driver' => 'sanctum']` — the JWT package was never actually used for authentication; only for this broken token issuance. Cleanup: run `composer remove tymon/jwt-auth` and delete `config/jwt.php`.

---

## MEDIUM Priority

### M1 — Duplicate Mail Classes (Resolved)

**What**: Two nearly identical invitation mail classes exist:
- `app/Mail/AgentInvitationMail.php`
- `app/Mail/AgentInviteMail.php`

`AgentInvitationMail.php` is used by `InvitationService` and both controllers. `AgentInviteMail.php` status is unknown.

**Impact**: Confusion about which is canonical; dead code.

**Fix applied**: Grepped entire backend — `AgentInviteMail` was only referenced in its own class file. Deleted `app/Mail/AgentInviteMail.php`.

---

### M2 — Chat Model Missing `assignedTo` and `lastMessage` Relationships (Resolved)

**What**: `ChatController::show` calls:
```php
$chat->load('project', 'assignedTo', 'lastMessage')
```

But the `Chat` model only defines `agent()` (not `assignedTo`) and has no `lastMessage` relationship.

**Impact**: `ChatController::show` will fail at runtime with a relationship not found error. However, `AgentController::show` (the more commonly used path) loads `agent` correctly.

**Fix applied**: Added `assignedTo()` (BelongsTo User via `agent_id`) and `lastMessage()` (HasOne ChatMessage via `latestOfMany()`) to `app/Models/Chat.php` after the existing `agent()` method.

---

### M3 — `company_name` Denormalized on User (Open)

**What**: `users.company_name` stores the company name as a string on the user record (set during registration). There's also a `companies` table with a `name` column. These two sources can diverge.

**Impact**: Inconsistent company name display if one is updated but not the other.

**Fix**: Long-term, remove `users.company_name` and rely on the `companies` table. Short-term, ensure both are updated together.

---

### M4 — `Ticket::store` Returns Raw `$ticket` (Resolved)

**What**: `TicketController::store` returns the raw `$ticket` model in `data`, not wrapped in `TicketResource`:
```php
'data' => $ticket,  // Should be: new TicketResource($ticket)
```

Other responses in the same controller use `TicketResource`. This means the ticket creation response has a different shape than the ticket GET responses.

**Impact**: Frontend may receive inconsistent ticket object shapes.

**Fix applied**: Changed `'data' => $ticket` to `'data' => new TicketResource($ticket->load('project', 'assignedAgent'))` in `TicketController::store`. `TicketResource` was already imported at the top of the file.

---

### M5 — `AgentController` Imports Unused Event (Resolved)

**What**: `AgentController` imports `NewChatForAgent` but never uses it.

**Impact**: Minor — dead import, no functional issue.

**Fix applied**: Removed `use App\Events\NewChatForAgent;` from `app/Http/Controllers/Api/AgentController.php` after confirming it is not referenced anywhere else in the file.

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

### L3 — Wrong Log Level in `TicketController` (Resolved)

**What**: In `TicketController::store` (now in `TicketService::create`):
```php
Log::error('Frubix lead created for ticket', ['ticket_id' => $ticket->id]);
```

This uses `Log::error` for a success message — it should be `Log::info`.

**Impact**: False errors in logs.

**Fix applied**: Changed `Log::error` to `Log::info` on the Frubix lead failure log line in `app/Services/TicketService.php`.

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
