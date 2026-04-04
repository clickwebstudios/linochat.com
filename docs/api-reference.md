# API Reference

Base URL: `/api`  
All responses: `{ success: bool, data?, message?, errors? }`  
Auth header: `Authorization: Bearer {access_token}`

**Rate limits** are per IP per minute unless noted.

---

## Auth

| Method | Path | Auth | Rate | Notes |
|--------|------|------|------|-------|
| POST | `/auth/login` | — | 10/min | Body: `email, password` |
| POST | `/auth/register` | — | 10/min | Body: `first_name, last_name, email, password, password_confirmation, website, company_name` |
| POST | `/auth/google` | — | 10/min | Body: `credential` (Google ID token) |
| POST | `/auth/forgot-password` | — | 5/min | Body: `email` |
| POST | `/auth/reset-password` | — | 5/min | Body: `token, email, password, password_confirmation` |
| POST | `/auth/send-verification-code` | — | 5/min | Body: `email` |
| POST | `/auth/verify-email-code` | — | 5/min | Body: `email, code` |
| POST | `/auth/refresh` | — | 10/min | Body: `refresh_token` |
| POST | `/auth/logout` | Sanctum | — | Revokes all tokens |
| GET | `/auth/me` | Sanctum | — | Returns current user |
| PUT | `/auth/me` | Sanctum | — | Body: `first_name, last_name, phone, company, country, bio, location` |

---

## Health

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | — | Returns `{status: "ok", timestamp, service}` |

---

## Widget (Public — no auth, CORS open)

Widget identified by `widget_id` in URL path.

| Method | Path | Rate | Notes |
|--------|------|------|-------|
| GET | `/widget/{widget_id}/config` | 120/min | Widget appearance config |
| GET | `/widget/{widget_id}/status` | 120/min | Agent availability |
| GET/POST | `/widget/{widget_id}/init` | 120/min | Start or resume chat session |
| GET | `/widget/{widget_id}/messages` | 120/min | Fetch messages for session |
| GET/POST | `/widget/{widget_id}/heartbeat` | 120/min | Keep session alive |
| POST | `/widget/{widget_id}/page-view` | 120/min | Track page view |
| POST | `/widget/{widget_id}/message-feedback` | 120/min | Rate AI message |
| POST | `/widget/{widget_id}/typing` | 120/min | Customer typing indicator |
| POST | `/widget/{widget_id}/message` | 60/min | Send customer message (triggers AI) |
| POST | `/widget/{widget_id}/handover` | 60/min | Request human agent |
| POST | `/widget/{widget_id}/check-ticket-needed` | 60/min | AI decides if ticket should be created |
| POST | `/widget/{widget_id}/create-ticket` | 60/min | Submit contact form + create ticket |

**Widget assets** (no CORS restriction):
| GET | `/widget-assets/widget.js` | — | Embed script |
| GET | `/widget-assets/style.css` | — | Widget styles |

---

## Public Tickets (no auth — customer-facing)

| Method | Path | Rate | Notes |
|--------|------|------|-------|
| GET | `/public/tickets/{token}` | 15/min | View ticket by access token |
| POST | `/public/tickets/{token}/reply` | 15/min | Customer replies to ticket |

---

## Public Contact Forms (no auth)

| Method | Path | Rate | Notes |
|--------|------|------|-------|
| GET | `/public/contact-forms/{slug}` | 10/min | Get form definition |
| POST | `/public/contact-forms/{slug}/submit` | 10/min | Submit form |

---

## Help Center / KB (public)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/help/categories` | Published KB categories |
| GET | `/help/articles` | Published articles (with `?project_id=`) |
| GET | `/help/articles/{slug}` | Single article |
| POST | `/help/articles/{id}/feedback` | Body: `helpful: bool` |
| POST | `/help/search` | Body: `query, project_id` |

---

## Inbound Email (webhook)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/email/inbound` | Called by email provider (Postmark, Mailgun, etc.) |

---

## Agent Dashboard (Sanctum auth, prefix `/agent`)

### Chats

