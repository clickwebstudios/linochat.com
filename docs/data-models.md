# Data Models

All tables use `id` (BIGINT unsigned auto-increment), `created_at`, `updated_at` unless noted.

> **Note**: Some early migrations (`2026_02_17_*`) were superseded by the `2026_03_02_*` set but both exist in the migrations directory. The canonical schema is from the later migrations + subsequent `add_*` migrations. See `issues.md` for details.

---

## users

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| first_name | string(100) | |
| last_name | string(100) | |
| email | string unique | |
| email_verified_at | timestamp nullable | |
| password | string | bcrypt hashed |
| company_name | string nullable | From registration — denormalized |
| phone | string(50) nullable | |
| location | string(255) nullable | |
| country | char(2) nullable | ISO 3166 |
| bio | text nullable | |
| avatar_url | string(512) nullable | |
| google_id | string nullable | For Google OAuth login |
| role | enum | `superadmin`, `admin`, `agent` |
| status | enum | `Active`, `Away`, `Offline`, `Deactivated`, `Invited` |
| two_factor_enabled | boolean | default false |
| last_active_at | timestamp nullable | |
| join_date | date | |
| remember_token | string nullable | |

**Indexes**: role, status

**Relationships**:
- `projects()` → belongsToMany Project via `project_user` (assigned agent)
- `ownedProjects()` → hasMany Project (via `user_id`) — admin ownership
- `chats()` → hasMany Chat (via `agent_id`)
- `tickets()` → hasMany Ticket (via `assigned_to`)
- `notificationPreferences()` → hasOne UserNotificationPreference
- `availabilitySettings()` → hasOne UserAvailabilitySetting
- `deviceTokens()` → hasMany DeviceToken

**Key methods**:
- `canAccessProject($project)` — company-isolated access check
- `getCompanyProjectIds()` — all project IDs in this user's company
- `resolveProjectIds(?companyId)` — used for data scoping
- `getCompanyOwnerId()` — admin user ID this user belongs to
- `isSuperadmin()`, `isAdmin()`, `isAgent()`
- `getNameAttribute()` — `first_name . ' ' . last_name`

---

## companies

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| plan | string | default `Starter` |
| notification_settings | json nullable | Added via migration |

**Note**: Lightly used. Company isolation is primarily enforced through `projects.user_id`, not a FK on users. The `company_id` referenced in activity logs and notification logs refers to this table.

---

## projects

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK → users | Admin/owner |
| company_id | bigint FK → companies | Added in later migration |
| name | string | |
| slug | string unique | `name-slug-random6` |
| widget_id | string unique | `wc_` + random 32 chars — identifies the widget |
| website | string nullable | Used for KB auto-generation |
| description | text nullable | |
| color | string | Hex color, default `#4F46E5` |
| status | string | `active`, `inactive`, `archived` |
| widget_settings | json nullable | Widget appearance, behavior |
| ai_settings | json | AI configuration (model, tone, prompt, etc.) |
| integrations | json nullable | `frubix`, `frubix_managed` configs |
| settings_updated_at | timestamp nullable | |

**Relationships**:
- `owner()` / `user()` → belongsTo User
- `agents()` → belongsToMany User via `project_user`
- `chats()` → hasMany Chat
- `tickets()` → hasMany Ticket
- `kbCategories()` → hasMany KbCategory
- `aiSettingsVersions()` → hasMany AiSettingsVersion

**ai_settings JSON keys**: `ai_enabled`, `ai_name`, `system_prompt`, `response_tone`, `fallback_behavior`, `confidence_threshold`, `response_language`, `auto_learn`, `model`

---

## project_user (pivot)

| Column | Type | Notes |
|--------|------|-------|
| project_id | bigint FK | |
| user_id | bigint FK | |
| created_at, updated_at | timestamps | |

---

