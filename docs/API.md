# LinoChat API Documentation

Base URL: `https://linochat.com/api`

Authentication: Bearer token via `Authorization: Bearer {access_token}` header.
All endpoints require authentication unless marked 🌐 (public).

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Login with Google OAuth token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke token) |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/me` | Update profile |
| POST | `/auth/send-verification-code` | Send email verification code |
| POST | `/auth/verify-email-code` | Verify email with code |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

**Rate limits:** Login/register: 10/min. Password reset: 5/min.

---

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects (owned + assigned) |
| POST | `/projects` | Create project |
| POST | `/projects/analyze` | Analyze website for project setup |
| GET | `/projects/{id}` | Get project details |
| PUT | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/activities` | Project activity timeline |
| GET | `/projects/{id}/agents` | List project agents |
| DELETE | `/projects/{id}/agents/{agent_id}` | Remove agent from project |
| POST | `/projects/{id}/invitations` | Invite agent to project |
| GET | `/projects/{id}/invitations` | List pending invitations |
| GET | `/projects/{id}/chats` | List project chats |
| GET | `/projects/{id}/tickets` | List project tickets |

---

## Widget Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/widget-settings` | Get widget settings (appearance, schedule, popover) |
| PUT | `/projects/{id}/widget-settings` | Update widget settings |
| DELETE | `/projects/{id}/widget-settings` | Reset to defaults |
| GET | `/projects/{id}/embed-code` | Get embed code snippet |
| POST | `/projects/{id}/verify-widget` | Verify widget is installed on website |

---

## AI Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/ai-settings` | Get live + draft AI settings |
| PUT | `/projects/{id}/ai-settings/draft` | Auto-save draft |
| POST | `/projects/{id}/ai-settings/publish` | Publish draft to live |
| GET | `/projects/{id}/ai-settings/versions` | List version history |
| POST | `/projects/{id}/ai-settings/restore/{version_id}` | Restore version as draft |
| POST | `/projects/{id}/ai-settings/generate-prompt` | AI-generate system prompt from description/URL |
| GET | `/projects/{id}/ai-stats` | AI performance metrics |

---

## Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/kb/categories` | List KB categories |
| POST | `/projects/{id}/kb/categories` | Create category |
| GET | `/projects/{id}/kb/categories/{cat_id}/articles` | List articles in category |
| POST | `/projects/{id}/kb/categories/{cat_id}/articles` | Create article |
| POST | `/projects/{id}/kb/categories/{cat_id}/generate-article` | AI-generate single article |
| GET | `/projects/{id}/kb/articles` | List all articles |
| GET | `/projects/{id}/kb/articles/{article_id}` | Get article |
| PUT | `/projects/{id}/kb/articles/{article_id}` | Update article |
| DELETE | `/projects/{id}/kb/articles/{article_id}` | Delete article |
| DELETE | `/projects/{id}/kb/ai-articles` | Delete all AI-generated articles |
| POST | `/projects/{id}/kb/generate` | Generate KB from website (async) |
| GET | `/projects/{id}/kb/generation-status` | Check generation status |
| POST | `/projects/{id}/kb/search` | Search articles |
| GET | `/kb/articles/{article_id}` | Get article by ID (public) |

---

## Training Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/training-documents` | List uploaded documents |
| POST | `/projects/{id}/training-documents` | Upload document (max 10MB, PDF/DOC/TXT/CSV) |
| DELETE | `/projects/{id}/training-documents/{doc_id}` | Delete document |

---

## Agent Dashboard

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/chats` | List all chats |
| GET | `/agent/chats/{chat_id}` | Get chat details |
| GET | `/agent/chats/{chat_id}/activity` | Chat activity (metadata, history) |
| POST | `/agent/chats/{chat_id}/message` | Send message as agent |
| POST | `/agent/chats/{chat_id}/take` | Take over chat from AI |
| POST | `/agent/chats/{chat_id}/close` | Close chat |
| POST | `/agent/chats/{chat_id}/mark-read` | Mark messages as read |
| POST | `/agent/chats/{chat_id}/typing` | Send typing indicator |
| POST | `/agent/chats/{id}/toggle-ai` | Toggle AI on/off for chat |
| GET | `/agent/pending-handovers` | List chats waiting for human |
| GET | `/agent/stats` | Agent dashboard stats |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/tickets` | List tickets |
| POST | `/agent/tickets` | Create ticket |
| GET | `/agent/tickets/{id}` | Get ticket |
| PUT | `/agent/tickets/{id}` | Update ticket |
| DELETE | `/agent/tickets/{id}` | Delete ticket |
| POST | `/agent/tickets/{id}/assign` | Assign to agent |
| POST | `/agent/tickets/{id}/take` | Take ticket |
| POST | `/agent/tickets/{id}/escalate` | Escalate ticket |
| POST | `/agent/tickets/{id}/reply` | Reply to ticket |
| POST | `/agent/tickets/{id}/status` | Update status |
| POST | `/agent/tickets/{id}/frubix-lead` | Create Frubix lead from ticket |
| GET | `/agent/tickets/stats` | Ticket statistics |
| GET | `/agent/tickets/volume` | Ticket volume data |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/transfer-requests` | List transfer requests |
| POST | `/agent/transfer-requests` | Create transfer request |
| POST | `/agent/transfer-requests/{id}/accept` | Accept transfer |
| POST | `/agent/transfer-requests/{id}/reject` | Reject transfer |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent/users` | List users/agents |
| POST | `/agent/invitations` | Invite agent |

---

## Widget (Public — No Auth)

