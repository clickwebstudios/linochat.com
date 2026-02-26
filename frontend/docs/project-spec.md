# LinoChat - Project Specification

## 1. User Roles & What Each Sees

LinoChat has **3 authenticated roles** (Superadmin, Admin, Agent) and **2 unauthenticated entity types** (Visitor, Customer). Access is currently determined by route (no runtime auth guards), but the intended access model is documented below.

### Authenticated Role Hierarchy

```
Superadmin          Platform owner. Manages all companies, billing, security.
  |
Admin               Company-level administrator. Manages agents, projects, users.
  |
Agent               Front-line support. Handles chats, tickets, knowledge base.
```

### Unauthenticated Entities (NOT roles)

```
Visitor             Anonymous. Browses marketing site, help center, uses chat widget. No DB record.
  |
  |  (creates a ticket or chat -- identified by email)
  v
Customer            Tracking entity in `customers` table. Links ticket/chat history by email.
                    Never logs in, no password, no dashboard.
```

### Detailed Visibility Matrix

| Feature / Area | Visitor | Customer | Agent | Admin | Superadmin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Marketing site** (home, features, pricing, resources, about, contact) | Y | Y | - | - | - |
| **Chat widget** (floating bubble on marketing pages) | Y | Y | - | - | - |
| **Help Center** (search, categories, FAQs, articles) | Y | Y | - | - | - |
| **Auth pages** (login, signup, forgot password) | Y | Y | - | - | - |
| **Dashboard overview** (stat cards, charts) | - | - | Y | Y | Y |
| **Live chat panel** (split-panel: chat list + conversation thread) | - | - | Y | Y | Y |
| **Ticket management** (list, filters, detail view, assignments) | - | - | Y | Y | Y |
| **Knowledge base management** (articles CRUD, AI article generator) | - | - | Y | Y | Y |
| **Reports** (performance metrics, charts — Coming Soon placeholder) | - | - | - | Y | Y |
| **Integrations** (third-party connections — Coming Soon placeholder) | - | - | - | Y | - |
| **Project management** (project list, detail, settings) | - | - | - | Y | Y |
| **User / agent management** (team list, invite, roles) | - | - | - | Y | Y |
| **Company management** (list, detail view, plan/status) | - | - | - | - | Y |
| **Billing management** (plans, invoices, revenue) | - | - | - | - | Removed |
| **Plan pricing configuration** (plan prices, benefits, trial settings) | - | - | - | - | Y |
| **Platform configuration** (general, notifications, integrations tabs) | - | - | - | - | Y |
| **Analytics** (platform-wide charts, metrics) | - | - | - | - | Y |
| **System logs** (log viewer, severity filters) | - | - | - | - | Y |
| **Security settings** (2FA, IP allow-lists, sessions) | - | - | - | - | Removed |
| **Permissions** (role definitions, permission matrices) | - | - | - | - | Removed |
| **Profile settings** | - | - | Y | Y | Y (separate page) |
| **Billing page** (plan, payment method, invoices) | - | - | Y (read-only) | Y | Y |
| **Project selector** (nav bar dropdown, formerly CompanySelector) | - | - | Y | Y | Y (conditional) |
| **Project filter** (multi-select nav bar filter) | - | - | Y | Y | - |

### Role-Specific UI Differences

#### Agent vs Admin (shared `AgentDashboard` component)

The `role` prop (`'Agent'` | `'Admin'`) controls:

- **Sidebar**: Admin sees "Projects", "Users", "Reports", and "Integrations" nav items; Agent does not.
- **Chat list**: Admin sees "Handled by: {agent}" attribution per chat; Agent does not.
- **Profile label**: Displays the role string under the user avatar.
- **All other sections**: Identical between Agent and Admin.

#### Superadmin (standalone `SuperadminDashboard`)

Completely separate component with its own shared sidebar (`SuperadminSidebar`) containing 7 nav items (Security, Permissions, and Projects have been removed from the sidebar). Does not share code with `AgentDashboard`. The `ProjectSelector` (formerly `CompanySelector`) in the nav bar is hidden on Overview, Companies, Team, Plans, Analytics, and System Logs — it only appears on Chats, Projects, and Agents.

#### Customer

