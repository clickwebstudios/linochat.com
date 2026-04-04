# Module: Auth & Invitations

## Overview

Three ways to get a token: email/password login, Google OAuth, or accepting an agent invitation. All protected routes use `auth:sanctum` middleware except one (see below).

---

## Token System

- **Type**: Laravel Sanctum personal access tokens
- **Shape**: `{ access_token, refresh_token, token_type: "bearer", expires_in: 3600 }`
- Both tokens are Sanctum personal access tokens named `access-token` and `refresh-token`
- `expires_in: 3600` is nominal — Sanctum tokens don't actually expire unless configured via `sanctum.expiration`
- Refresh: `POST /auth/refresh` with `{ refresh_token }` — revokes all old tokens, issues new pair

**Exception**: `InvitationController::accept` issues JWT tokens (tymon/jwt-auth), not Sanctum tokens. See `issues.md` (H2).

---

## Auth Controller (`AuthController`)

### Login (`POST /auth/login`)

- Rate-limits by email: 5 failed attempts → 15-minute lockout
- Failed attempts logged with IP and user agent
- Uses `Form Request`: `Auth/LoginRequest`

### Register (`POST /auth/register`)

On success creates:
1. `User` (role: `admin`)
2. `UserNotificationPreference` (defaults: email ✓, desktop ✓, sound ✗, weekly ✓)
3. `UserAvailabilitySetting` (auto_accept: true, max_concurrent: 5)
4. `Project` (named after company, with auto-generated `widget_id` and `slug`)
5. Runs `WebsiteAnalyzerService::analyze($website)` → creates KB categories + articles
6. Sends `WelcomeMail`

### Google OAuth (`POST /auth/google`)

- Takes Google ID token (from `@react-oauth/google` on frontend)
- Validates via `Socialite::driver('google')` on backend
- Creates user if new (role: `admin`, no project or KB created)
- Links `google_id` to existing user if email matches

### Email Verification (pre-registration flow)

1. `POST /auth/send-verification-code` — sends 4-digit code, rate-limited to 1 per 60 seconds
2. `POST /auth/verify-email-code` — validates code (expires in 15 minutes)
3. Then proceed with registration

### Password Reset

1. `POST /auth/forgot-password` — stores hashed token in `password_resets` table, sends `PasswordResetMail`
2. Token expires in 60 minutes
3. `POST /auth/reset-password` — validates token + resets password

---

## User Roles

Enum: `App\Enums\UserRole`

| Role | Description | Can own projects | Can be agent | Bypasses company isolation |
|------|-------------|-----------------|--------------|---------------------------|
| `admin` | Company owner | Yes | No | No |
| `agent` | Support agent | No | Yes | No |
| `superadmin` | Platform admin | — | — | Yes |

Methods on `User` model: `isSuperadmin()`, `isAdmin()`, `isAgent()`

---

## Agent Invitation Flow

Two entry points — both use `InvitationService::create()`:
- `POST /projects/{project_id}/invitations` → `InvitationController::invite`
- `POST /agent/invitations` → `AgentController::inviteAgent`

### Invitation Lifecycle

```
Admin sends invitation
        │
        ▼
   status=pending
   expires_at=now+7days
   token=random32
   Email: AgentInvitationMail
        │
        ▼ /invitations/{token}/accept
   InvitationController::accept
        │
        ├── User exists? → syncWithoutDetaching to project
        │   (cross-company check: reject if user belongs to different company)
        │
        └── User new? → create User(role=agent)
                         create NotificationPreferences
                         create AvailabilitySettings
                         attach to project
        │
        ▼
   status=accepted
   accepted_at=now
   Issues auth tokens (JWT — see issues.md H2)
```

### InvitationService

`app/Services/InvitationService.php`

- `create(email, project, extra)` — creates record + sends email, returns `[invitation, email_sent, mail_driver]`
- `resend(invitation, project)` — regenerates token, extends expiry 7 days, resends email
- `buildMessage(email_sent, action)` — returns user-facing message string

### Duplicate Check

Before creating an invitation, both controllers check:
1. User with that email already assigned to the project → 422
2. Pending non-expired invitation already exists for email+project → 422

---

## Cross-Company Isolation

When an invited agent already exists in the system, the system checks `getCompanyOwnerId()` to prevent the agent from being shared across companies:

```php
$existingCompanyOwnerId = $user->getCompanyOwnerId();
if ($existingCompanyOwnerId && $project->user_id !== $existingCompanyOwnerId) {
    // Reject — agent belongs to a different company
}
```

---

## Company Isolation Helpers on User

| Method | Returns | Purpose |
|--------|---------|---------|
| `getCompanyOwnerId()` | `?int` | Admin ID this user belongs to |
| `getCompanyProjectIds()` | `Collection<int>` | All project IDs in this user's company |
| `resolveProjectIds(?companyId)` | `?Collection<int>` | For data scoping; superadmin can filter by company |
| `canAccessProject($project)` | `bool` | Full company-isolated access check |

---

## Policies

All three policies use `$user->can(ability, model)` pattern to keep HTTP 403 response format consistent.

| Policy | Model | Key rule |
|--------|-------|---------|
| `TicketPolicy` | `Ticket` | view/update/reply: assigned agent OR project member OR owner OR superadmin |
| `ProjectPolicy` | `Project` | view: owner OR agent OR superadmin; manage: owner OR superadmin only |
| `ChatPolicy` | `Chat` | view/send/close: agent_id OR project member OR owner OR superadmin |

---

## Frontend Auth Store

`frontend/src/app/stores/authStore.ts` (Zustand)

Holds: `user`, `accessToken`, `refreshToken`, `isAuthenticated`

`api/client.ts` handles:
- Attaching `Authorization: Bearer {token}` to every request
- On 401: attempts refresh → retries original request → if refresh fails, logs out