| Method | Path | Notes |
|--------|------|-------|
| GET | `/agent/chats` | Query: `status` (active/mine/unassigned/closed), `company_id` |
| GET | `/agent/chats/{chat_id}` | Single chat with messages |
| GET | `/agent/chats/{chat_id}/activity` | Customer history (prev chats, tickets, session info) |
| POST | `/agent/chats/{chat_id}/take` | Self-assign chat |
| POST | `/agent/chats/{chat_id}/message` | Send message (supports file attachments) |
| POST | `/agent/chats/{chat_id}/messages` | Alias of above |
| POST | `/agent/chats/{chat_id}/close` | Close chat |
| POST | `/agent/chats/{chat_id}/typing` | Typing indicator |
| POST | `/agent/chats/{chat_id}/mark-read` | Mark customer messages as read |
| POST | `/agent/chats/{id}/toggle-ai` | Enable/disable AI for chat. Body: `ai_enabled?: bool` |
| GET | `/agent/stats` | Active chats, unassigned, closed today |

### Tickets

| Method | Path | Notes |
|--------|------|-------|
| GET | `/agent/tickets` | Query: `status`, `priority`, `assigned_to` (me/unassigned), `customer_email`, `per_page`, `company_id` |
| POST | `/agent/tickets` | Create ticket |
| GET | `/agent/tickets/volume` | Last 7 days ticket volume (chart data) |
| GET | `/agent/tickets/stats` | Counts by status |
| GET | `/agent/tickets/{ticket_id}` | Single ticket with messages |
| PUT | `/agent/tickets/{ticket_id}` | Update subject, description, priority, category |
| POST | `/agent/tickets/{ticket_id}/take` | Self-assign (unassigned tickets only) |
| POST | `/agent/tickets/{ticket_id}/assign` | Body: `agent_id` (null to unassign) |
| POST | `/agent/tickets/{ticket_id}/escalate` | Body: `escalate_to, reason?` |
| POST | `/agent/tickets/{ticket_id}/status` | Body: `status` |
| POST | `/agent/tickets/{ticket_id}/reply` | Body: `message, send_email?` |
| DELETE | `/agent/tickets/{ticket_id}` | Owner/superadmin only |
| POST | `/agent/tickets/{ticketId}/frubix-lead` | Manually push ticket to Frubix CRM |

### Agents & Teams

| Method | Path | Notes |
|--------|------|-------|
| GET | `/agent/users` | All agents + pending invitations |
| POST | `/agent/invitations` | Invite agent. Body: `email, first_name?, last_name?, role?, project_ids[]` |
| POST | `/agent/invitations/{id}/resend` | Resend invitation email |

### Chat Transfers

| Method | Path | Notes |
|--------|------|-------|
| GET | `/agent/transfer-requests` | Pending transfer requests |
| POST | `/agent/transfer-requests` | Initiate transfer |
| POST | `/agent/transfer-requests/{id}/accept` | Accept transfer |
| POST | `/agent/transfer-requests/{id}/reject` | Reject transfer |
| GET | `/agent/pending-handovers` | Chats waiting for human agent |

---

## Dashboard (Sanctum auth, prefix `/dashboard`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/dashboard/stats` | Overview stats |
| GET | `/dashboard/ticket-volume` | Ticket volume chart data |

---

## Projects (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects` | Query: `type` (all/owned/assigned), `company_id` |
| POST | `/projects/analyze` | Body: `url` — analyze website before creating project |
| POST | `/projects` | Create project |
| GET | `/projects/{project_id}` | Single project |
| PUT | `/projects/{project_id}` | Update project |
| DELETE | `/projects/{project_id}` | Owner/superadmin only |
| GET | `/projects/{project_id}/agents` | Project agents + owner |
| DELETE | `/projects/{project_id}/agents/{agent_id}` | Remove agent (owner only) |
| GET | `/projects/{project_id}/tickets` | Project tickets |
| GET | `/projects/{project_id}/chats` | Project chats |
| GET | `/projects/{project_id}/activities` | Recent activity feed |

---

## Widget Settings (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/{project_id}/widget-settings` | Get widget config |
| PUT | `/projects/{project_id}/widget-settings` | Update widget config |
| DELETE | `/projects/{project_id}/widget-settings` | Reset to defaults |
| GET | `/projects/{project_id}/embed-code` | Get embed code snippet |
| POST | `/projects/{project_id}/verify-widget` | Check widget is installed on site |

