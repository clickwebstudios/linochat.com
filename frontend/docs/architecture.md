# LinoChat - Component Tree & Route Map

## Route Map (`/src/app/App.tsx`)

### Marketing Site (public)

| Route | Component | Layout |
|---|---|---|
| `/` | `HomePage` | `MarketingHeader` + `MarketingFooter` + `ChatWidget` |
| `/features` | `FeaturesPage` | same |
| `/pricing` | `PricingPage` | same |
| `/resources` | `ResourcesPage` | same |
| `/about` | `AboutPage` | same |
| `/contact` | `ContactPage` | same |

### Auth

| Route | Component |
|---|---|
| `/login` | `Login` |
| `/signup` | `Signup` |
| `/forgot-password` | `ForgotPassword` |

### Agent / Admin Dashboard (Layout: `AgentAdminLayout`)

All agent/admin routes render inside `AgentAdminLayout.tsx` which provides the sidebar (`AdminSidebar`) + `<Outlet>`. The sidebar uses `<Link>` with `useLocation`-based active state highlighting. Pages keep their own headers and use `LayoutContext` (`toggleMobileSidebar`) for mobile sidebar control.

| Route | Component | Notes |
|---|---|---|
| `/agent/dashboard` | `AgentDashboard` | |
| `/agent/chats` | `AgentDashboard` | |
| `/agent/tickets` | `AgentDashboard` | |
| `/agent/knowledge` | `AgentDashboard` | |
| `/agent/projects` | `AgentDashboard` | Admin-only |
| `/agent/users` | `AgentDashboard` | Admin-only |
| `/agent/reports` | `AgentDashboard` | Admin-only |
| `/agent/integrations` | `AgentDashboard` | Admin-only |
| `/admin/*` | same as `/agent/*` | Admin routes mirror agent routes |
| `/agent/project/:projectId` | `ProjectDetails` | |
| `/agent/profile-settings` | `ProfileSettings` | Profile menu |
| `/agent/billing` | `BillingPage` | Profile menu → Billing |
| `/agent/notifications` | `NotificationsPage` | Notification bell / "View all" link |
| `/agent/knowledge/article/:articleId` | `ArticleDetails` | Context-aware nav (agent prefix) |
| `/admin/ai-article-generator` | `AIArticleGenerator` | |
| `/admin/create-article` | `CreateArticle` | |
| `/admin/knowledge/article/:articleId` | `ArticleDetails` | |
| `/admin/profile-settings` | `ProfileSettings` | Profile menu |
| `/admin/billing` | `BillingPage` | Profile menu → Billing |
| `/admin/notifications` | `NotificationsPage` | Notification bell / "View all" link |

### Superadmin Dashboard (Layout: `SuperadminLayout`)

All superadmin routes render inside `SuperadminLayout.tsx` which provides the dark sidebar (`SuperadminSidebar`) + `<Outlet>`. The sidebar uses `<Link>` with `useLocation`-based active state. Pages keep their own headers and use `LayoutContext` (`toggleMobileSidebar`) for mobile sidebar control.

| Route | Component | Notes |
|---|---|---|
| `/superadmin/dashboard` | `SuperadminDashboard` | Overview section |
| `/superadmin/chats` | `SuperadminDashboard` | Chat section |
| `/superadmin/companies` | `SuperadminDashboard` | Company list + internal company detail view |
| `/superadmin/projects` | `SuperadminDashboard` | Project management (route exists but removed from sidebar) |
| `/superadmin/team` | `SuperadminDashboard` | Team/user management |
| `/superadmin/plans` | `SuperadminDashboard` | Plan pricing configuration (maps to `activeSection='settings'`) |
| `/superadmin/analytics` | `SuperadminDashboard` | Analytics charts |
| `/superadmin/logs` | `SuperadminDashboard` | System log viewer |

### Superadmin Detail Pages (Layout: `SuperadminLayout`)