Used by the embedded chat widget on customer websites.

| Method | Endpoint | Description |
|--------|----------|-------------|
| 🌐 GET | `/widget/{widget_id}/config` | Get widget configuration (supports JSONP) |
| 🌐 GET/POST | `/widget/{widget_id}/init` | Initialize or resume chat |
| 🌐 GET/POST | `/widget/{widget_id}/message` | Send customer message |
| 🌐 GET | `/widget/{widget_id}/messages` | Get chat messages |
| 🌐 GET/POST | `/widget/{widget_id}/heartbeat` | Customer heartbeat (every 15s) |
| 🌐 POST | `/widget/{widget_id}/page-view` | Track page navigation |
| 🌐 POST | `/widget/{widget_id}/typing` | Customer typing indicator |
| 🌐 POST | `/widget/{widget_id}/handover` | Request human agent |
| 🌐 POST | `/widget/{widget_id}/create-ticket` | Submit contact info + create ticket |
| 🌐 POST | `/widget/{widget_id}/check-ticket-needed` | Check if ticket should be created |
| 🌐 GET | `/widget/{widget_id}/status` | Get agent online status |
| 🌐 POST | `/widget/{widget_id}/message-feedback` | Submit 👍/👎 feedback on AI message |

**Rate limits:** Read: 120/min. Messages: 60/min.

---

## Integrations (Frubix)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/integrations` | Get integration settings |
| GET | `/projects/{id}/integrations/frubix/authorize` | Get OAuth authorization URL |
| 🌐 POST | `/integrations/frubix/callback` | OAuth callback (public) |
| GET | `/projects/{id}/integrations/frubix/clients` | Search Frubix clients |
| GET | `/projects/{id}/integrations/frubix/schedule` | Get Frubix schedule |
| POST | `/projects/{id}/integrations/frubix/schedule` | Create appointment |
| PATCH | `/projects/{id}/integrations/frubix/schedule/{appt_id}` | Update appointment |
| DELETE | `/projects/{id}/integrations/frubix` | Disconnect Frubix |

---

## Webhooks (Public — Verified by Signature)

| Method | Endpoint | Description |
|--------|----------|-------------|
| 🌐 POST | `/webhooks/frubix` | Frubix event webhook (X-Frubix-Signature) |
| 🌐 POST | `/email/inbound` | Inbound email webhook (secret param) |

---

## Superadmin

All endpoints require `auth:sanctum` + superadmin role.

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/companies` | List all companies |
| GET | `/superadmin/companies/{id}` | Company details |
| PUT | `/superadmin/companies/{id}` | Update company |
| DELETE | `/superadmin/companies/{id}` | Delete company |
| GET | `/superadmin/companies/{id}/projects` | Company projects |
| GET | `/superadmin/companies/{id}/agents` | Company agents |
| GET | `/superadmin/companies/{id}/chats` | Company chats |
| GET | `/superadmin/companies/{id}/tickets` | Company tickets |
| GET | `/superadmin/companies/{id}/invitations` | Company invitations |
| POST | `/superadmin/companies/{id}/invite` | Invite to company |

### Platform
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/dashboard-stats` | Dashboard statistics |
| GET | `/superadmin/stats` | Platform-wide stats |
| GET | `/superadmin/live-visitors` | Live visitors across all projects |
| GET | `/superadmin/chats` | All chats |
| GET | `/superadmin/projects` | All projects |
| POST | `/superadmin/projects` | Create project (any company) |
| GET | `/superadmin/agents` | All agents |
| POST | `/superadmin/impersonate/{userId}` | Impersonate user (audit logged) |

### Pricing & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/platform-settings/{key}` | Get platform setting |
| PUT | `/superadmin/platform-settings/{key}` | Update platform setting |
| GET | `/superadmin/ai-usage-stats` | AI usage & cost stats |

---

## Invitations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invitations/{token}` | Get invitation details |
| POST | `/invitations/{token}/accept` | Accept invitation |
| POST | `/invitations/{token}/reject` | Reject invitation |
| DELETE | `/invitations/{id}` | Cancel invitation |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| PUT | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/log` | Notification log |

---

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/notifications` | Get notification preferences |
| PUT | `/settings/notifications` | Update notification preferences |
| GET | `/activity-log` | User activity log |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/dashboard/ticket-volume` | Ticket volume chart data |

---

## OAuth 2.0 Provider

LinoChat acts as an OAuth 2.0 provider (for Frubix and other integrations).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth/authorize` | Authorization form |
| POST | `/oauth/authorize` | Approve authorization |
| POST | `/oauth/token` | Exchange code for token |
| POST | `/oauth/revoke` | Revoke token |
| GET | `/oauth/clients` | List OAuth clients |
| POST | `/oauth/clients` | Create client |
| GET | `/oauth/clients/{id}` | Get client |
| PUT | `/oauth/clients/{id}` | Update client |
| DELETE | `/oauth/clients/{id}` | Delete client |
| POST | `/oauth/clients/{id}/rotate-secret` | Rotate client secret |
| GET | `/oauth/scopes` | List available scopes |

---

## Public Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| 🌐 GET | `/public/tickets/{token}` | View ticket by public token |
| 🌐 POST | `/public/tickets/{token}/reply` | Reply to ticket |

---

## Health & Debug

| Method | Endpoint | Description |
|--------|----------|-------------|
| 🌐 GET | `/health` | Health check |
| GET | `/debug/token` | Debug auth token (local only) |
| GET | `/debug/auth-test` | Test authentication (local only) |

---

*Total endpoints: 130+*
*Generated: 2026-03-23*
