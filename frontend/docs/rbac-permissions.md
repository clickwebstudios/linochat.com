# LinoChat - RBAC: Role Guards & Permissions Matrix

**Database**: MySQL 8.0 | **Audience**: OpenClaw backend worker

---

## 1. Authenticated Role Hierarchy

LinoChat has **3 authenticated roles**. All three are stored in the `users` table and require login via JWT.

```
SUPERADMIN (platform-level)
    |
    |-- Full platform access, cross-company visibility
    |-- Manages companies, plans, analytics, system logs
    |-- Can impersonate any admin/agent for debugging
    |
    v
ADMIN (company-level, aka "organization_owner")
    |
    |-- Full access within their own company
    |-- Manages projects, users, billing, KB
    |-- Cannot see other companies' data
    |
    v
AGENT (company-level)
    |
    |-- Handles tickets, chats, KB articles
    |-- Sees only assigned/own-project data
    |-- Read-only billing access
```

### Non-Authenticated Entities (NOT roles)

| Entity | DB Record | Auth | Description |
|---|---|---|---|
| **Visitor** | None | No | Anonymous person browsing marketing site, help center, or using the chat widget. No login, no dashboard. |
| **Customer** | `customers` table row created on first ticket/chat | No | A **visitor who has submitted at least one ticket or chat**. The `customers` record is a tracking entity to link their ticket/chat history -- NOT an authenticated user. Customers never log in, never have a password, and have no dashboard. |

**Lifecycle**: Visitor --> (creates ticket or chat) --> Customer record created (identified by email) --> all future tickets/chats linked via `customers.id`

---

## 2. Database Role Values

| Role | Stored In | Column Value | Scope |
|---|---|---|---|
| Superadmin | `users.role` (or separate platform flag) | Platform operator | Platform-wide, cross-company |
| Admin | `users.role` | `'Admin'` | Scoped to `users.company_id` |
| Agent | `users.role` | `'Agent'` | Scoped to `users.company_id` + assigned projects |

**Note**: The `customers` table is a **data entity**, not a role. It has no `password_hash`, no `role` column, and no authentication fields. It exists solely to track ticket/chat history for end-users who interact through the chat widget or help center.

---

## 3. Permission Matrix

### Legend

| Symbol | Meaning |
|---|---|
| **FULL** | Full access (view, create, edit, delete) |
| **OWN** | Own/limited access (only records they are assigned to, or belong to their assigned projects) |
| **VIEW** | Read-only access |
| **NONE** | No access |

---

### 3.1 Tickets Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View ticket list** | OWN | FULL | FULL | Agent sees tickets in assigned projects |
| **View ticket detail** | OWN | FULL | FULL | Agent sees assigned + project-scoped |
| **Create ticket** | FULL | FULL | FULL | Via CreateTicketDialog |
| **Edit ticket** (status, priority, category) | OWN | FULL | FULL | Agent can update tickets assigned to them |
| **Assign ticket** to agent | NONE | FULL | FULL | Only Admin+ can reassign tickets |
| **Close/Resolve ticket** | OWN | FULL | FULL | Agent can close tickets assigned to them |
| **Delete ticket** | NONE | FULL | FULL | Destructive action; Admin+ only |
| **Add ticket comment** | OWN | FULL | FULL | Agent can comment on tickets they have access to |

**Backend guard**: `WHERE company_id = :userCompanyId` for tenant isolation. Agent queries add `AND (assigned_to = :userId OR project_id IN (SELECT project_id FROM user_project_assignments WHERE user_id = :userId))`.

---

### 3.2 Live Chat Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View chat list** | OWN | FULL | FULL | Agent sees chats in assigned projects |
| **View chat conversation** | OWN | FULL | FULL | Agent sees assigned + project-scoped |
| **Send message** | OWN | FULL | FULL | Agent responds to assigned chats |
| **Initiate transfer** | OWN | FULL | FULL | Agent transfers their own assigned chats |
| **Accept/Reject transfer** | OWN | FULL | FULL | Agent accepts transfers sent to them |
| **Close/Resolve chat** | OWN | FULL | FULL | Agent resolves their assigned chats |
| **View customer info panel** | OWN | FULL | FULL | Session data, page visits, previous chats |
| **Admin "Handled by" label** | NONE | FULL | FULL | Admin sees which agent handles each chat |

**Backend guard**: Same tenant isolation. Agent chat visibility: `WHERE project_id IN (user's assigned projects) OR assigned_to = :userId`.