| Route | Component | Reached from |
|---|---|---|
| `/superadmin/company/:companyId` | `CompanyDetails` | Legacy route (now internal via `viewingCompanyId` state) |
| `/superadmin/project/:projectId` | `ProjectDetails` | Projects table row click |
| `/superadmin/agent/:agentId` | `SuperadminAgentDetails` | Agents table row click |
| `/superadmin/user/:userId` | `UserDetails` | Team table row click |
| `/superadmin/chats/:chatId` | `ChatDetails` | Company detail chat row click |
| `/superadmin/tickets/:ticketId` | `TicketDetails` | Company detail ticket row click |
| `/superadmin/create-article` | `SuperadminCreateArticle` | Company detail KB tab "New Article" button |
| `/superadmin/notifications` | `NotificationsPage` | Notification bell |
| `/superadmin/profile-settings` | `SuperadminProfileSettings` | Profile menu |
| `/superadmin/billing` | `BillingPage` | Profile menu → Billing |

### Knowledge Base (Agent/Admin)

| Route | Component |
|---|---|
| `/agent/knowledge/article/:articleId` | `ArticleDetails` |
| `/admin/ai-article-generator` | `AIArticleGenerator` |
| `/admin/create-article` | `CreateArticle` |
| `/admin/knowledge/article/:articleId` | `ArticleDetails` |

### Customer-Facing

| Route | Component |
|---|---|
| `/help` | `HelpCenter` |

### Legacy Redirects

| Route | Redirects to |
|---|---|
| `/dashboard/agent`, `/agent-dashboard` | `/agent/dashboard` |
| `/dashboard/admin`, `/admin-dashboard` | `/admin/dashboard` |
| `/dashboard/superadmin`, `/superadmin-dashboard` | `/superadmin/dashboard` |
| `/ai-article-generator` | `/admin/ai-article-generator` |
| `/create-article` | `/admin/create-article` |
| `/knowledge/article/:articleId` | Detected route, redirected appropriately |

### Catch-all

| Route | Behavior |
|---|---|
| `*` | `<Navigate to="/" />` |

---

## Component Tree