Accesses `/help` (self-service knowledge base and public FAQs). Customers interact with the platform through the Help Center and the floating Chat Widget on marketing pages. No dedicated dashboard or sidebar.

#### Visitor

Sees the marketing website with `MarketingHeader`, `MarketingFooter`, and floating `ChatWidget`. Can browse all marketing pages and the public help center.

---

## 2. Core Features List with Priorities

Priority levels:
- **P0 - Critical**: Must work for product to be usable. Launch blocker.
- **P1 - High**: Core experience. Expected by all users at launch.
- **P2 - Medium**: Important but can ship in a fast follow-up.
- **P3 - Low**: Nice to have. Planned for future iterations.

### Authentication & Onboarding

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| A1 | Login (email/password) | P0 | UI only | `console.log()` on submit, no real auth |
| A2 | Multi-step signup wizard (account, verify, project, team, customize) | P0 | UI only | Redirects to `/dashboard/agent` on completion |
| A3 | Forgot password flow | P0 | UI only | Shows confirmation UI, no email sent |
| A4 | OAuth sign-in (Google, GitHub) | P2 | Buttons exist | Non-functional |
| A5 | Protected routes / auth guards | P0 | Missing | No `AuthContext`, no route protection |
| A6 | Session management / logout | P0 | Missing | "Sign out" navigates to `/` but clears no state |
| A7 | Role-based route guards | P0 | Missing | All dashboard routes publicly accessible |

### Live Chat (Agent/Admin/Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| C1 | Chat list with search & filters | P0 | Implemented | Status, project, text filters |
| C2 | Chat conversation thread view | P0 | Implemented | Full message history display |
| C3 | Agent info panel in chat detail | P1 | Implemented | Shows assigned agent, response time, duration |
| C4 | Send message from chat input bar | P0 | **Broken** | Input exists but is non-functional |
| C5 | Chat status filter (active/waiting/closed) | P1 | **Broken** | `chatStatusFilter` state exists, no UI control |
| C6 | Chat transfer between agents | P1 | Partial | Header has two icon buttons: ArrowRightLeft (initiate transfer) and Inbox (incoming transfer requests with red badge count). Both open their respective dialogs directly — no dropdown. |
| C7 | Real-time message delivery | P0 | Missing | Currently static mock data |
| C8 | Typing indicators | P2 | Missing | |
| C9 | File/image attachments in chat | P2 | Missing | |
| C10 | Chat assignment (Admin: "Handled by" label) | P1 | Implemented | Admin role only |
| C11 | Action menu (resolve, transfer, escalate) | P1 | Implemented | |

### Ticket Management (Agent/Admin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| T1 | Ticket list with status filters (all/open/pending/closed) | P0 | Implemented | |
| T2 | Ticket detail view with conversation | P0 | Implemented | Standalone page (`TicketDetails`) |
| T3 | Ticket assignment to agents | P1 | Implemented | Dropdown with team member list |
| T4 | Create / update ticket | P1 | Partial | UI exists (Create Ticket dialog in ChatsView with category dropdown: Technical Support, Billing, Feature Request, Bug Report, Account Issue, General Inquiry), no persistence |
| T5 | Ticket priority & status management | P1 | Implemented | Badges and status controls |
| T6 | Ticket SLA tracking | P2 | Missing | |

### Knowledge Base (Agent/Admin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| K1 | Article list with categories | P0 | Implemented | Filterable, searchable |
| K2 | Create article (manual, Agent/Admin) | P1 | Implemented | Standalone page (`CreateArticle`) at `/admin/create-article`. The "New Article" dialog (`NewKBArticleDialog`) uses a 3-step wizard: Step 1 selects a project (from `mockProjects` with colored dots), Step 2 selects or creates a category (filtered by chosen project), Step 3 chooses creation method ("Create from Scratch" or "Generate with AI" with URL or description source). |
| K3 | AI article generator | P1 | Implemented | Standalone page (`AIArticleGenerator`) at `/admin/ai-article-generator` |
| K4 | Article detail view | P1 | Implemented | Standalone page (`ArticleDetails`) at both `/agent/knowledge/article/:articleId` and `/admin/knowledge/article/:articleId`. Uses `useLocation`-based `basePath` detection (`/agent` vs `/admin`) so all navigation (back, delete, not-found fallback) stays within the correct layout context. |
| K5 | Article publish/draft workflow | P2 | Partial | Status badges shown; draft articles display "Save Draft" and "Publish" buttons in `ArticleDetails`. No bulk publish toggle. |
| K6 | Article analytics (views, helpful %) | P2 | Displayed | Read-only mock stats |
| K7 | Create article (Superadmin, from company KB tab) | P1 | Implemented | `SuperadminCreateArticle` at `/superadmin/create-article`. Full form with company context via location state. Back navigation returns to company detail KB tab with `{ viewingCompanyId, companyDetailTab: 'kb' }` |