**Customer-side chat**: Visitors/customers interact via the **chat widget** (unauthenticated, public endpoint). The backend creates or matches a `customers` record by email, then creates the `chats` + `chat_messages` rows. No auth token is required for the widget -- the widget uses a project-scoped embed key (`chat_widget_configs.widget_id`) for identification.

---

### 3.3 Projects Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View project list** | OWN | FULL | FULL | Agent sees only assigned projects via ProjectSelector |
| **View project detail** | OWN | FULL | FULL | Agent can view detail of assigned projects |
| **Create project** | NONE | FULL | FULL | Via AddProjectDialog |
| **Edit project** (name, color, website, status) | NONE | FULL | FULL | Via SettingsTab in ProjectDetails |
| **Delete/Disable project** | NONE | FULL | FULL | Admin+ only |
| **Assign agents to project** | NONE | FULL | FULL | Via AgentDetails "Assign Projects" tab |
| **Configure chat widget** | NONE | FULL | FULL | ChatWidgetTab in ProjectDetails |
| **Configure AI settings** | NONE | FULL | FULL | AISettingsTab in ProjectDetails |

**Backend guard**: Agent project access: `WHERE project_id IN (SELECT project_id FROM user_project_assignments WHERE user_id = :userId)`.

---

### 3.4 Knowledge Base Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View articles (public)** | FULL | FULL | FULL | Published articles also visible to unauthenticated visitors via HelpCenter (public endpoint) |
| **View articles (internal)** | OWN | FULL | FULL | Agent sees articles in assigned project categories |
| **Create article** | OWN | FULL | FULL | Agent can create in assigned project categories |
| **Edit article** | OWN | FULL | FULL | Agent can edit articles they authored |
| **Delete article** | NONE | FULL | FULL | Admin+ only |
| **Publish/Unpublish article** | NONE | FULL | FULL | Draft/Published toggle |
| **Manage categories** | NONE | FULL | FULL | Create, rename, delete categories |
| **AI article generation** | NONE | FULL | FULL | AIArticleGenerator page (Admin route) |

**Backend guard**: Article visibility scoped through `kb_categories.project_id` chain. Agent: articles in categories belonging to their assigned projects.

**Public endpoint**: `GET /api/public/kb/articles?status=published` serves the Help Center -- no auth required.

---

### 3.5 Users & Team Management Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View team/user list** | NONE | FULL | FULL | UsersView in Admin dashboard; TeamSection in Superadmin |
| **View agent detail** | NONE | FULL | FULL | AgentDetails / SuperadminAgentDetails page |
| **Invite new user** | NONE | FULL | FULL | Email invite dialog |
| **Edit user role** (Agent/Admin) | NONE | FULL | FULL | Role dropdown |
| **Deactivate user** | NONE | FULL | FULL | Sets status to "Deactivated" via agentStatusStore |
| **Assign projects to user** | NONE | FULL | FULL | Checkbox list in AgentDetails |
| **Update own profile** | FULL | FULL | FULL | ProfileSettings page |
| **Update own status** (Active/Away/Offline) | FULL | FULL | FULL | UpdateStatusDialog from profile dropdown |
| **Impersonate user** | NONE | NONE | FULL | Superadmin only, for debugging |

**Backend guard**: `users.company_id = :currentUserCompanyId`. Superadmin bypasses company filter.

---

### 3.6 Company Management Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View company list** | NONE | NONE | FULL | Superadmin CompaniesSection |
| **View company detail** | NONE | VIEW | FULL | Admin sees own company info only |
| **Create company** | NONE | NONE | FULL | Superadmin only |
| **Edit company** (name, email, location, status) | NONE | NONE | FULL | CompanyDetailView Edit dialog |
| **Archive/Restore company** | NONE | NONE | FULL | Archive disables all mutations |
| **Delete company** | NONE | NONE | FULL | Destructive action with name confirmation |

---

### 3.7 Billing & Subscriptions Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View billing page** | VIEW | FULL | FULL | Agent has `isReadOnly` flag -- sees plan, usage, invoices but cannot change |
| **Change plan** | NONE | FULL | FULL | ChangePlan dialog with upgrade/downgrade |
| **Toggle billing cycle** | NONE | FULL | FULL | Monthly/Annual toggle |
| **Manage payment methods** | NONE | FULL | FULL | Add/update card via Stripe-style dialog |
| **View invoices** | VIEW | FULL | FULL | Agent sees invoice history read-only |
| **Download invoice PDF** | VIEW | FULL | FULL | |
| **Cancel subscription** | NONE | FULL | FULL | Destructive confirmation flow |
| **Configure plan pricing** | NONE | NONE | FULL | Superadmin Plans section |