## chats

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| agent_id | bigint FK → users nullable | Currently assigned agent |
| customer_email | string nullable | |
| customer_name | string nullable | |
| customer_id | string nullable | Widget session ID |
| subject | string nullable | |
| status | string | `active`, `waiting`, `ai_handling`, `offline`, `closed` |
| ai_enabled | boolean | default true |
| priority | string nullable | |
| last_message_at | timestamp nullable | Used for ordering |
| customer_last_seen_at | timestamp nullable | |
| metadata | json nullable | `current_page`, `browser`, `device`, `location`, `pages_visited`, etc. |
| resolution_type | string nullable | |

**Relationships**:
- `project()` → belongsTo Project
- `agent()` → belongsTo User (via `agent_id`)
- `messages()` → hasMany ChatMessage
- `transfers()` → hasMany ChatTransfer

---

## chat_messages

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| chat_id | bigint FK → chats | |
| sender_type | string | `customer`, `agent`, `ai`, `system` |
| sender_id | string nullable | User ID (agent) or email (customer) |
| content | text | Message body |
| is_ai | boolean | default false |
| read_at | timestamp nullable | When agent read this message |
| metadata | json nullable | `attachments: [{url, name}]` |

---

## chat_transfers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| chat_id | bigint FK → chats | |
| from_agent_id | bigint FK → users | |
| to_agent_id | bigint FK → users | |
| status | string | `pending`, `accepted`, `rejected` |
| reason | text nullable | |

---

## tickets

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| chat_id | bigint FK → chats nullable | Linked chat |
| assigned_to | bigint FK → users nullable | Assigned agent |
| customer_email | string nullable | |
| customer_name | string nullable | |
| customer_phone | string nullable | |
| service_address | string nullable | |
| subject | string | |
| description | text | |
| status | string | `open`, `in_progress`, `waiting`, `resolved`, `closed`, `pending` |
| priority | string | `low`, `medium`, `high`, `urgent` |
| category | string nullable | |
| ticket_number | string nullable | `TKT-YYYY-NNNNN` — set by `booted()` hook |
| access_token | string(48) nullable | For public ticket view URL |
| resolved_at | timestamp nullable | Set when status → `resolved` |

**Relationships**:
- `project()` → belongsTo Project
- `assignedAgent()` → belongsTo User (via `assigned_to`)
- `chat()` → belongsTo Chat
- `messages()` → hasMany TicketMessage

---

## ticket_messages

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| ticket_id | bigint FK → tickets | |
| sender_type | string | `customer`, `agent`, `system` |
| sender_id | string nullable | Agent user ID or customer email |
| content | text | |
| metadata | json nullable | `{system: true}`, `{system: true, escalation: true}` |

---

## kb_categories

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| name | string | |
| slug | string | |
| description | text nullable | |
| icon | string nullable | |
| sort_order | integer | default 0 |

---

## kb_articles

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| category_id | bigint FK → kb_categories | |
| project_id | bigint FK → projects | |
| author_id | bigint FK → users | |
| title | string(255) | |
| slug | string(255) | |
| content | longtext | Markdown |
| status | enum | `draft`, `published`, `archived` |
| is_published | boolean | default true |
| views | integer | default 0 |
| views_count | integer | default 0 |
| helpful_count | integer | default 0 |
| not_helpful_count | integer | default 0 |
| ai_summary | text nullable | AI-generated summary |
| ai_tags | json nullable | Auto-tagged keywords |
| embedding | json nullable | OpenAI vector embedding for semantic search |
| is_auto_generated | boolean | default false |
| source_url | string nullable | URL it was generated from |

**Indexes**: `[project_id, slug]`, `[project_id, status]`, `category_id`

---

## training_documents

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| title | string | |
| content | longtext | Raw training content |
| file_type | string nullable | `pdf`, `txt`, `url`, etc. |
| source_url | string nullable | |
| embedding | json nullable | |
| processed_at | timestamp nullable | |

---