### Company Management (Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| M1 | Company list table | P0 | Implemented | Clickable rows open internal `CompanyDetailView` |
| M2 | Company detail view (internal, no route nav) | P0 | Implemented | 9 tabs: Overview, Projects, Plan, Chats, Tickets, KB, Team, Transactions, History. Header shows name, plan, status, meta. |
| M3 | Back navigation from company detail to list | P0 | Implemented | Button + sidebar click resets `viewingCompanyId` |
| M4 | Edit company (name, email, location, status) | P1 | Implemented | Dialog pre-filled with current values; updates header and all `company.name` references in real-time, including dynamic status badge colors |
| M5 | Delete company | P1 | Implemented | Destructive confirmation dialog requiring user to type the company name; navigates back to companies list |
| M6 | Archive / Restore company | P1 | Implemented | Archive button opens confirmation dialog with optional reason field; status changes to "Archived" (amber badge), warning banner with "Restore Company" button appears, all mutative actions disabled (Edit, Add Project, Create First Project, Invite Member, plan upgrade/downgrade, New Article), clickable rows become non-interactive with reduced opacity; Restore reverses all restrictions instantly |
| M7 | Header action buttons (Edit, Settings, Billing, Delete) | P1 | Implemented | Edit → edit dialog; Settings → Plan tab; Billing → Transactions tab; Delete → destructive confirmation |
| M8 | Plan management per company | P1 | Displayed | Progress bars, read-only plan usage |
| M9 | Add Project (from company detail) | P1 | Implemented | Dialog submits to local state (`addedProjects`) merged with mock data into `allCompanyProjects`, used across Overview, Projects tab, Plan usage, Chats, Tickets, and History tabs |
| M10 | Cross-page navigation (chats/tickets) | P1 | Implemented | Chat/ticket rows navigate to `/superadmin/chats/:chatId` or `/superadmin/tickets/:ticketId`; back buttons return to company detail with correct tab via location state (`viewingCompanyId` + `companyDetailTab`) |
| M11 | Overview tab | P1 | Implemented | Stats, recent projects, Members card (links to Team tab), KB articles table (Article, Category, Status, Last Updated, Actions) |

### Project Management (Admin/Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| J1 | Project list / table | P0 | Implemented | In both dashboards |
| J2 | Project detail page | P1 | Implemented | Standalone page (`ProjectDetails`) |
| J3 | Add project dialog (multi-step) | P1 | Implemented | In Agent dashboard (admin) |
| J4 | Project selector (multi-select filter in nav) | P1 | Implemented | Filters chats/tickets by project |
| J5 | AI-powered project setup (website analysis) | P2 | Implemented | In signup and add-project flows |

### User & Agent Management (Admin/Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| U1 | Agent/user list table | P0 | Implemented | In both dashboards. Team table rows in Superadmin are clickable → navigate to user detail page |
| U2 | Agent detail page | P1 | Implemented | Standalone page (`AgentDetails` for Agent dashboard, `SuperadminAgentDetails` for Superadmin). Mock data includes 6 agents (ids 1–6); agent `'6'` ("David Kim") is pre-initialized with "Invited" status. |
| U3 | User detail page | P1 | Implemented | Standalone page (`UserDetails`) at `/superadmin/user/:userId`. Shows profile header, stats (tickets, chats, response time, satisfaction), tabbed content (Activity with chart + feed, Permissions, Login History). Edit and Deactivate dialogs. |
| U4 | Invite team members (email) | P1 | Implemented | Dialog in Agent dashboard and Superadmin Team section |
| U5 | Role assignment (Admin/Agent/Viewer) | P1 | Implemented | Dropdown in invite flow |
| U6 | Agent status management | P2 | Implemented | Five statuses tracked via shared `agentStatusStore` (`/src/app/data/agentStatusStore.ts`): **Active** (green dot / default badge), **Away** (yellow dot / secondary badge), **Offline** (gray dot / outline badge), **Deactivated** (red dot / destructive badge), **Invited** (blue dot / blue outline badge). Status is synchronized between `UsersView` (team table) and `AgentDetails` (detail page) through a `useSyncExternalStore`-based external store — deactivating in either view persists across navigation. The deactivation flow in both views sets status to "Deactivated" via `agentStatusStore.setStatus()`. Status dialog for online/away/offline changes is accessible via the profile dropdown "Update Status" menu item. |