**Backend guard**: Agent billing: read-only endpoints only. Admin: full CRUD scoped to `company_id`. Superadmin: cross-company access for plan configuration.

---

### 3.8 Reports & Analytics Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View reports** | NONE | FULL | FULL | Currently "Coming Soon" placeholder |
| **View analytics** | NONE | NONE | FULL | Platform-wide analytics (Superadmin only) |
| **Export data** | NONE | FULL | FULL | Future feature |

---

### 3.9 Integrations Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View integrations** | NONE | FULL | NONE | Currently "Coming Soon" placeholder; Admin dashboard only |
| **Configure integrations** | NONE | FULL | NONE | Future feature |

---

### 3.10 System Administration Module

| Action | Agent | Admin | Superadmin | Notes |
|---|:---:|:---:|:---:|---|
| **View system logs** | NONE | NONE | FULL | Log viewer with severity filters |
| **View notifications** | FULL | FULL | FULL | NotificationsPage, Bell dropdown |
| **Mark notifications read** | FULL | FULL | FULL | |
| **Manage platform settings** | NONE | NONE | FULL | Plan pricing, platform config |

---

## 4. Consolidated Permission Grid

Quick-reference table using symbols:

| Symbol | Meaning |
|---|---|
| **F** | Full access |
| **O** | Own/limited (assigned items, own projects, own records) |
| **R** | Read-only / View-only |
| **-** | No access |

| Module / Feature | Agent | Admin | Superadmin |
|---|:---:|:---:|:---:|
| **Tickets** - View | O | F | F |
| **Tickets** - Create | F | F | F |
| **Tickets** - Edit/Assign | O | F | F |
| **Tickets** - Delete | - | F | F |
| **Chats** - View | O | F | F |
| **Chats** - Send/Respond | O | F | F |
| **Chats** - Transfer | O | F | F |
| **Chats** - Close | O | F | F |
| **Projects** - View | O | F | F |
| **Projects** - Create/Edit | - | F | F |
| **Projects** - Delete | - | F | F |
| **Projects** - Configure (widget, AI) | - | F | F |
| **Knowledge Base** - View (internal) | O | F | F |
| **Knowledge Base** - Create/Edit | O | F | F |
| **Knowledge Base** - Delete/Publish | - | F | F |
| **Knowledge Base** - AI Generate | - | F | F |
| **Users** - View team | - | F | F |
| **Users** - Invite/Edit/Deactivate | - | F | F |
| **Users** - Assign projects | - | F | F |
| **Users** - Own profile | F | F | F |
| **Users** - Impersonate | - | - | F |
| **Companies** - View list | - | - | F |
| **Companies** - CRUD | - | - | F |
| **Companies** - Archive/Restore | - | - | F |
| **Billing** - View | R | F | F |
| **Billing** - Manage (plan, payment, cancel) | - | F | F |
| **Billing** - Configure pricing | - | - | F |
| **Reports** | - | F | F |
| **Analytics** (platform) | - | - | F |
| **Integrations** | - | F | - |
| **System Logs** | - | - | F |
| **Notifications** | F | F | F |
| **Profile Settings** | F | F | F |

---

## 5. Public (Unauthenticated) Endpoints

These endpoints require NO authentication. They serve the marketing site, help center, and chat widget:

| HTTP Method | Route Pattern | Purpose | Notes |
|---|---|---|---|
| GET | `/api/public/kb/articles` | Help Center article list | Only `status = 'published'` articles |
| GET | `/api/public/kb/articles/:id` | Help Center article detail | Only if published |
| GET | `/api/public/kb/categories` | Help Center category list | For navigation/filtering |
| POST | `/api/public/widget/:widgetId/chat` | Start a new chat via widget | Creates `customers` record if needed (matched by email); creates `chats` row |
| POST | `/api/public/widget/:widgetId/chat/:chatId/message` | Send message in widget chat | Appends to `chat_messages` |
| GET | `/api/public/widget/:widgetId/chat/:chatId/messages` | Load widget chat history | For reconnecting visitors |
| POST | `/api/public/tickets` | Submit a ticket (from help center / widget) | Creates `customers` record if needed; creates `tickets` row |

**Widget identification**: The chat widget is embedded on customer websites using a project-scoped `widget_id` from `chat_widget_configs`. This ID identifies the project (and therefore the company) without requiring user authentication.