---

## AI Settings (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/{project_id}/ai-settings` | Current AI config |
| PUT | `/projects/{project_id}/ai-settings/draft` | Save draft (not published) |
| POST | `/projects/{project_id}/ai-settings/publish` | Publish settings + create version |
| GET | `/projects/{project_id}/ai-settings/versions` | Version history |
| POST | `/projects/{project_id}/ai-settings/restore/{version_id}` | Restore a version |
| POST | `/projects/{project_id}/ai-settings/generate-prompt` | AI-generates system prompt |
| GET | `/projects/{project_id}/ai-stats` | AI usage stats |

---

## Knowledge Base (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/{project_id}/kb/categories` | All categories |
| POST | `/projects/{project_id}/kb/categories` | Create category |
| GET | `/projects/{project_id}/kb/categories/{category_id}/articles` | Articles in category |
| POST | `/projects/{project_id}/kb/categories/{category_id}/articles` | Create article |
| POST | `/projects/{project_id}/kb/categories/{category_id}/generate-article` | AI-generate article |
| GET | `/projects/{project_id}/kb/articles` | All articles |
| GET | `/projects/{project_id}/kb/articles/{article_id}` | Single article |
| GET | `/kb/articles/{article_id}` | Single article by ID (no project scope) |
| PUT | `/projects/{project_id}/kb/articles/{article_id}` | Update article |
| DELETE | `/projects/{project_id}/kb/articles/{article_id}` | Delete article |
| POST | `/projects/{project_id}/kb/generate` | Trigger full KB generation from website |
| GET | `/projects/{project_id}/kb/generation-status` | Check generation job status |
| DELETE | `/projects/{project_id}/kb/ai-articles` | Delete all AI-generated articles |
| POST | `/projects/{project_id}/kb/search` | Semantic/keyword search |

---

## Training Documents (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/{project_id}/training-documents` | List training docs |
| POST | `/projects/{project_id}/training-documents` | Upload training doc |
| DELETE | `/projects/{project_id}/training-documents/{doc_id}` | Delete training doc |

---

## Invitations (mixed auth)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/invitations/{token}` | — | Get invitation details |
| POST | `/invitations/{token}/accept` | — | Accept + create account |
| POST | `/invitations/{token}/reject` | — | Decline invitation |
| POST | `/projects/{project_id}/invitations` | Sanctum | Send invitation (project owner only) |
| GET | `/projects/{project_id}/invitations` | Sanctum | List project invitations |
| DELETE | `/invitations/{invitation_id}` | Sanctum | Cancel invitation |

---

## Notifications (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/notifications` | Paginated notifications |
| PUT | `/notifications/{notification}/read` | Mark single as read |
| POST | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/log` | Notification send log |
| GET | `/activity-log` | Activity log |

---

## Settings (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/settings/notifications` | User notification preferences |
| PUT | `/settings/notifications` | Update preferences |

---

## Device Tokens / Push (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/devices/register` | Body: `token, platform` |
| POST | `/devices/unregister` | Body: `token` |

---

## Contact Forms (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/contact-forms` | List all contact forms |
| POST | `/contact-forms` | Create contact form |
| GET | `/contact-forms/{id}` | Single contact form |
| PUT | `/contact-forms/{id}` | Update contact form |
| DELETE | `/contact-forms/{id}` | Delete contact form |

---

## Integrations (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects/{projectId}/integrations` | Integration configs |
| GET | `/projects/{projectId}/integrations/frubix/authorize` | Get Frubix OAuth URL |
| GET | `/projects/{projectId}/integrations/frubix/clients` | Frubix clients list |
| GET | `/projects/{projectId}/integrations/frubix/schedule` | Frubix appointments |
| POST | `/projects/{projectId}/integrations/frubix/schedule` | Create appointment |
| PATCH | `/projects/{projectId}/integrations/frubix/schedule/{appointmentId}` | Update appointment |
| DELETE | `/projects/{projectId}/integrations/frubix` | Disconnect Frubix |
| POST | `/integrations/frubix/callback` | OAuth callback (redirected from Frubix) |

