# Flow: Agent Invitation

Two entry points lead to the same `InvitationService::create()`.

---

## Entry Points

| Route | Controller | Use case |
|-------|-----------|---------|
| `POST /projects/{project_id}/invitations` | `InvitationController::invite` | Per-project invitation |
| `POST /agent/invitations` | `AgentController::inviteAgent` | Team management page (multi-project support via `project_ids[]`) |

---

## Step 1 — Admin Sends Invitation

**File**: `app/Services/InvitationService.php`  
**Auth**: Sanctum (admin/owner only)

### Pre-checks (in controller, before calling service)

1. Project exists
2. Current user is project owner (`project.user_id === user.id`)
3. Email not already assigned to project
4. No active pending invitation for this email+project

On failure: `{success: false, message: "..."}` (HTTP 422 or 403).

### `InvitationService::create(email, project, extra)`

Creates:
```php
Invitation::create([
    'project_id', 'email', 'first_name', 'last_name',
    'role' => 'agent',       // default
    'token' => Str::random(32),
    'status' => 'pending',
    'expires_at' => now()->addDays(7),
]);
```

Sends `AgentInvitationMail` to the email address.

Returns `['invitation', 'email_sent' => bool, 'mail_driver' => string]`.

### Response

```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitation_id": "...",
    "email": "agent@example.com",
    "status": "pending",
    "expires_at": "2026-04-11T...",
    "email_sent": true
  }
}
```

If `MAIL_MAILER=log`: message says to configure SMTP.  
If email send fails: invitation is still created, message says email could not be sent.

---

## Step 2 — Agent Receives Email

Email contains a link: `{FRONTEND_URL}/invite/{token}`

Frontend page: `frontend/src/app/pages/auth/InviteAcceptPage.tsx`

1. Page calls `GET /invitations/{token}` to show invitation details (project name, expiry)
2. If expired or already used → shows appropriate error

---

## Step 3 — Agent Accepts Invitation

**Route**: `POST /invitations/{token}/accept`  
**File**: `InvitationController::accept`  
**Auth**: None (public)

**Form Request**: `Invitation/AcceptRequest` — requires `first_name`, `last_name`, `password`, `password_confirmation`

### Check invitation validity

1. Token exists → 404 if not
2. Not expired (`expires_at > now()`) → 410 if expired
3. Status is `pending` → 410 if already used

### Case A: User with this email already exists

1. Check cross-company: if user belongs to a DIFFERENT company's project → 409 Conflict
2. If same company: `$user->projects()->syncWithoutDetaching([$project_id])` — adds to project

### Case B: New user

```php
User::create([
    'first_name', 'last_name',
    'email' => $invitation->email,
    'password' => Hash::make($request->password),
    'role' => 'agent',
    'status' => 'Active',
    'join_date' => now(),
]);
$user->notificationPreferences()->create([...]);
$user->availabilitySettings()->create([
    'auto_accept_chats' => false,   // agents don't auto-accept (different from admin default)
    'max_concurrent_chats' => 3,    // lower than admin default of 5
]);
$user->projects()->attach($invitation->project_id);
```

### Mark invitation accepted

```php
$invitation->update(['status' => 'accepted', 'accepted_at' => now()]);
```

### Issue auth tokens

**⚠️ Uses JWT (tymon/jwt-auth), not Sanctum** — see `issues.md` (H2).

```php
$accessToken  = auth('api')->login($user);
$refreshToken = auth('api')->claims(['refresh' => true])->fromUser($user);
```

### Response

```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {...}
  }
}
```

Agent is now logged in and redirected to the agent dashboard.

---

## Step 4 — Resend Invitation (if needed)

**Route**: `POST /agent/invitations/{id}/resend`  
**File**: `AgentController::resendInvitation` → `InvitationService::resend()`

1. Checks invitation is still `pending` and `expires_at > now()`
2. Verifies user owns the project
3. `InvitationService::resend()`:
   - Generates new `token`
   - Extends `expires_at` by 7 days
   - Resends `AgentInvitationMail`

---

## Step 5 — Cancel Invitation

**Route**: `DELETE /invitations/{invitation_id}`  
**Auth**: Sanctum (project owner only)

Sets `status = 'expired'`. Invitation link will return 410 thereafter.

---

## Invitation Statuses

Enum: `App\Enums\InvitationStatus`

| Status | Meaning |
|--------|---------|
| `pending` | Sent, awaiting response |
| `accepted` | Agent accepted and registered |
| `rejected` | Agent declined |
| `expired` | Cancelled by admin OR time expired |