```
App (BrowserRouter + HelmetProvider)
|
+-- Marketing Pages
|   +-- MarketingHeader ---------- shared nav bar
|   +-- MarketingFooter ---------- shared footer
|   +-- ChatWidget --------------- floating chat bubble (motion/react)
|   +-- SEOHead ------------------ per-page meta (react-helmet-async)
|
+-- AgentAdminLayout ------------- layout route (sidebar + Outlet)
|   +-- AdminSidebar ------------- sidebar nav, uses <Link> + useLocation active state
|   |                                Role-gated: Agent sees Dashboard, Chats, Tickets, Knowledge
|   |                                Admin additionally sees: Projects, Users, Reports, Integrations
|   +-- <Outlet> ----------------- renders matched child route component
|   +-- AgentDashboard ----------- self-contained section-based page
|   |   +-- ProjectSelector ------ top-left project picker dropdown (uses mockProjects)
|   |   +-- Extracted view components (in /components/agent-dashboard/):
|   |   |   +-- DashboardView ---- stat cards, recent chats/tickets, team overview
|   |   |   +-- ChatsView -------- split-panel chat list + conversation thread
|   |   |   +-- TicketsView ------ ticket list with filters, search, project filter
|   |   |   +-- AgentKnowledgeView knowledge base article list + management
|   |   |   |   +-- NewKBArticleDialog 3-step wizard: Project → Category → Method
|   |   |   +-- UsersView -------- team member list (Admin only)
|   |   |   +-- ProjectsView ----- project list table (Admin only)
|   |   |   +-- ReportsView ------ "Coming Soon" placeholder (Admin only)
|   |   |   +-- IntegrationsView - "Coming Soon" placeholder (Admin only)
|   |   +-- Dialog components (in /components/):
|   |   |   +-- AddProjectDialog, CreateTicketDialog, UpdateStatusDialog
|   |   |   +-- InitiateTransferDialog, TransferRequestsDialog
|   +-- ArticleDetails ----------- /agent/knowledge/article/:articleId (context-aware)
|   +-- ProjectDetails ----------- /agent/project/:projectId
|   |   +-- Extracted tab components (in /components/project-details/):
|   |   |   +-- OverviewTab, TicketsTab, ChatsTab, TeamTab
|   |   |   +-- ActivityTab, ChatWidgetTab, AISettingsTab, SettingsTab
|   |   |   +-- ProjectDetailsDialogs (InviteMemberDialog, ProjectCreateTicketDialog, EditProjectDialog)
|   +-- ProfileSettings ---------- /agent/profile-settings
|   +-- BillingPage ------------ /agent/billing
|   +-- AIArticleGenerator ------- /admin/ai-article-generator
|   +-- CreateArticle ------------ /admin/create-article
|   +-- ArticleDetails ----------- /admin/knowledge/article/:articleId (context-aware)
|
+-- AdminDashboard ---------------- thin wrapper
|   +-- AgentDashboard(role="Admin")
|
+-- SuperadminLayout ------------- layout route (sidebar + Outlet)
|   +-- SuperadminSidebar -------- dark sidebar with 7 nav items:
|   |   dashboard, chats, companies,
|   |   team, plans, analytics, system logs
|   |   (Projects removed from sidebar; route still exists for direct links)
|   +-- <Outlet> ----------------- renders matched child route component
|   +-- SuperadminDashboard ------ section-based page (reads URL segment for activeSection)
|   |   +-- ProjectSelector ------ shown only on chats, projects, agents
|   |   |   (hidden on overview, companies, team, plans, analytics, logs)
|   |   +-- Section: overview ---- stat cards + charts (recharts)
|   |   +-- Section: chats ------- split-panel (chat list <-> conversation)
|   |   +-- Section: companies --- company table list
|   |   |   +-- CompanyDetailView  internal view (viewingCompanyId state)
|   |   |       +-- Header card (name, plan, status, meta + action buttons)
|   |   |       +-- Action buttons: Edit, Settings, Billing, Delete Company
|   |   |       +-- Archive button (replaces three-dot menu)
|   |   |       +-- Stats row (projects, agents, tickets, MRR)
|   |   |       +-- Tabs: Overview, Projects, Plan, Chats, Tickets, KB, Team, Transactions, History
|   |   |       +-- Overview tab: stats, recent projects, Members card, KB articles table
|   |   |       +-- KB tab: articles table (Article, Category, Status, Last Updated, Actions)
|   |   |       +-- "New Article" button → navigates to /superadmin/create-article
|   |   |       +-- Chat/ticket rows clickable → /superadmin/chats/:chatId or /superadmin/tickets/:ticketId
|   |   |       +-- Add Project button → dialog with local state persistence
|   |   |       +-- Archive state: disables mutations, shows warning banner with Restore
|   |   +-- Section: projects ---- projects management
|   |   +-- Section: agents ------ agent management
|   |   +-- Section: team -------- user management (table directly)
|   |   |   +-- Clickable rows --- navigate to /superadmin/user/:userId
|   |   +-- Section: settings ---- plan pricing configuration
|   |   +-- Section: analytics --- analytics charts
|   |   +-- Section: logs -------- system log viewer
|   |   +-- Dialogs -------------- rendered at component root level
|   |
|   +-- Detail Pages (rendered in <Outlet> with shared SuperadminLayout):
|   +-- ChatDetails -------------- /superadmin/chats/:chatId
|   +-- TicketDetails ------------ /superadmin/tickets/:ticketId
|   +-- SuperadminCreateArticle -- /superadmin/create-article
|   +-- ProjectDetails ----------- /superadmin/project/:projectId
|   +-- SuperadminAgentDetails --- /superadmin/agent/:agentId
|   +-- UserDetails -------------- /superadmin/user/:userId
|   |   +-- Header card (username, role, status, bio, contact info)
|   |   +-- Stats row (tickets, chats, response time, satisfaction)
|   |   +-- Tabs: Activity (chart + feed), Permissions, Login History
|   +-- NotificationsPage -------- /superadmin/notifications
|   +-- SuperadminProfileSettings  /superadmin/profile-settings
|   +-- BillingPage ------------ /superadmin/billing
|
+-- Layout Components (/components/layouts/)
|   +-- DashboardLayout ----------- slot-based (sidebar, header, children, aside)
|   +-- DashboardHeader ----------- reusable header bar
|   +-- DashboardStats ------------ stat card row (StatCard)
|   +-- DashboardContent ---------- content wrapper (DashboardSection)
|   +-- ChatDashboardLayout ------- chat-specific layout (CustomerInfoCard)
|       +-- ExampleChatDashboard -- demo instance
|
+-- Shared UI (/components/ui/) --- 48 shadcn/ui primitives
|   accordion, alert, alert-dialog, avatar, badge, breadcrumb,
|   button, calendar, card, carousel, chart, checkbox, collapsible,
|   command, context-menu, dialog, drawer, dropdown-menu, form,
|   hover-card, input, input-otp, label, menubar, navigation-menu,
|   pagination, popover, progress, radio-group, resizable,
|   scroll-area, select, separator, sheet, sidebar, skeleton,
|   slider, sonner, switch, table, tabs, textarea, toggle,
|   toggle-group, tooltip, use-mobile (hook), utils
|
+-- Data Layer (/data/mockData.ts)
    mockCompanies, mockProjects, mockAgents, mockTickets,
    mockChats, mockChatMessages, mockStats, mockUsers,
    mockArticles, mockPricingPlans, mockTestimonials,
    mockCustomerActivity

+-- Shared State (/data/agentStatusStore.ts)
    agentStatusStore ----------- module-level external store (useSyncExternalStore)
    useAgentStatuses() --------- hook: returns full { agentId: status } map
    useAgentStatus(agentId) ---- hook: returns single agent's status string
    agentStatusStore.setStatus() writes status and notifies all subscribers
    Statuses: Active, Away, Offline, Deactivated, Invited
    Consumed by: UsersView, AgentDetails
```