**Customer record creation flow**:
```
1. Visitor opens chat widget or submits ticket
2. Visitor provides name + email
3. Backend: SELECT * FROM customers WHERE email = :email AND company_id = :companyId
4. If not found: INSERT INTO customers (id, company_id, name, email) VALUES (...)
5. Link the new ticket/chat to customers.id
6. All future tickets/chats with the same email are automatically linked
```

---

## 6. Middleware Guard Implementation Notes

### 6.1 Recommended Middleware Stack

```
Request -> AuthMiddleware -> TenantMiddleware -> RoleGuard -> Handler

1. AuthMiddleware:
   - Validates JWT token
   - Extracts user_id, company_id, role from token payload
   - Rejects unauthenticated requests (401)
   - SKIPPED for public endpoints (Section 5)

2. TenantMiddleware:
   - Injects company_id into all DB queries
   - Ensures cross-tenant data isolation
   - Superadmin bypasses when accessing company management APIs
   - Public endpoints derive company_id from widget_id or route context

3. RoleGuard:
   - Checks user.role against required permission for the endpoint
   - Returns 403 Forbidden if insufficient permissions
   - Agent-specific guards add project assignment checks
   - NOT applied to public endpoints
```

### 6.2 Key SQL Patterns for Guard Enforcement

```sql
-- Tenant isolation (ALL authenticated queries except superadmin cross-company)
AND company_id = :currentUserCompanyId

-- Agent ticket visibility
AND (
  assigned_to = :currentUserId
  OR project_id IN (
    SELECT project_id FROM user_project_assignments
    WHERE user_id = :currentUserId
  )
)

-- Agent chat visibility
AND (
  assigned_to = :currentUserId
  OR project_id IN (
    SELECT project_id FROM user_project_assignments
    WHERE user_id = :currentUserId
  )
)

-- Agent KB visibility (through category -> project chain)
AND category_id IN (
  SELECT kc.id FROM kb_categories kc
  WHERE kc.project_id IN (
    SELECT project_id FROM user_project_assignments
    WHERE user_id = :currentUserId
  )
)
```

### 6.3 Status-Based Guards

Some permissions are also affected by entity status:

| Entity Status | Effect |
|---|---|
| `companies.status = 'Archived'` | All mutative actions disabled for that company. Read-only. |
| `companies.status = 'Suspended'` | Login blocked; all API access denied for company users. |
| `users.status = 'Deactivated'` | Login blocked; agent removed from assignment pools. |
| `users.status = 'Invited'` | Limited access; pending onboarding completion. |
| `projects.status = 'Disabled'` | New tickets/chats cannot be created; existing data read-only. |

---

## 7. API Route Guard Reference

### Authenticated Endpoints

| HTTP Method | Route Pattern | Min Role | Additional Guard |
|---|---|---|---|
| GET | `/api/tickets` | Agent | + project assignment filter |
| POST | `/api/tickets` | Agent | |
| PATCH | `/api/tickets/:id` | Agent | + must be assigned or Admin+ |
| DELETE | `/api/tickets/:id` | Admin | |
| GET | `/api/chats` | Agent | + project assignment filter |
| POST | `/api/chats/:id/messages` | Agent | + must be assigned or Admin+ |
| POST | `/api/chats/:id/transfer` | Agent | + must be assigned |
| GET | `/api/projects` | Agent | + returns only assigned projects |
| POST | `/api/projects` | Admin | |
| PATCH | `/api/projects/:id` | Admin | |
| DELETE | `/api/projects/:id` | Admin | |
| GET | `/api/kb/articles` | Agent | + project assignment filter via category |
| POST | `/api/kb/articles` | Agent | + category must be in assigned project |
| DELETE | `/api/kb/articles/:id` | Admin | |
| GET | `/api/users` | Admin | |
| POST | `/api/users/invite` | Admin | |
| PATCH | `/api/users/:id/role` | Admin | |
| PATCH | `/api/users/:id/status` | Admin | (own status: Agent+) |
| GET | `/api/companies` | Superadmin | |
| POST | `/api/companies` | Superadmin | |
| PATCH | `/api/companies/:id` | Superadmin | |
| DELETE | `/api/companies/:id` | Superadmin | |
| GET | `/api/billing` | Agent | (read-only for Agent) |
| POST | `/api/billing/change-plan` | Admin | |
| POST | `/api/billing/payment-method` | Admin | |
| POST | `/api/billing/cancel` | Admin | |
| GET | `/api/subscription-plans` | Superadmin | (public read for pricing page) |
| PATCH | `/api/subscription-plans/:id` | Superadmin | |
| GET | `/api/analytics` | Superadmin | |
| GET | `/api/system-logs` | Superadmin | |
