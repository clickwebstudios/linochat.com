# LinoChat — Documentation Index

> **SaaS live-chat platform.** AI-powered chat widget, smart ticketing, unified agent inbox, knowledge base, and Frubix CRM integration.

---

## How to Use These Docs in a Claude Session

Paste this at the start of any new session:

```
I'm working on LinoChat — a SaaS live-chat platform.
Backend: Laravel 11 / PHP 8.4 / MySQL / Sanctum auth / Pusher WebSocket.
Frontend: React 18 / Vite 6 / TypeScript / Tailwind CSS v4 / Zustand.
Mobile: React Native / Expo.
Please read docs/README.md and the relevant docs/ file before making changes.
```

Or use `/session` to load context automatically.

---

## Quick Module → File Map

| Module | Backend | Frontend pages | Key service |
|--------|---------|----------------|-------------|
| Auth / Invitations | `AuthController`, `InvitationController` | `pages/auth/`, `InviteAcceptPage` | — |
| Live Chat (agent) | `AgentController` | `pages/dashboards/AgentDashboard`, `ChatDetails` | — |
| Live Chat (widget) | `WidgetController` | `components/ChatWidget.tsx` | `AiChatService` |
| AI Chat | `AIChatController`, `AISettingsController` | `pages/dashboards/AdminDashboard` (AI tab) | `AiChatService` |
| Tickets | `TicketController`, `PublicTicketController` | `TicketDetails`, `PublicTicketPage` | `TicketService` |
| Knowledge Base | `KbController`, `HelpController` | `ArticleDetails`, `KnowledgeView` | `KbGeneratorService` |
| Training Docs | `TrainingDocumentController` | Inside KB section | — |
| Projects | `ProjectController` | `ProjectDetails` | — |
| Frubix CRM | `IntegrationsController`, `FrubixWebhookController` | Integrations tab | `FrubixService` |
| Notifications | `NotificationController` | `NotificationsPage` | `PushNotificationService` |
| OAuth 2.0 Provider | `OAuthController`, `OAuthClientController` | `pages/oauth/` | — |
| Superadmin | `SuperadminController`, `PlatformSettingsController` | `SuperadminDashboard` | — |
| Billing / Stripe | `BillingController`, `StripeWebhookController` | `BillingPage` | `StripeService` |
| Twilio Channels | `MessengerController`, `WhatsAppController`, `TwilioWebhookController` | `IntegrationsView` | `TwilioService`, `TwilioMessageService` |
| Token System | `BillingController` (topup) | `BillingPage` | `TokenService` |
| Contact Forms | `ContactFormController` | `PublicContactForm` | — |

---

## Key Facts Every Session Needs

### Stack
- **Backend**: Laravel 11, PHP 8.4, MySQL, Sanctum (API tokens), Pusher/Reverb (WebSocket)
- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS v4 (CSS-first, no `tailwind.config.js`), Radix UI, Zustand, React Router v7
- **Mobile**: React Native / Expo (in `mobile/`)
- **Package manager**: `pnpm` (frontend), `composer` (backend)
- **Icons**: Lucide React

### Authentication
- **Primary**: Laravel Sanctum (`auth:sanctum` middleware) — issues access + refresh tokens
- ~~**Exception**: `InvitationController::accept` uses JWT via tymon/jwt-auth~~ — fixed (H2 resolved), now uses Sanctum throughout. Run `composer remove tymon/jwt-auth && rm config/jwt.php` to finish cleanup.
- **OAuth 2.0 Provider**: Custom implementation for 3rd-party apps (Frubix) — `oauth:scope` middleware
- Token shape: `{ access_token, refresh_token, token_type: "bearer", expires_in: 3600 }`

### Multi-Tenancy / Company Isolation
- **Admin** user owns Projects → "company" = all projects owned by that admin
- **Agent** user is assigned to Projects via `project_user` pivot
- `User::getCompanyProjectIds()` — all project IDs for this user's company
- `User::resolveProjectIds(?companyId)` — superadmin can scope to a company
- `User::canAccessProject($project)` — company-isolated access check
- There is a `companies` table but it is lightly used; ownership flows through `projects.user_id`

