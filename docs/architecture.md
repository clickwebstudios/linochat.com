# Architecture

## Overview

LinoChat is a multi-tenant SaaS customer support platform. A single deployment serves multiple companies ("admin" users), each with their own projects, agents, chats, and knowledge base.

```
┌─────────────────────────────────────────────────────────┐
│  linochat.com  (same-domain setup)                      │
│                                                          │
│  /           → frontend/dist (React SPA)                │
│  /api/*      → backend/public (Laravel API)             │
│  /storage/*  → uploaded files                           │
└─────────────────────────────────────────────────────────┘
         │                          │
    Sanctum tokens             Pusher / Reverb
    (access + refresh)         (WebSocket events)
         │                          │
┌────────▼──────────┐    ┌──────────▼──────────┐
│   MySQL Database  │    │   Queue Workers      │
│   (primary store) │    │   (Supervisor)       │
└───────────────────┘    │   - queue:work       │
                         │   - reverb:start     │
                         └─────────────────────┘
```

## Directory Structure

```
linochat.com/
├── backend/                    Laravel 11 API
│   ├── app/
│   │   ├── Enums/              TicketStatus, TicketPriority, ChatStatus, UserRole, InvitationStatus
│   │   ├── Events/             Pusher/Reverb broadcast events (13 events)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ 32 controllers
│   │   │   ├── Middleware/      ForceJsonResponse, WidgetCors*, OAuthTokenAuth, ValidateWidgetDomain
│   │   │   ├── Requests/        Form requests (Auth/, Ticket/, Project/, Agent/, Invitation/)
│   │   │   └── Resources/       API resources (11 transformers)
│   │   ├── Jobs/               Async: KB generation, embeddings, auto-learn
│   │   ├── Mail/               9 transactional email classes
│   │   ├── Models/             31 Eloquent models
│   │   ├── Observers/          ChatObserver, KbArticleObserver
│   │   ├── Policies/           TicketPolicy, ProjectPolicy, ChatPolicy
│   │   ├── Providers/          AppServiceProvider, BroadcastServiceProvider
│   │   └── Services/           7 services (AiChat, Frubix, KbGenerator, Invitation, Ticket, etc.)
│   ├── database/
│   │   ├── migrations/         ~55 migrations
│   │   └── seeders/            10 seeders
│   └── routes/
│       └── api.php             384 lines, all routes
│
├── frontend/                   React 18 + Vite 6 SPA
│   └── src/app/
│       ├── api/                axios client (client.ts — handles auth + refresh)
│       ├── components/         ~40 shared components + ui/ (shadcn-style)
│       ├── hooks/              Custom React hooks
│       ├── pages/              Route-level pages
│       │   ├── auth/           Login, Register, ForgotPassword, InviteAccept
│       │   ├── dashboards/     AgentDashboard, AdminDashboard, SuperadminDashboard
│       │   ├── customer/       PublicTicket, PublicContactForm
│       │   ├── marketing/      Landing pages (SSG pre-rendered)
│       │   └── oauth/          OAuth consent page
│       ├── services/           API service layer (thin axios wrappers)
│       ├── stores/             Zustand stores (auth, projects, humanRequested, transferRequests)
│       └── types/              TypeScript types
│
├── mobile/                     React Native / Expo
│   ├── app/                    Expo Router pages
│   ├── components/
│   └── lib/
│
├── docs/                       This documentation
├── scripts/
│   └── deploy.sh               Manual deploy script
└── DEPLOY.md                   Deployment guide
```

## Tech Stack

### Backend

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Laravel 11 | PHP 8.4 |
| Auth | Sanctum | Access + refresh token pair |
| Auth (legacy path) | tymon/jwt-auth | Only used in `InvitationController::accept` |
| Database | MySQL | In dev: SQLite supported |
| Queue | Laravel Queue (database driver) | Redis optional |
| WebSocket | Pusher OR Laravel Reverb | Configured via `BROADCAST_CONNECTION` |
| Email | Resend (default), SMTP, Mailgun, SES | Via `MAIL_MAILER` |
| AI | OpenAI SDK | GPT-4o-mini default, configurable per project |
| Push Notifications | FCM (via `PushNotificationService`) | Device tokens in `device_tokens` table |
| OAuth 2.0 Provider | Custom implementation | For 3rd-party app access (Frubix) |

### Frontend

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18 | TypeScript strict mode |
| Build | Vite 6 | |
| Routing | React Router v7 | |
| Styling | Tailwind CSS v4 | CSS-first — no tailwind.config.js |
| UI primitives | Radix UI (full suite) | shadcn/ui pattern |
| Icons | Lucide React | |
| State management | Zustand | 4 stores |
| HTTP client | axios | Token refresh in `api/client.ts` |
| WebSocket client | laravel-echo + pusher-js | |
| Forms | react-hook-form + zod | |
| Charts | Recharts | |
| Toasts | Sonner | |
| SSG | react-snap | Marketing pages only (`/`, `/features`, `/pricing`, etc.) |
| Testing | Vitest (unit), Playwright (e2e) | |
| Package manager | pnpm | |

## Multi-Tenancy Model

```
Company (= Admin user's organization)
  └── Admin User (role: admin) ← owns projects
        ├── Project A  ─── Agents (role: agent, via project_user pivot)
        │     ├── Chats
        │     ├── Tickets
        │     └── KB Articles
        └── Project B  ─── Agents
              ├── Chats
              ├── Tickets
              └── KB Articles
```

Key points:
- "Company isolation" is implemented via `projects.user_id` — all data scoped to the admin who owns the project
- There is a `companies` table but it's lightly used; the admin user IS effectively the company
- Cross-company access is blocked: an agent assigned to Company A cannot see Company B data
- Superadmin role bypasses all company isolation

## Service Layer

| Service | Responsibility |
|---------|---------------|
| `AiChatService` | AI response generation, KB context retrieval, reply suggestions, control token parsing |
| `TicketService` | Create ticket with all side-effects (emails, activity log, Frubix lead, chat system message) |
| `InvitationService` | Create and resend agent invitations (deduplicates code between 2 controllers) |
| `KbGeneratorService` | AI-powered KB article generation from website analysis |
| `WebsiteAnalyzerService` | Scrape and analyze a website URL for project setup |
| `FrubixService` | Frubix CRM API client (static methods) — leads, appointments, messages |
| `PushNotificationService` | FCM push notification delivery |

## Policies (Authorization)

| Policy | Model | Gates |
|--------|-------|-------|
| `TicketPolicy` | `Ticket` | view, update, reply, escalate, assign, delete |
| `ProjectPolicy` | `Project` | view, manage |
| `ChatPolicy` | `Chat` | view, sendMessage, close, toggleAi |

Used via `$user->can('view', $ticket)` — preserves existing 403 response format.
Auto-discovered by Laravel (no manual registration needed).