### Reports (Admin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| R1 | Reports page | P2 | Coming Soon | Replaced with placeholder: centered BarChart3 icon + sparkle badge, "Reports Coming Soon" heading, 4×2 grid of greyed-out report type previews (Response Time, Satisfaction, Ticket Volume, Resolution Rate, Agent Load, SLA Compliance, Trends, Exports). |

### Integrations (Admin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| I1 | Integrations page | P2 | Coming Soon | Replaced with placeholder: centered Plug icon + sparkle badge, "Integrations Coming Soon" heading, 4×2 grid of greyed-out integration logos (Slack, Salesforce, Zapier, Jira, HubSpot, GitHub, Stripe, Zendesk). Email signup card removed. |

### Billing & Analytics (Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| B1 | Billing overview (revenue, MRR, plan distribution) | P1 | **Removed** | Billing section and sidebar item removed from SuperadminDashboard |
| B2 | Analytics charts (platform-wide) | P1 | Implemented | Recharts-based |
| B3 | System logs viewer | P2 | Implemented | Log list with severity |
| B4 | Payment processing / Stripe integration | P2 | Missing | |

### Billing Page (Agent/Admin/Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| BP1 | Current plan display with billing cycle toggle | P1 | Implemented | Monthly/annual toggle with 20% savings callout. Feature list, pricing breakdown |
| BP2 | Change plan dialog | P1 | Implemented | 4-plan grid (Free, Starter, Pro, Enterprise) with billing toggle, upgrade/downgrade confirmation |
| BP3 | Usage overview (agents, tickets, chats, storage) | P1 | Implemented | Progress bars, plan-relative limits |
| BP4 | Payment method management | P1 | Implemented | Stripe-style dialog with live card preview, brand detection (Visa/MC/Amex/Discover), Luhn validation, formatted inputs |
| BP5 | Invoice history with download | P1 | Implemented | Filterable table (all/paid/pending), PDF download (simulated) |
| BP6 | Cancel subscription | P1 | Implemented | Destructive confirmation with consequences list |
| BP7 | Read-only mode for Agents | P1 | Implemented | `isReadOnly` flag when `role === 'Agent'`; hides plan change, payment update, cancel buttons; shows "View Only" badge and lock banner |
| BP8 | Context-aware header with profile dropdown | P1 | Implemented | Matches dashboard: avatar with dynamic status dot, name + role, ChevronDown trigger, 4-item dropdown (Profile Settings, Billing, Update Status, Log Out). Uses `UpdateStatusDialog`. |
| BP9 | Context-aware navigation (`basePath`) | P1 | Implemented | Back button and all links use `useLocation`-based `basePath` to work correctly under `/agent`, `/admin`, and `/superadmin` |

### Platform Administration (Superadmin)

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| P1 | Plan pricing configuration (plan prices, benefits, trial period) | P1 | Implemented | Sidebar label: "Plans". No tabs — pricing content shown directly. `activeSection='settings'` internally |
| P2 | Security settings (2FA, IP allow-list, sessions) | P1 | **Removed** | Section and sidebar item removed from SuperadminDashboard |
| P3 | Role & permissions management | P1 | **Removed** | Section and sidebar item removed from SuperadminDashboard. `PermissionsSection.tsx` is still imported and rendered for direct URL access (`/superadmin/permissions`), but the sidebar nav item was removed. |
| P4 | Overview dashboard (stat cards + charts) | P0 | Implemented | Recharts-based |