### Real-Time (WebSocket)
- Pusher in production, Laravel Reverb for self-hosted
- Events in `app/Events/`: `MessageSent`, `ChatStatusUpdated`, `AgentTyping`, `AiTyping`, `HumanRequested`, `TransferRequested`, etc.
- Frontend uses `laravel-echo` + `pusher-js`

### Async Jobs
- Queue driver: `database` (default) — jobs stored in `jobs` table
- Supervisor runs `queue:work` and `reverb:start`
- Key jobs: `GenerateKbFromWebsiteJob`, `GenerateEmbeddingJob`, `AutoLearnFromChatJob`, `DailyAutoLearnJob`

### API Conventions
- All responses: `{ success: bool, data?: ..., message?: string, errors?: {...} }`
- Validation errors: `{ success: false, message: "Validation error", errors: {...} }` (HTTP 422)
- Auth errors: `{ success: false, message: "Unauthorized" }` (HTTP 403)
- Base URL: `/api/` (proxied by Nginx from frontend domain)

### Tailwind v4 Warning
- No `tailwind.config.js` — CSS-first config only
- Custom tokens go in CSS variables, not JS config

### API Client Warning
- `api.get()` in frontend does NOT accept a params object
- Build query strings into the URL: `api.get('/tickets?status=open&page=2')`

### Deploy Command
```bash
./scripts/deploy.sh   # from repo root on server
```
CI/CD: GitHub Actions on push to `master`.

---

## Documentation Files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Tech stack, directory structure, service topology |
| [data-models.md](data-models.md) | All DB tables, columns, relationships |
| [api-reference.md](api-reference.md) | Every API route with method, path, auth |
| [infrastructure.md](infrastructure.md) | Deploy, env vars, local dev, Nginx, Supervisor |
| [issues.md](issues.md) | Known bugs and inconsistencies (HIGH / MEDIUM / LOW) |
| [modules/chat.md](modules/chat.md) | Live chat — widget, agent inbox, AI, transfers |
| [modules/tickets.md](modules/tickets.md) | Ticket system — creation, assignment, escalation |
| [modules/kb.md](modules/kb.md) | Knowledge base — articles, categories, AI generation |
| [modules/auth.md](modules/auth.md) | Authentication, roles, agent invitation flow |
| [modules/frubix.md](modules/frubix.md) | Frubix CRM integration — OAuth, webhooks, appointments |
| [modules/twilio.md](modules/twilio.md) | Twilio subaccounts, channel activation (Messenger/WhatsApp), webhook routing |
| [modules/tokens.md](modules/tokens.md) | Token system, action types, costs, top-up packs, monthly cycle reset |
| [flows/widget-chat.md](flows/widget-chat.md) | End-to-end: visitor sends message → AI responds → agent takes over |
| [flows/ticket-creation.md](flows/ticket-creation.md) | End-to-end: ticket creation with emails, chat link, Frubix lead |
| [flows/agent-invite.md](flows/agent-invite.md) | End-to-end: admin invites agent → agent accepts → joins project |

### Deep Dives (architecture/)

| File | Contents |
|------|----------|
| [architecture/ai-chat-control-tokens.md](architecture/ai-chat-control-tokens.md) | Control token system — all tokens, detection methods, booking flow, why not function calling |
| [architecture/widget-loader.md](architecture/widget-loader.md) | Two widget files — which one to edit for customer-facing changes |
| [architecture/superadmin-impersonation.md](architecture/superadmin-impersonation.md) | Impersonation auth flow, 2h token, escalation guard, audit log |
| [architecture/realtime-presence.md](architecture/realtime-presence.md) | 30s active threshold, Reverb vs Pusher config, broadcast events |

---

## How to Keep Docs Current

| When you… | Update… |
|-----------|---------|
| Add a migration | `data-models.md` — new table or column |
| Add/change an API route | `api-reference.md` |
| Change a flow (emails, events, side effects) | `flows/<flow>.md` |
| Add a new feature area | `modules/<feature>.md` + update this index |
| Find a bug or inconsistency | `issues.md` — add with severity |
| Fix an issue | `issues.md` — mark as Resolved |
| Change deploy process | `infrastructure.md` |