## invitations

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| email | string | Invitee email |
| first_name | string nullable | |
| last_name | string nullable | |
| role | string | default `agent` |
| token | string(32) | Random — used in invitation URL |
| status | string | `pending`, `accepted`, `rejected`, `expired` |
| expires_at | timestamp | 7 days from creation |
| accepted_at | timestamp nullable | |

---

## email_verification_codes

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| email | string | |
| code | string | 4-digit code |
| expires_at | timestamp | 15 minutes |

---

## plans

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| name | string | |
| price | decimal | |
| features | json nullable | |
| limits | json nullable | |

---

## subscriptions

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| company_id | bigint FK → companies | |
| plan_id | bigint FK → plans | |
| status | string | `active`, `trialing`, `cancelled`, `past_due` |
| trial_ends_at | timestamp nullable | |
| ends_at | timestamp nullable | |

---

## invoices

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| company_id | bigint FK → companies | |
| amount | decimal(10,2) | |
| status | string | `paid`, `pending`, `failed` |
| issued_at | timestamp nullable | |

---

## app_notifications

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| type | string | |
| title | string | |
| body | text | |
| data | json nullable | |
| read_at | timestamp nullable | |

---

## notification_logs

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| channel | string | `email`, `push`, `sms` |
| type | string | e.g. `Ticket Created — Customer` |
| content | text | |
| recipient | string | Email or device token |
| status | string | `sent`, `failed` |
| company_id | bigint nullable | |

---

## activity_logs

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| action | string | e.g. `ticket_created`, `chat_closed` |
| title | string | |
| description | text nullable | |
| user_id | bigint nullable | |
| company_id | bigint nullable | |
| project_id | bigint nullable | |
| metadata | json nullable | |

---

## ai_usage_logs

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint nullable | |
| model | string | |
| prompt_tokens | integer | |
| completion_tokens | integer | |
| total_tokens | integer | |
| cost_usd | decimal(10,6) nullable | |
| action | string nullable | `chat`, `kb_generate`, `embedding` |

---

## ai_settings_versions

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| settings | json | Full AI settings snapshot |
| published_at | timestamp nullable | |
| published_by | bigint FK → users nullable | |
| label | string nullable | |

---

## platform_settings

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| key | string unique | Setting key |
| value | json | |
| description | string nullable | |

---

## device_tokens

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| token | string | FCM device token |
| platform | string | `ios`, `android`, `web` |
| is_active | boolean | default true |

---

## user_availability_settings

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| auto_accept_chats | boolean | |
| max_concurrent_chats | integer | |

---

## user_notification_preferences

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| email_notifications | boolean | |
| desktop_notifications | boolean | |
| sound_alerts | boolean | |
| weekly_summary | boolean | |

---

## contact_forms

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK → projects | |
| name | string | Form name |
| slug | string unique | Used in public URL |
| fields | json | Form field definitions |
| settings | json nullable | Redirect URL, success message |
| is_active | boolean | default true |

---

## oauth_clients

| Column | Type | Notes |
|--------|------|-------|
| id | string PK | UUID |
| user_id | bigint FK → users | Owner |
| name | string | App name |
| secret | string | Client secret (hashed) |
| redirect_uris | json | Allowed redirect URLs |
| scopes | json | Granted scopes |
| is_active | boolean | |

**Scopes**: `projects:read`, `projects:write`, `chats:read`, `chats:write`

---

## Entity Relationships Summary

```
Company
  └─< Subscription >─ Plan
  └─< Invoice

User (admin)
  └─< Project
        └─< project_user >─ User (agent)
        └─< Chat
        │     └─< ChatMessage
        │     └─< ChatTransfer
        └─< Ticket
        │     └─< TicketMessage
        └─< KbCategory
        │     └─< KbArticle
        └─< TrainingDocument
        └─< AiSettingsVersion
        └─< Invitation
        └─< ContactForm

User
  └─ UserAvailabilitySetting
  └─ UserNotificationPreference
  └─< AppNotification
  └─< DeviceToken
  └─< ActivityLog
  └─< OAuthClient
```
