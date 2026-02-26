# LinoChat - Quick Reference Legend

**Audience**: OpenClaw backend worker

This document explains all symbols, colors, notation, and conventions used across the LinoChat documentation suite.

---

## 1. Document Index

| Document | Path | Purpose |
|---|---|---|
| **Architecture** | `/docs/architecture.md` | Component tree, route map, refactoring status, pending items |
| **Project Spec** | `/docs/project-spec.md` | Role hierarchy, feature list with priorities/status, non-functional requirements |
| **Database Schema** | `/docs/database-schema.md` | Full MySQL 8 schema: 24 CREATE TABLE statements with constraints, indexes, enums |
| **ERD** | `/docs/erd.md` | Entity-Relationship Diagram with all tables, fields, relationships, and module color coding |
| **RBAC Permissions** | `/docs/rbac-permissions.md` | Role guards, permission matrix, middleware patterns, API route guards |
| **Quick Reference** | `/docs/quick-reference.md` | This file -- legend for all symbols and conventions |

---

## 2. ERD Color Coding

| Color | Module | Description | Key Tables |
|---|---|---|---|
| **BLUE** | Users & Organizations | Multi-tenant core: companies, internal staff, end-user customers | `companies`, `users`, `customers`, `user_notification_preferences`, `user_availability_settings` |
| **GREEN** | Tickets & Support | Support ticket lifecycle and conversation threads | `tickets`, `ticket_messages` |
| **PURPLE** | Live Chat | Real-time chat sessions, messages, and agent transfers | `chats`, `chat_messages`, `chat_transfers` |
| **ORANGE** | Projects | Organizational units with widget and AI configuration | `projects`, `user_project_assignments`, `chat_widget_configs`, `project_ai_settings` |
| **YELLOW** | Billing & Subscriptions | Plans, subscriptions, payment methods, invoices | `subscription_plans`, `company_subscriptions`, `payment_methods`, `invoices` |
| **TEAL** | Knowledge Base | Article categories and articles with AI generation support | `kb_categories`, `kb_articles` |
| **GRAY** | System | Notifications, activity logs, customer session tracking | `notifications`, `activity_logs`, `customer_sessions`, `customer_page_visits` |

---

## 3. Relationship Symbols (Crow's Foot Notation)

```
  SYMBOL          MEANING                 EXAMPLE

  ||------||      One-to-One (1:1)        users ||------|| user_notification_preferences
                                           Each user has exactly one preferences row

  ||------<       One-to-Many (1:N)       companies ||------< projects
                                           One company has many projects

  >------<        Many-to-Many (M:N)      users >------< projects
                  (via join table)          Via user_project_assignments table
```

### FK Constraint Actions

| Action | Symbol in Docs | Meaning |
|---|---|---|
| `CASCADE` | CASCADE | Deleting parent deletes all children |
| `SET NULL` | SET NULL | Deleting parent sets FK column to NULL |
| `RESTRICT` | RESTRICT | Cannot delete parent while children exist |

---

## 4. Permission Matrix Symbols

### Full Permission Grid (in rbac-permissions.md)

| Symbol | Meaning | Description |
|---|---|---|
| **F** | Full access | Can view, create, edit, and delete |
| **O** | Own/limited | Can only access records they own, are assigned to, or belong to their assigned projects |
| **R** | Read-only | Can view but cannot create, edit, or delete |
| **-** | No access | Cannot access this feature at all; API returns 403 |

### Detailed Permission Tables

| Symbol | Meaning | Description |
|---|---|---|
| **FULL** | Full access | Unrestricted within tenant scope |
| **OWN** | Own/limited access | Restricted to own records or assigned project scope |
| **VIEW** | View-only | Read access only; write operations blocked |
| **NONE** | No access | Feature hidden in UI; API rejects with 403 |

---

## 5. Feature Status Labels (in project-spec.md)

| Status | Meaning |
|---|---|
| **Implemented** | Feature is fully built and functional in the frontend |
| **Partial** | Feature exists but is incomplete (e.g., UI exists but no backend persistence) |
| **UI only** | Frontend form/page exists but submits to `console.log()` -- no real backend |
| **Broken** | Feature exists but is non-functional (e.g., state variable exists but no UI control) |
| **Missing** | Feature does not exist yet -- needs to be built |
| **Coming Soon** | Placeholder UI exists (icon + title + preview grid) but no real functionality |
| **Removed** | Feature was intentionally removed from the application |
| **Displayed** | Data is shown read-only from mock data -- needs real backend |

---

## 6. Priority Levels (in project-spec.md)

| Level | Label | Meaning |
|---|---|---|
| **P0** | Critical | Must work for product to be usable. Launch blocker. |
| **P1** | High | Core experience. Expected by all users at launch. |
| **P2** | Medium | Important but can ship in a fast follow-up. |
| **P3** | Low | Nice to have. Planned for future iterations. |

---

## 7. User Roles Quick Reference

LinoChat has **3 authenticated roles** (Superadmin, Admin, Agent). Customers and Visitors are **not roles** -- they are unauthenticated entities.

### Authenticated Roles