### Customer-Facing

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| X1 | Help center (search, categories, FAQs, articles) | P0 | Implemented | `/help` |
| X2 | Floating chat widget (marketing pages) | P1 | Implemented | Motion-animated bubble |

### Marketing Website

| # | Feature | Priority | Status | Notes |
|---|---|:---:|---|---|
| W1 | Home page (hero, features, testimonials, CTA) | P1 | Implemented | |
| W2 | Features page | P1 | Implemented | |
| W3 | Pricing page (plan cards, billing toggle, FAQs) | P1 | Implemented | |
| W4 | Resources page | P2 | Implemented | |
| W5 | About page | P2 | Implemented | |
| W6 | Contact page | P1 | Implemented | |
| W7 | SEO metadata (`react-helmet-async`) | P2 | Implemented | Per-page titles, descriptions, keywords |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Current State |
|---|---|---|
| **First Contentful Paint (FCP)** | < 1.5s | Not measured. Single SPA bundle, no code splitting. |
| **Largest Contentful Paint (LCP)** | < 2.5s | Risk: `SuperadminDashboard.tsx` is ~952 lines (down from ~4,376 after extracting 9 sub-components to `/src/app/components/superadmin/`); `AgentDashboard.tsx` is ~477 lines (down from ~3,393 after extracting 8 view components to `/src/app/components/agent-dashboard/`); `ProjectDetails.tsx` is ~388 lines (down from ~3,296 after extracting 9 tab components to `/src/app/components/project-details/`). All three now delegate section rendering to focused sub-components. |
| **Time to Interactive (TTI)** | < 3.5s | Not measured. No lazy loading on routes. |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Low risk: layouts use fixed sidebars and flex containers. |
| **Bundle size** | < 250 KB gzipped (initial) | Risk: all routes in a single chunk. No `React.lazy()` or route-based splitting. |
| **Re-render efficiency** | Avoid unnecessary re-renders | Improved: large monolith components have been split into focused sub-components that each manage their own state. Further optimization with `useMemo`/`useCallback` is possible. |

**Recommended improvements:**
- Route-based code splitting with `React.lazy()` + `Suspense`
- Virtualize long lists (chat list, ticket list, log viewer) with `react-window` or `react-virtuoso`
- Memoize expensive computations and filtered data sets
- Consider moving mock data to lazy-loaded modules

### 3.2 Accessibility (WCAG 2.2 AA)

#### Current State

| Area | Status | Notes |
|---|---|---|
| **Semantic HTML** | Partial | Uses `<aside>`, `<header>`, but dashboard sections lack `<main>`, `<nav>`, `<section>` landmarks consistently |
| **ARIA attributes** | Minimal | No custom `aria-label`, `aria-live`, `aria-describedby` in dashboard components. Relies on shadcn/ui built-in ARIA (Dialog, DropdownMenu, etc.) |
| **Keyboard navigation** | Partial | shadcn/ui components (Dialog, DropdownMenu, Select, Tabs) are keyboard-accessible by default. Custom interactive elements (chat list items, company table rows, sidebar buttons) lack explicit `tabIndex`, `role`, `onKeyDown` handling |
| **Focus management** | Minimal | No focus trapping for custom panels. No skip-to-content link. Focus is not returned to trigger after closing custom views (e.g., company detail) |
| **Color contrast** | Partial | Blue-on-white and dark sidebar likely meet AA ratios. Status badge colors (green/yellow/red text on light backgrounds) need verification |
| **Screen reader support** | Minimal | No `sr-only` labels for icon-only buttons in dashboards. No `aria-live` regions for dynamic content updates (new chat messages, status changes) |
| **Motion & animation** | Not addressed | Chat widget uses `motion/react` animations. No `prefers-reduced-motion` media query check |
| **Form labels** | Mostly good | Auth forms use `<label htmlFor>`. Some dashboard forms may lack explicit labels |
| **Error messages** | Missing | No form validation error announcements (`aria-invalid`, `aria-errormessage`) |
| **Touch targets** | Needs review | Some icon-only buttons may be smaller than 44x44px minimum |

#### WCAG 2.2 AA Compliance Checklist