---

## AI Chat (Public, rate limited)

| Method | Path | Rate | Notes |
|--------|------|------|-------|
| POST | `/ai/chat` | 60/min | Widget AI chat entry point |
| GET | `/ai/model` | — | Current model info |
| GET | `/ai/rate-limit` | — | Rate limit status |

---

## Webhooks (Public, signature-verified)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/webhooks/frubix` | Frubix event webhooks (verified by signature) |

---

## Superadmin (Sanctum auth, `superadmin` role required)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/superadmin/companies` | All companies |
| GET | `/superadmin/companies/{companyId}` | Company details |
| PUT | `/superadmin/companies/{companyId}` | Update company |
| DELETE | `/superadmin/companies/{companyId}` | Delete company |
| GET | `/superadmin/companies/{companyId}/chats` | |
| GET | `/superadmin/companies/{companyId}/projects` | |
| GET | `/superadmin/companies/{companyId}/agents` | |
| GET | `/superadmin/companies/{companyId}/tickets` | |
| POST | `/superadmin/companies/{companyId}/invite` | Invite to company |
| GET | `/superadmin/companies/{companyId}/invitations` | |
| GET | `/superadmin/dashboard-stats` | Platform overview |
| GET | `/superadmin/stats` | Platform stats |
| GET | `/superadmin/chats` | All chats |
| GET | `/superadmin/projects` | All projects |
| POST | `/superadmin/projects` | Create project |
| GET | `/superadmin/projects/{projectId}` | |
| GET | `/superadmin/agents` | All agents |
| GET | `/superadmin/agents/{agentId}` | |
| PUT | `/superadmin/agents/{agentId}` | |
| DELETE | `/superadmin/agents/{agentId}` | |
| POST | `/superadmin/agents/invite` | |
| GET | `/superadmin/live-visitors` | Real-time visitor count |
| GET | `/superadmin/analytics/overview` | |
| GET | `/superadmin/platform-settings/{key}` | |
| PUT | `/superadmin/platform-settings/{key}` | |
| GET | `/superadmin/ai-usage-stats` | |
| POST | `/superadmin/impersonate/{userId}` | Impersonate user |

---

## OAuth 2.0 Provider

### Authorization Flow (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/oauth/authorize` | Show consent page data |
| POST | `/oauth/authorize` | Approve or deny |
| GET | `/oauth/scopes` | Available scopes list |

### Token Endpoints

| Method | Path | Rate | Notes |
|--------|------|------|-------|
| POST | `/oauth/token` | 30/min | Exchange code for token |
| POST | `/oauth/revoke` | — | Revoke token |

### Client Management (Sanctum auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/oauth/clients` | List user's OAuth clients |
| POST | `/oauth/clients` | Register new client |
| GET | `/oauth/clients/{client}` | Get client |
| PUT | `/oauth/clients/{client}` | Update client |
| POST | `/oauth/clients/{client}/rotate-secret` | Rotate client secret |
| DELETE | `/oauth/clients/{client}` | Delete client |

---

## OAuth V1 API (3rd-party apps via Bearer token)

Middleware: `oauth:{scope}` — validates Bearer token + required scope.

| Method | Path | Scope | Notes |
|--------|------|-------|-------|
| GET | `/v1/projects` | `projects:read` | |
| GET | `/v1/projects/{id}` | `projects:read` | |
| GET | `/v1/chats` | `chats:read` | |
| GET | `/v1/chats/{chatId}` | `chats:read` | |
| POST | `/v1/chats/{chatId}/message` | `chats:write` | |
| POST | `/v1/chats/{chatId}/typing` | `chats:write` | |
| POST | `/v1/chats/{chatId}/toggle-ai` | `chats:write` | |
| POST | `/v1/chats/{chatId}/suggest-replies` | `chats:read` | |
| POST | `/v1/projects/{projectId}/frubix-connect` | `projects:write` | |
| POST | `/v1/projects/{projectId}/frubix-disconnect` | `projects:write` | |
| POST | `/v1/projects/{projectId}/agent-status` | `projects:write` | |