| Role | DB Location | Dashboard Path | Sidebar Items |
|---|---|---|---|
| **Superadmin** | Platform operator (separate auth) | `/superadmin/*` | Dashboard, Chats, Companies, Team, Plans, Analytics, System Logs |
| **Admin** | `users.role = 'Admin'` | `/admin/*` | Dashboard, Chats, Tickets, Knowledge, Projects, Users, Reports, Integrations |
| **Agent** | `users.role = 'Agent'` | `/agent/*` | Dashboard, Chats, Tickets, Knowledge |

### Unauthenticated Entities (NOT roles)

| Entity | DB Record | Auth | Description |
|---|---|---|---|
| **Visitor** | None | No | Anonymous person. Browses marketing site, help center, uses chat widget. |
| **Customer** | `customers` table (created on first ticket/chat) | No | A visitor who has created at least one ticket or chat. Tracking entity only -- used to link ticket/chat history by email. Never logs in, no password, no dashboard. |

**Lifecycle**: Visitor --> creates ticket or chat --> `customers` row created (matched by email) --> future interactions linked automatically

---

## 8. Agent Status Reference

| Status | Dot Color | Badge Style | Login | Assignable | Notes |
|---|---|---|---|---|---|
| **Active** | Green | Default | Yes | Yes | Currently working, accepting chats |
| **Away** | Yellow | Secondary | Yes | Yes | Temporarily unavailable |
| **Offline** | Gray | Outline | Yes | No | Not currently working |
| **Deactivated** | Red | Destructive | No | No | Account disabled by Admin |
| **Invited** | Blue | Blue outline | No | No | Pending onboarding; hasn't set password yet |

Stored in: `users.status` column (ENUM)
Frontend sync: `agentStatusStore` (`useSyncExternalStore`)

---

## 9. Company Status Reference

| Status | Badge Color | Effect |
|---|---|---|
| **Active** | Green | Normal operation; all features enabled |
| **Archived** | Amber | Read-only mode; all mutative actions disabled; warning banner shown; can be restored |
| **Suspended** | Red | Login blocked; all API access denied for company users |

Stored in: `companies.status` column (ENUM)

---

## 10. Database Naming Conventions

| Convention | Pattern | Example |
|---|---|---|
| Primary key | `id VARCHAR(36)` | UUID format |
| Foreign key column | `{entity}_id` | `company_id`, `project_id`, `user_id` |
| FK constraint name | `fk_{table}_{reference}` | `fk_tickets_company`, `fk_users_company` |
| Index name | `idx_{table}_{column(s)}` | `idx_tickets_status`, `idx_users_company` |
| Unique index name | `uq_{table}_{column(s)}` | `uq_users_email`, `uq_user_project` |
| Fulltext index | `ft_{table}_{column}` | `ft_kb_articles_title` |
| Timestamps | `created_at`, `updated_at` | Always `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| Soft timestamps | `deleted_at`, `archived_at`, `closed_at` | `DATETIME NULL` -- NULL means not deleted/archived/closed |
| Boolean columns | `is_{adjective}` or descriptive name | `is_read`, `is_ai_bot`, `is_default`, `two_factor_enabled` |
| Counter columns | Descriptive name | `unread_count`, `article_count`, `total_tickets` |
| Enum columns | Lowercase values for internal; Title Case for display | `status ENUM('open','pending','closed')` vs `ENUM('Active','Archived')` |
| JSON columns | Descriptive name | `features JSON`, `tags JSON` |

---

## 11. API Response Codes Reference

| Code | Meaning | When Used |
|---|---|---|
| `200 OK` | Success | GET, PATCH requests |
| `201 Created` | Resource created | POST requests |
| `204 No Content` | Success, no body | DELETE requests |
| `400 Bad Request` | Invalid input | Validation failures |
| `401 Unauthorized` | Not authenticated | Missing/invalid JWT |
| `403 Forbidden` | Insufficient permissions | Role guard rejection |
| `404 Not Found` | Resource doesn't exist | Invalid ID or cross-tenant access attempt |
| `409 Conflict` | Duplicate resource | Unique constraint violation (e.g., duplicate email) |
| `422 Unprocessable Entity` | Business rule violation | e.g., cannot delete archived company, plan limit exceeded |
| `500 Internal Server Error` | Server error | Unexpected failures |

---

## 12. Multi-Tenancy Key Rules

1. **Every query must include `company_id`** -- except `subscription_plans` (platform-wide) and Superadmin cross-company queries
2. **Users and Customers are separate tables** -- `users` = internal staff (agents/admins), `customers` = external end-users
3. **Projects are the organizational boundary** -- tickets, chats, KB categories, widget configs, and AI settings all belong to a project
4. **Agent visibility is project-scoped** -- agents only see data from projects they are assigned to via `user_project_assignments`
5. **Cascade deletes propagate from company** -- deleting a company cascades to all its projects, users, tickets, chats, etc.
6. **Assigned-to uses SET NULL** -- deleting a user sets `tickets.assigned_to` and `chats.assigned_to` to NULL (not cascade)
7. **Subscription plans use RESTRICT** -- cannot delete a plan that has active subscriptions