---

## Key Architecture Notes

- **Layout routes**: `AgentAdminLayout.tsx` and `SuperadminLayout.tsx` render sidebar + `<Outlet>`. Sidebars use `<Link>` with `useLocation`-based active state highlighting. Pages keep their own headers and use `LayoutContext` (`toggleMobileSidebar`) for mobile sidebar control.
- **SuperadminDashboard** is a section-based page that reads the URL path segment (e.g., `companies` from `/superadmin/companies`) to determine `activeSection`. Company detail is internal via `viewingCompanyId` state (no route navigation for the detail view itself).
- **CompanyDetailView** (`/src/app/components/superadmin/CompanyDetailView.tsx`) is a comprehensive component with 9 tabs (Overview, Projects, Plan, Chats, Tickets, KB, Team, Transactions, History). Header action buttons are fully wired: Edit opens a pre-filled dialog (updates name/email/location/status in real-time), Settings switches to Plan tab, Billing switches to Transactions tab, Delete Company opens a destructive dialog requiring name confirmation. The three-dot menu has been replaced with an Archive button that opens a confirmation dialog with optional reason; archived state changes status to "Archived" (amber badge), shows a warning banner with Restore button, and disables all mutative actions (Edit, Add Project, Create First Project, Invite Member, plan upgrade/downgrade, New Article) and makes clickable rows non-interactive with reduced opacity.
- **Cross-page navigation patterns**: Clicking chat/ticket rows in CompanyDetailView navigates to `/superadmin/chats/{chatId}` or `/superadmin/tickets/{ticketId}`. Back buttons on detail pages navigate to `/superadmin/companies` with location state containing `viewingCompanyId` and the appropriate `companyDetailTab` (e.g., `'chats'`, `'tickets'`, `'kb'`) so the user lands on the correct tab.
- **SuperadminCreateArticle** (`/superadmin/create-article`) is a full article creation page with company context passed via location state (`companyId`, `companyName`). Both the back arrow and the success dialog's "Back to Company" button navigate to `/superadmin/companies` with `{ viewingCompanyId, companyDetailTab: 'kb' }`.
- **Add Project** button in CompanyDetailView is functional — opens a dialog and submits to local state (`addedProjects`) merged with mock data into `allCompanyProjects`, used across Overview, Projects tab, Plan usage, Chats, Tickets, and History tabs.
- **AdminDashboard** is just `AgentDashboard` with `role="Admin"` -- they share all code.
- **AgentDashboard refactoring** (complete): The parent file at `/src/app/pages/dashboards/AgentDashboard.tsx` (~477 lines, down from ~3,393) imports and renders 8 extracted view components from `/src/app/components/agent-dashboard/`: `DashboardView`, `ChatsView`, `TicketsView`, `AgentKnowledgeView`, `UsersView`, `ProjectsView`, `ReportsView`, `IntegrationsView`. Each manages its own internal state and receives props for data/callbacks. Five dialog components (`AddProjectDialog`, `CreateTicketDialog`, `UpdateStatusDialog`, `InitiateTransferDialog`, `TransferRequestsDialog`) were previously extracted to `/src/app/components/`.
- **ProjectDetails refactoring** (complete): The parent file at `/src/app/pages/ProjectDetails.tsx` (~388 lines, down from ~3,296) imports and renders 9 extracted components from `/src/app/components/project-details/`: `OverviewTab`, `TicketsTab`, `ChatsTab`, `TeamTab`, `ActivityTab`, `ChatWidgetTab`, `AISettingsTab`, `SettingsTab`, and `ProjectDetailsDialogs` (which contains `InviteMemberDialog`, `ProjectCreateTicketDialog`, `EditProjectDialog`).
- **Dialogs** in the SuperadminDashboard must be placed at the component root level (not inside nested sub-components) to render correctly.
- **ProjectSelector** (`/src/app/components/ProjectSelector.tsx`, formerly `CompanySelector`) is the nav bar project picker used across Agent, Admin, and Superadmin dashboards. It reads from `mockProjects`, shows project name + color dot + FolderOpen icon, and a "Switch Project" dropdown using standard shadcn/ui primitives (`DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuItem`). Dropdown items use the same flat single-line pattern as all other dropdowns in the app: small colored dot + project name + check mark for selected. In the Superadmin dashboard it is conditionally hidden on Overview, Companies, Team, Plans (`settings`), Analytics, and System Logs (`logs`) — it only appears on Chats, Projects, and Agents where project-level filtering is relevant. The old `CompanySelector.tsx` file has been deleted.
- The legacy route `/superadmin/company/:companyId` still exists pointing to a standalone `CompanyDetails` page, but the table row now uses the internal detail view instead.
- **PermissionsSection.tsx** (`/src/app/components/superadmin/PermissionsSection.tsx`) is still imported in `SuperadminDashboard.tsx` and rendered for `activeSection === 'permissions'`, but the Permissions nav item was removed from the sidebar. The route `/superadmin/permissions` still exists for direct access.
- **Context-aware article navigation**: `KnowledgeAgentView` (`/src/app/components/KnowledgeView.tsx`) and `ArticleDetails` (`/src/app/pages/ArticleDetails.tsx`) use `useLocation` to detect whether the current URL starts with `/agent` or `/admin` and build navigation paths accordingly (`basePath`). This ensures article clicks from the agent KB list navigate to `/agent/knowledge/article/:articleId` (staying in the agent layout), and article back/delete actions navigate to `${basePath}/knowledge` instead of a hardcoded admin route. The back button in `ArticleDetails` navigates to the correct Knowledge Base page (`/agent/knowledge` or `/admin/knowledge`) based on route prefix instead of using unreliable `navigate(-1)`.
- **Theme provider**: `next-themes` `ThemeProvider` has been removed due to incompatibility. The Sonner toast component (`/src/app/components/ui/sonner.tsx`) hardcodes `theme="light"` instead of reading from a theme context.
- **KB categories have project associations**: Each knowledge base category in `AgentKnowledgeView` has a `projectId` field linking it to a project from `mockProjects`. The sidebar displays a colored dot + project name label under each category for visual association. The `NewKBArticleDialog` uses a 3-step wizard (Project → Category → Creation Method): Step 1 lists all projects from `mockProjects` with colored dots and per-project category counts; Step 2 filters categories to the selected project and allows creating a new category; Step 3 offers "Create from Scratch" or "Generate with AI" (with URL or description source). The `onCategoryCreated` callback receives `(name, projectId)` so new categories are assigned to the correct project. The standalone `AddCategoryDialog` (`CategoryDialogs.tsx`) also includes a project selector dropdown (using `mockProjects` with colored dots) — the "Add Category" button is disabled until both a project and a name are provided.
- **ArticleDetails header**: The header shows a back button followed by the article title and status badge. Project info is displayed only in the Article Information card (using `categoryProjectMap` to look up the project from the article's `categoryId`). `ProjectSelector` was removed from this header.
- **Agent/Admin header toolbar**: The header contains (left to right): mobile hamburger, project filter popover (hidden on dashboard/projects), search bar, notification bell dropdown, transfer icon buttons (ArrowRightLeft for "Transfer Chat", Inbox for "Transfer Requests" with red badge count), "+ New Ticket" button, and agent info section (avatar with status indicator dot, name, role, profile dropdown with Profile Settings, Billing, Update Status, Log Out). The transfer actions were previously inside a status dropdown; they are now standalone ghost icon buttons for quicker access.
- **BillingPage** (`/src/app/pages/dashboards/BillingPage.tsx`) is a shared page rendered at `/agent/billing`, `/admin/billing`, and `/superadmin/billing`. It is context-aware via `useLocation`-based `basePath` detection (same pattern as `ProfileSettings` and `ArticleDetails`). The header matches the main dashboard's user section: avatar with dynamic status dot (green/yellow/gray for online/away/offline), name + role text, `ChevronDown` button trigger, and the full 4-item dropdown (Profile Settings, Billing, Update Status, Log Out) with icons. It uses the shared `UpdateStatusDialog` component for status changes. The page includes plan management, usage overview, Stripe-style payment method dialog, invoice history with download, and cancel subscription flow. The `isReadOnly` flag (set when `role === 'Agent'`) disables plan changes, payment updates, and cancellation.
- **Consistent profile dropdown pattern**: The profile dropdown (avatar + ChevronDown + 4-item menu) is now identical across `AgentDashboard`, `ProfileSettings`, and `BillingPage`. All three use the shared `UpdateStatusDialog` component for status changes, and the status indicator dot color updates dynamically. Each page computes `basePath` from `useLocation` to generate correct links for all three contexts (`/agent`, `/admin`, `/superadmin`).
- **Shared agent status store** (`/src/app/data/agentStatusStore.ts`): A module-level external store built on `useSyncExternalStore` that provides cross-component agent status synchronization. Both `UsersView` (team table) and `AgentDetails` (agent detail page) read and write statuses through this store, so deactivating an agent in either view is immediately reflected in the other upon navigation. The store tracks five statuses with distinct visual treatments: **Active** (green dot / default badge), **Away** (yellow dot / secondary badge), **Offline** (gray dot / outline badge), **Deactivated** (red dot / destructive badge), and **Invited** (blue dot / blue outline badge). The deactivation flow sets status to "Deactivated" (not "Inactive") consistently in both views. Mock agent "David Kim" (id `'6'`) is pre-initialized with "Invited" status to represent a newly invited agent pending onboarding.

---

## Refactoring Status

### Completed

| Component | Parent file | Lines (before → after) | Extracted to | Sub-components |
|---|---|---|---|---|
| `AgentDashboard` | `/src/app/pages/dashboards/AgentDashboard.tsx` | ~3,393 → ~477 | `/src/app/components/agent-dashboard/` | `DashboardView`, `ChatsView`, `TicketsView`, `AgentKnowledgeView`, `UsersView`, `ProjectsView`, `ReportsView`, `IntegrationsView` |
| `ProjectDetails` | `/src/app/pages/ProjectDetails.tsx` | ~3,296 → ~388 | `/src/app/components/project-details/` | `OverviewTab`, `TicketsTab`, `ChatsTab`, `TeamTab`, `ActivityTab`, `ChatWidgetTab`, `AISettingsTab`, `SettingsTab`, `ProjectDetailsDialogs` |
| `SuperadminDashboard` | `/src/app/pages/dashboards/SuperadminDashboard.tsx` | ~4,376 → ~952 | `/src/app/components/superadmin/` | `OverviewSection`, `ChatsSection`, `CompanyDetailView`, `TeamSection`, `PermissionsSection`, `NotificationBell`, `SuperadminTopbar`, `SuperadminSidebar`, `AddProjectForm` |

### Cleanup completed

- Deleted orphaned `/src/app/pages/dashboards/ProjectDetails.tsx` (~692 lines) — was not imported by `App.tsx` or any other file.

---

## Pending Items

- `chatStatusFilter` state variable exists in SuperadminDashboard but has no UI to set it (stat cards were removed).
- Message input in the SuperadminDashboard chat detail panel is not yet functional.
- "Edit Role" and "Remove" actions in the Superadmin Team section are unwired (buttons exist but have no handlers).
- "Projects" nav item was removed from the superadmin sidebar only (route `/superadmin/projects` still exists for direct links).
- "Permissions" nav item was removed from the superadmin sidebar; route `/superadmin/permissions` and `PermissionsSection.tsx` still exist for direct access.
- Orphaned `expandedCategoryId` state and unused icon imports (`ChevronDown`, `ChevronUp`, `CheckCircle`) remain in `AgentKnowledgeView.tsx` from the accordion-to-sidebar refactor.
- Potentially orphaned KB/category dialog state in `AgentDashboard.tsx` has not been audited — some state may duplicate what `AgentKnowledgeView` now manages internally.
- `onCreateFromScratch` and `onGenerateWithAI` callbacks in `NewKBArticleDialog` don't yet pass `categoryId` as a query param to the target page; they only log/navigate without context.