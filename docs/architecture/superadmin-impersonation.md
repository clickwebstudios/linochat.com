# Superadmin Impersonation

**File:** `backend/app/Http/Controllers/Api/SuperadminController.php`, method `impersonate()` (line 1225)

Superadmins can act as any non-superadmin user for debugging and support. The session is time-limited and fully audited.

## Auth Flow

1. **Role check** (line 1227): caller must have `role === 'superadmin'` — 403 otherwise
2. **Escalation guard** (line 1237): cannot impersonate another superadmin — 403 with explicit message
3. **Audit log** (lines 1242–1251): writes `superadmin_id`, `superadmin_email`, `target_user_id`, `target_user_email`, `target_user_role`, IP address, user agent
4. **Token creation** (line 1253): Sanctum token for target user with ability `['impersonated']`, expires in **2 hours**
5. **Response** (lines 1257–1275): returns `access_token`, target user details, first project context, and `impersonated_by` (superadmin ID)

## What's Allowed

- Full access to target user's owned and assigned projects
- View, modify, delete chats/tickets as the target user
- Send messages, assign chats, update statuses

## What's Not Allowed

- Impersonating another superadmin (hard block — escalation prevention)
- Sessions beyond 2 hours (token expiry enforced by Sanctum)

## Identifying Impersonated Requests

Impersonation tokens carry the `['impersonated']` Sanctum ability. Middleware or controller logic can check `$request->tokenCan('impersonated')` to detect and restrict certain actions if needed.