**Must Fix (Level A):**
- [ ] Add `<main>` landmark to all page layouts
- [ ] Add skip-to-content link on all pages
- [ ] Ensure all interactive elements are keyboard-operable (`tabIndex`, `role="button"`, `onKeyDown`)
- [ ] Add `aria-label` to icon-only buttons (sidebar nav, action menus)
- [ ] Add `aria-live="polite"` regions for dynamic content (chat messages, notifications, toast updates)
- [ ] Ensure all form inputs have associated `<label>` elements
- [ ] Add `aria-invalid` and error message associations for form validation
- [ ] Ensure 4.5:1 contrast ratio for all text content

**Must Fix (Level AA):**
- [ ] Ensure 3:1 contrast ratio for UI component boundaries and graphical objects
- [ ] Support text resizing up to 200% without loss of content
- [ ] Ensure content reflows at 320px viewport width (no horizontal scrolling)
- [ ] Add visible focus indicators on all interactive elements (beyond browser default)
- [ ] Ensure status messages are programmatically determined (`aria-live`, `role="status"`)
- [ ] Respect `prefers-reduced-motion` for all animations
- [ ] Ensure touch target minimum size of 24x24px (WCAG 2.2 SC 2.5.8)

**Should Fix (Best Practice):**
- [ ] Add `aria-current="page"` to active sidebar nav items
- [ ] Use `aria-expanded` on collapsible sections and dropdowns
- [ ] Implement roving tabindex for sidebar navigation
- [ ] Add `aria-describedby` for complex form fields with helper text
- [ ] Provide alternative text for all chart visualizations (data tables or `aria-label`)
- [ ] Announce route changes to screen readers

### 3.3 Mobile Responsiveness

#### Current State

| Area | Status | Notes |
|---|---|---|
| **Marketing pages** | Good | Fully responsive. Uses `container mx-auto`, responsive grid classes, stacked layouts on mobile |
| **Auth pages** | Good | Centered card layout, responsive grid (`lg:grid-cols-2` collapses to single column) |
| **Agent/Admin dashboard** | Partial | Sidebar collapses to `Sheet` (slide-out) on `< md`. Content area is scrollable. Some sections may overflow on small screens |
| **Superadmin dashboard** | Partial | Sidebar toggles via `sidebarOpen` state. Uses responsive grids (`md:grid-cols-2`, `lg:grid-cols-4`). Chat split-panel uses `lg:grid-cols-3` which stacks on small screens |
| **Help center** | Good | Responsive search, category grid, accordion FAQs |
| **Chat widget** | Good | Fixed position, full-width on mobile viewport |

#### Breakpoint Strategy

```
Tailwind defaults used:
  sm:  640px   (rarely used)
  md:  768px   (sidebar show/hide breakpoint, 2-column grids)
  lg:  1024px  (3-4 column grids, split-panel layouts)
  xl:  1280px  (not commonly used)
```

#### Responsive Design Requirements

| Requirement | Target | Current State |
|---|---|---|
| **Minimum supported viewport** | 320px width | Not verified. Some dashboard content may overflow |
| **Sidebar behavior** | Collapses to hamburger menu below `md` (768px) | Implemented for both dashboards |
| **Chat split-panel** | Stacks vertically or shows list-only with detail as overlay below `lg` | Partially: stacks via grid, but no dedicated mobile chat UX |
| **Tables** | Horizontally scrollable or card-based layout on mobile | Uses `overflow-x-auto` wrappers in some places; needs audit |
| **Touch interactions** | All tap targets >= 44px, swipe gestures for navigation | Not implemented. Some buttons may be undersized |
| **Orientation** | Support both portrait and landscape | Not explicitly tested |
| **Print styles** | Not required for MVP | - |

**Recommended improvements:**
- Audit all table views for mobile usability (consider card-based alternatives)
- Add dedicated mobile chat UX (list view -> tap to open conversation full-screen)
- Ensure all modals/dialogs are full-screen on mobile (`Sheet` component with `side="bottom"` or drawer pattern)
- Test and fix overflow issues at 320px viewport width
- Add touch-friendly swipe gestures for sidebar and chat navigation
- Consider bottom navigation bar for mobile dashboard views