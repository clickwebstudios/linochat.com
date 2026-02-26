# LinoChat - MySQL Database Schema

**Database**: MySQL 8.0 | **Engine**: InnoDB | **Charset**: utf8mb4_unicode_ci | **Audience**: OpenClaw backend worker

This document defines the MySQL relational schema for all data entities in the LinoChat platform. Every table, column, relationship, index, and constraint is derived from the mock data structures, UI fields, and business rules observed in the codebase.

See also: [ERD](/docs/erd.md) | [RBAC Permissions](/docs/rbac-permissions.md) | [Quick Reference](/docs/quick-reference.md)

---

## Table of Contents

1. [Entity-Relationship Summary](#1-entity-relationship-summary)
2. [Table Definitions](#2-table-definitions)
   - [Core Tenancy](#21-core-tenancy)
   - [Users & Authentication](#22-users--authentication)
   - [Projects](#23-projects)
   - [Tickets](#24-tickets)
   - [Live Chat](#25-live-chat)
   - [Knowledge Base](#26-knowledge-base)
   - [Chat Transfers](#27-chat-transfers)
   - [Billing & Subscriptions](#28-billing--subscriptions)
   - [Notifications](#29-notifications)
   - [Customer Activity Tracking](#210-customer-activity-tracking)
   - [Project Configuration](#211-project-configuration)
   - [Activity Logs](#212-activity-logs)
3. [Relationship Map](#3-relationship-map)
4. [Indexes](#4-indexes)
5. [Enum Reference](#5-enum-reference)

---

## 1. Entity-Relationship Summary

```
companies ─────┬───< projects ───────┬───< tickets
               │                     ├───< chats ───< chat_messages
               │                     ├───< kb_categories ───< kb_articles
               │                     ├───< chat_widget_configs
               │                     ├───< project_ai_settings
               │                     └───< user_project_assignments >─── users
               │
               ├───< users ──────────┬───< user_notification_preferences
               │                     ├───< user_availability_settings
               │                     ├───< activity_logs
               │                     └───< notifications
               │
               ├───< company_subscriptions ───> subscription_plans
               ├───< invoices
               └───< payment_methods

customers ─────┬───< tickets
               ├───< chats
               └───< customer_sessions ───< customer_page_visits

chat_transfers ───> chats, users (from/to)
```

---

## 2. Table Definitions

### 2.1 Core Tenancy

#### `companies`

The top-level multi-tenant entity. Every project, user, and subscription belongs to a company.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID. Maps to `comp-1`, `comp-2`, etc. |
| `name` | `VARCHAR(255)` | `NOT NULL` | e.g. "TechCorp Solutions" |
| `email` | `VARCHAR(255)` | `NOT NULL` | Primary contact email |
| `location` | `VARCHAR(255)` | `NULL` | e.g. "San Francisco, CA" |
| `status` | `ENUM('Active','Archived','Suspended')` | `NOT NULL DEFAULT 'Active'` | Archived disables all mutations |
| `plan` | `ENUM('Free','Starter','Pro','Enterprise')` | `NOT NULL DEFAULT 'Free'` | Current plan tier |
| `archived_reason` | `TEXT` | `NULL` | Optional reason provided during archive |
| `archived_at` | `DATETIME` | `NULL` | Timestamp of archive action |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE companies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  location VARCHAR(255) NULL,
  status ENUM('Active','Archived','Suspended') NOT NULL DEFAULT 'Active',
  plan ENUM('Free','Starter','Pro','Enterprise') NOT NULL DEFAULT 'Free',
  archived_reason TEXT NULL,
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockCompanies` in `mockData.ts`, `CompanyDetailView.tsx` (Edit, Archive, Delete flows)

---

### 2.2 Users & Authentication

#### `users`

Agents and admins within a company. The logged-in user's profile is managed via `ProfileSettings.tsx`; team members are managed via `UsersView.tsx` and `AgentDetails.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID. Maps to agent ids `'1'`-`'6'` |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | Tenant isolation |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Login identifier |
| `phone` | `VARCHAR(50)` | `NULL` | e.g. "+1 (555) 123-4567" |
| `location` | `VARCHAR(255)` | `NULL` | e.g. "San Francisco, CA" |
| `country` | `CHAR(2)` | `NULL` | ISO 3166-1 alpha-2 code |
| `bio` | `TEXT` | `NULL` | Free-text biography |
| `avatar_url` | `VARCHAR(512)` | `NULL` | Profile photo URL |
| `role` | `ENUM('Agent','Admin')` | `NOT NULL DEFAULT 'Agent'` | Determines sidebar visibility |
| `status` | `ENUM('Active','Away','Offline','Deactivated','Invited')` | `NOT NULL DEFAULT 'Invited'` | Synced via `agentStatusStore` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash |
| `two_factor_enabled` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | From ProfileSettings security section |
| `last_active_at` | `DATETIME` | `NULL` | e.g. "5 min ago", "Never" |
| `join_date` | `DATE` | `NOT NULL` | Display field in AgentDetails |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  location VARCHAR(255) NULL,
  country CHAR(2) NULL,
  bio TEXT NULL,
  avatar_url VARCHAR(512) NULL,
  role ENUM('Agent','Admin') NOT NULL DEFAULT 'Agent',
  status ENUM('Active','Away','Offline','Deactivated','Invited') NOT NULL DEFAULT 'Invited',
  password_hash VARCHAR(255) NOT NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at DATETIME NULL,
  join_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_company (company_id),
  KEY idx_users_status (status),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `UsersView.tsx` (mockAgentsList), `AgentDetails.tsx` (allAgents), `ProfileSettings.tsx` (profile form), `agentStatusStore.ts` (status enum)

---

#### `user_notification_preferences`

Per-user notification settings from the Profile Settings page.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `user_id` | `VARCHAR(36)` | `NOT NULL, UNIQUE, FK → users.id` | One row per user |
| `email_notifications` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | "Receive email about new tickets and updates" |
| `desktop_notifications` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | "Show desktop notifications for new messages" |
| `sound_alerts` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | "Play sound when receiving new messages" |
| `weekly_summary` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | "Get a weekly summary of your performance" |

```sql
CREATE TABLE user_notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  desktop_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sound_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_user_notif_prefs (user_id),
  CONSTRAINT fk_user_notif_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `ProfileSettings.tsx` (Notification Preferences card)

---

#### `user_availability_settings`

Per-user availability configuration from the Profile Settings page.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `user_id` | `VARCHAR(36)` | `NOT NULL, UNIQUE, FK → users.id` | One row per user |
| `auto_accept_chats` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | "Automatically accept incoming chat requests" |
| `max_concurrent_chats` | `TINYINT UNSIGNED` | `NOT NULL DEFAULT 5` | Range: 1-10 |

```sql
CREATE TABLE user_availability_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  auto_accept_chats BOOLEAN NOT NULL DEFAULT TRUE,
  max_concurrent_chats TINYINT UNSIGNED NOT NULL DEFAULT 5,
  UNIQUE KEY uq_user_avail_settings (user_id),
  CONSTRAINT fk_user_avail_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `ProfileSettings.tsx` (Availability Settings card)

---

### 2.3 Projects

#### `projects`

Projects are the primary organizational unit within a company. Each project has its own tickets, chats, KB categories, widget config, and AI settings.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID. Maps to `proj-1` through `proj-7` |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | Tenant isolation |
| `name` | `VARCHAR(255)` | `NOT NULL` | e.g. "E-Commerce Site" |
| `description` | `TEXT` | `NULL` | From AddProjectDialog / SettingsTab |
| `color` | `CHAR(7)` | `NOT NULL DEFAULT '#3B82F6'` | Hex color for UI dot/badge |
| `website` | `VARCHAR(512)` | `NULL` | Associated website URL |
| `status` | `ENUM('Active','Disabled')` | `NOT NULL DEFAULT 'Active'` | From SettingsTab dropdown |
| `total_tickets` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Denormalized counter |
| `active_tickets` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Denormalized counter |
| `member_count` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Denormalized counter |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  color CHAR(7) NOT NULL DEFAULT '#3B82F6',
  website VARCHAR(512) NULL,
  status ENUM('Active','Disabled') NOT NULL DEFAULT 'Active',
  total_tickets INT UNSIGNED NOT NULL DEFAULT 0,
  active_tickets INT UNSIGNED NOT NULL DEFAULT 0,
  member_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_projects_company (company_id),
  KEY idx_projects_status (status),
  CONSTRAINT fk_projects_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockProjects` in `mockData.ts`, `AddProjectDialog.tsx`, `SettingsTab.tsx`, `ProjectSelector.tsx`

---

#### `user_project_assignments`

Many-to-many join table linking users (agents/admins) to projects. Managed via the "Assign Projects" tab in `AgentDetails.tsx` and the Assign Projects dialog in `UsersView.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `user_id` | `VARCHAR(36)` | `NOT NULL, FK → users.id` | |
| `project_id` | `VARCHAR(36)` | `NOT NULL, FK → projects.id` | |
| `assigned_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE user_project_assignments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_project (user_id, project_id),
  KEY idx_upa_project (project_id),
  CONSTRAINT fk_upa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_upa_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `AgentDetails.tsx` (Assign Projects tab with checkbox list), `UsersView.tsx` (Assign Projects dropdown action), `AgentDashboard.tsx` (project filter filters agents by assigned projects)

---

### 2.4 Tickets

#### `customers`

End-users who create tickets and initiate chats. Distinct from `users` (agents/admins). **This is a tracking entity, NOT an authenticated role.** A visitor becomes a `customers` row when they create their first ticket or chat (identified by email). Customers never log in, have no password, and have no dashboard.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | Which company's customer |
| `name` | `VARCHAR(255)` | `NOT NULL` | e.g. "John Doe", "Lisa Anderson" |
| `email` | `VARCHAR(255)` | `NOT NULL` | e.g. "lisa.anderson@email.com" |
| `avatar` | `VARCHAR(10)` | `NULL` | Initials fallback, e.g. "LA" |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar VARCHAR(10) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_customers_company (company_id),
  KEY idx_customers_email (email),
  CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockTickets.customer`, `mockChats.customer`, `mockCustomerActivity`

---

#### `tickets`

Support tickets created by customers or agents. Viewed in `TicketsView.tsx` and `TicketDetails.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | Display ID e.g. "T-1001" |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | Tenant isolation |
| `project_id` | `VARCHAR(36)` | `NOT NULL, FK → projects.id` | Which project this ticket belongs to |
| `customer_id` | `VARCHAR(36)` | `NULL, FK → customers.id` | The customer who created it |
| `assigned_to` | `VARCHAR(36)` | `NULL, FK → users.id` | Agent assigned to this ticket |
| `subject` | `VARCHAR(500)` | `NOT NULL` | Ticket subject line |
| `description` | `TEXT` | `NULL` | Detailed description |
| `status` | `ENUM('open','pending','closed')` | `NOT NULL DEFAULT 'open'` | Filter tabs in TicketsView |
| `priority` | `ENUM('low','medium','high')` | `NOT NULL DEFAULT 'medium'` | Color-coded badges |
| `category` | `ENUM('Technical Support','Billing','Feature Request','Bug Report','Account Issue','General Inquiry')` | `NULL` | From CreateTicketDialog category dropdown |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Maps to `created` field |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Maps to `lastUpdate` field |

```sql
CREATE TABLE tickets (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NULL,
  assigned_to VARCHAR(36) NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NULL,
  status ENUM('open','pending','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  category ENUM('Technical Support','Billing','Feature Request','Bug Report','Account Issue','General Inquiry') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tickets_company (company_id),
  KEY idx_tickets_project (project_id),
  KEY idx_tickets_assigned (assigned_to),
  KEY idx_tickets_status (status),
  KEY idx_tickets_priority (priority),
  KEY idx_tickets_created (created_at),
  CONSTRAINT fk_tickets_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockTickets` in `mockData.ts`, `TicketsView.tsx` (filters, table columns), `CreateTicketDialog.tsx` (NewTicket interface)

---

#### `ticket_messages`

Conversation thread within a ticket (visible in `TicketDetails.tsx`).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `ticket_id` | `VARCHAR(36)` | `NOT NULL, FK → tickets.id` | |
| `sender_type` | `ENUM('customer','agent','system')` | `NOT NULL` | Who sent the message |
| `sender_id` | `VARCHAR(36)` | `NULL` | FK to `customers.id` or `users.id` depending on sender_type |
| `body` | `TEXT` | `NOT NULL` | Message content |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE ticket_messages (
  id VARCHAR(36) PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  sender_type ENUM('customer','agent','system') NOT NULL,
  sender_id VARCHAR(36) NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ticket_msgs_ticket (ticket_id),
  KEY idx_ticket_msgs_created (created_at),
  CONSTRAINT fk_ticket_msgs_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `TicketDetails.tsx` (conversation thread)

---

### 2.5 Live Chat

#### `chats`

Live chat sessions between customers and agents. Viewed in `ChatsView.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | e.g. "C-501" |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | Tenant isolation |
| `project_id` | `VARCHAR(36)` | `NOT NULL, FK → projects.id` | Project-level filtering |
| `customer_id` | `VARCHAR(36)` | `NOT NULL, FK → customers.id` | |
| `assigned_to` | `VARCHAR(36)` | `NULL, FK → users.id` | Current agent or NULL for AI Bot |
| `status` | `ENUM('active','waiting','closed','offline')` | `NOT NULL DEFAULT 'active'` | Chat list filter |
| `is_ai_bot` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | True when handled by AI |
| `unread_count` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Unread message badge count |
| `last_message_preview` | `VARCHAR(500)` | `NULL` | Truncated preview for chat list |
| `last_message_at` | `DATETIME` | `NULL` | For sort ordering |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `closed_at` | `DATETIME` | `NULL` | When the chat was closed |

```sql
CREATE TABLE chats (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  assigned_to VARCHAR(36) NULL,
  status ENUM('active','waiting','closed','offline') NOT NULL DEFAULT 'active',
  is_ai_bot BOOLEAN NOT NULL DEFAULT FALSE,
  unread_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_message_preview VARCHAR(500) NULL,
  last_message_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  KEY idx_chats_company (company_id),
  KEY idx_chats_project (project_id),
  KEY idx_chats_assigned (assigned_to),
  KEY idx_chats_status (status),
  KEY idx_chats_last_msg (last_message_at),
  CONSTRAINT fk_chats_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_chats_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_chats_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_chats_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockChats` in `mockData.ts`, `ChatsView.tsx` (chat list, filters, agent attribution)

---

#### `chat_messages`

Individual messages within a chat session. Viewed in the `ChatsView.tsx` conversation panel.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `chat_id` | `VARCHAR(36)` | `NOT NULL, FK → chats.id` | |
| `sender_type` | `ENUM('customer','agent','bot','system')` | `NOT NULL` | Who sent the message |
| `sender_id` | `VARCHAR(36)` | `NULL` | FK to `customers.id` or `users.id` |
| `body` | `TEXT` | `NOT NULL` | Message text content |
| `is_read` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Read receipts |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Maps to `timestamp` |

```sql
CREATE TABLE chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  chat_id VARCHAR(36) NOT NULL,
  sender_type ENUM('customer','agent','bot','system') NOT NULL,
  sender_id VARCHAR(36) NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_msgs_chat (chat_id),
  KEY idx_chat_msgs_created (created_at),
  KEY idx_chat_msgs_read (chat_id, is_read),
  CONSTRAINT fk_chat_msgs_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockChatMessages` in `mockData.ts` (id, chatId, sender, text, timestamp, isRead)

---

### 2.6 Knowledge Base

#### `kb_categories`

Knowledge base article categories. Each category belongs to a project. Managed in the `AgentKnowledgeView.tsx` sidebar and `CategoryDialogs.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID. Maps to category ids `'1'`-`'4'` |
| `project_id` | `VARCHAR(36)` | `NOT NULL, FK → projects.id` | Category is scoped to a project |
| `name` | `VARCHAR(255)` | `NOT NULL` | e.g. "Getting Started", "Billing & Payments" |
| `article_count` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Denormalized counter |
| `sort_order` | `INT` | `NOT NULL DEFAULT 0` | Display ordering in sidebar |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE kb_categories (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  article_count INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_kb_cat_project (project_id),
  CONSTRAINT fk_kb_cat_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `AgentKnowledgeView.tsx` (categories state with `id`, `name`, `articleCount`, `projectId`), `AddCategoryDialog` in `CategoryDialogs.tsx` (project selector + name field), `NewKBArticleDialog.tsx` (Step 2 category selection filtered by project)

---

#### `kb_articles`

Knowledge base articles. Viewed in `AgentKnowledgeView.tsx` article list and `ArticleDetails.tsx` detail page.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID. Maps to `a1`-`a31` |
| `category_id` | `VARCHAR(36)` | `NOT NULL, FK → kb_categories.id` | |
| `title` | `VARCHAR(500)` | `NOT NULL` | Article title |
| `excerpt` | `TEXT` | `NULL` | Short summary |
| `content` | `LONGTEXT` | `NULL` | Full article body (HTML/Markdown) |
| `status` | `ENUM('published','draft')` | `NOT NULL DEFAULT 'draft'` | Draft shows Save/Publish buttons |
| `author_id` | `VARCHAR(36)` | `NULL, FK → users.id` | Article author |
| `views` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | View counter |
| `helpful_count` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | "Was this helpful?" yes count |
| `tags` | `JSON` | `NULL` | Array of tag strings |
| `generation_method` | `ENUM('manual','ai_url','ai_description')` | `NULL` | How the article was created |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Maps to `updatedAt` |

```sql
CREATE TABLE kb_articles (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT NULL,
  content LONGTEXT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'draft',
  author_id VARCHAR(36) NULL,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
  tags JSON NULL,
  generation_method ENUM('manual','ai_url','ai_description') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_kb_articles_category (category_id),
  KEY idx_kb_articles_status (status),
  KEY idx_kb_articles_author (author_id),
  FULLTEXT KEY ft_kb_articles_title (title),
  CONSTRAINT fk_kb_articles_category FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_kb_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `AgentKnowledgeView.tsx` (categoryArticles state), `articleStore.ts` (DynamicArticle interface), `ArticleDetails.tsx`, `NewKBArticleDialog.tsx` (creation methods: manual, AI from URL, AI from description)

---

### 2.7 Chat Transfers

#### `chat_transfers`

Transfer requests between agents for live chats. Managed via `InitiateTransferDialog.tsx` and `TransferRequestsDialog.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `chat_id` | `VARCHAR(36)` | `NOT NULL, FK → chats.id` | The chat being transferred |
| `customer_id` | `VARCHAR(36)` | `NOT NULL, FK → customers.id` | |
| `from_agent_id` | `VARCHAR(36)` | `NOT NULL, FK → users.id` | Agent initiating transfer |
| `to_agent_id` | `VARCHAR(36)` | `NULL, FK → users.id` | Target agent (NULL if pending selection) |
| `project_id` | `VARCHAR(36)` | `NOT NULL, FK → projects.id` | |
| `reason` | `TEXT` | `NOT NULL` | Why the transfer is needed |
| `notes` | `TEXT` | `NULL` | Additional notes from accepting/rejecting agent |
| `status` | `ENUM('pending','accepted','rejected')` | `NOT NULL DEFAULT 'pending'` | |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Maps to `timestamp` |
| `resolved_at` | `DATETIME` | `NULL` | When accepted or rejected |

```sql
CREATE TABLE chat_transfers (
  id VARCHAR(36) PRIMARY KEY,
  chat_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  from_agent_id VARCHAR(36) NOT NULL,
  to_agent_id VARCHAR(36) NULL,
  project_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  KEY idx_transfers_chat (chat_id),
  KEY idx_transfers_to_agent (to_agent_id),
  KEY idx_transfers_status (status),
  CONSTRAINT fk_transfers_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfers_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfers_from FOREIGN KEY (from_agent_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfers_to FOREIGN KEY (to_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_transfers_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `TransferRequestsDialog.tsx` (TransferRequest interface), `InitiateTransferDialog.tsx` (TransferData interface), `AgentDashboard.tsx` (transferRequests state)

---

### 2.8 Billing & Subscriptions

#### `subscription_plans`

Platform-wide plan definitions. Configured by superadmin; referenced by company subscriptions and the BillingPage plan selector.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | e.g. "free", "starter", "pro", "enterprise" |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display name |
| `price_monthly` | `DECIMAL(10,2)` | `NOT NULL` | Monthly per-user price (-1 = custom/contact us) |
| `price_annual` | `DECIMAL(10,2)` | `NOT NULL` | Annual per-user price (-1 = custom) |
| `period_label` | `VARCHAR(50)` | `NOT NULL` | e.g. "forever", "per user/month", "contact us" |
| `agent_limit` | `INT` | `NOT NULL DEFAULT -1` | Max agents (-1 = unlimited) |
| `ticket_limit` | `INT` | `NOT NULL DEFAULT -1` | Max tickets/month (-1 = unlimited) |
| `chat_limit` | `INT` | `NOT NULL DEFAULT -1` | Max chats/month (-1 = unlimited) |
| `features` | `JSON` | `NOT NULL` | Array of feature description strings |
| `is_popular` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Highlighted in plan picker |
| `sort_order` | `INT` | `NOT NULL DEFAULT 0` | Display ordering |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE subscription_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2) NOT NULL,
  period_label VARCHAR(50) NOT NULL,
  agent_limit INT NOT NULL DEFAULT -1,
  ticket_limit INT NOT NULL DEFAULT -1,
  chat_limit INT NOT NULL DEFAULT -1,
  features JSON NOT NULL,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `BillingPage.tsx` (plans array with id, name, priceMonthly, priceAnnual, features, limits), `mockPricingPlans` in `mockData.ts`

---

#### `company_subscriptions`

A company's active subscription. One active subscription per company at a time.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | |
| `plan_id` | `VARCHAR(36)` | `NOT NULL, FK → subscription_plans.id` | |
| `billing_cycle` | `ENUM('monthly','annual')` | `NOT NULL DEFAULT 'monthly'` | Toggle in BillingPage |
| `status` | `ENUM('active','cancelled','past_due','trialing')` | `NOT NULL DEFAULT 'active'` | |
| `current_period_start` | `DATE` | `NOT NULL` | |
| `current_period_end` | `DATE` | `NOT NULL` | |
| `cancel_at_period_end` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Cancellation pending |
| `cancelled_at` | `DATETIME` | `NULL` | |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE company_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  billing_cycle ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  status ENUM('active','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_comp_sub_company (company_id),
  KEY idx_comp_sub_plan (plan_id),
  KEY idx_comp_sub_status (status),
  CONSTRAINT fk_comp_sub_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_comp_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `BillingPage.tsx` (current plan display, billing cycle toggle, cancel subscription flow)

---

#### `payment_methods`

Stored payment methods for a company. Managed via the Stripe-style dialog in `BillingPage.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | |
| `card_brand` | `ENUM('visa','mastercard','amex','discover','unknown')` | `NOT NULL` | Detected via Luhn + prefix |
| `card_last_four` | `CHAR(4)` | `NOT NULL` | Last 4 digits |
| `card_exp_month` | `TINYINT UNSIGNED` | `NOT NULL` | 1-12 |
| `card_exp_year` | `SMALLINT UNSIGNED` | `NOT NULL` | 4-digit year |
| `cardholder_name` | `VARCHAR(255)` | `NOT NULL` | |
| `is_default` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Primary payment method |
| `stripe_payment_method_id` | `VARCHAR(255)` | `NULL` | External Stripe reference |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE payment_methods (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  card_brand ENUM('visa','mastercard','amex','discover','unknown') NOT NULL,
  card_last_four CHAR(4) NOT NULL,
  card_exp_month TINYINT UNSIGNED NOT NULL,
  card_exp_year SMALLINT UNSIGNED NOT NULL,
  cardholder_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_payment_method_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pm_company (company_id),
  CONSTRAINT fk_pm_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `BillingPage.tsx` (payment method dialog with card number, expiry, CVC, cardholder name, brand detection)

---

#### `invoices`

Billing history records. Viewed in the invoice history table in `BillingPage.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | e.g. "INV-2026-0002" |
| `company_id` | `VARCHAR(36)` | `NOT NULL, FK → companies.id` | |
| `subscription_id` | `VARCHAR(36)` | `NULL, FK → company_subscriptions.id` | |
| `plan_name` | `VARCHAR(100)` | `NOT NULL` | Plan at time of invoice |
| `agent_count` | `INT UNSIGNED` | `NOT NULL` | Number of agents billed |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Total amount |
| `currency` | `CHAR(3)` | `NOT NULL DEFAULT 'USD'` | |
| `status` | `ENUM('Paid','Pending','Failed','Refunded')` | `NOT NULL DEFAULT 'Pending'` | Invoice table filter |
| `invoice_date` | `DATE` | `NOT NULL` | |
| `pdf_url` | `VARCHAR(512)` | `NULL` | Download link |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36) NULL,
  plan_name VARCHAR(100) NOT NULL,
  agent_count INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('Paid','Pending','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  invoice_date DATE NOT NULL,
  pdf_url VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoices_company (company_id),
  KEY idx_invoices_status (status),
  KEY idx_invoices_date (invoice_date),
  CONSTRAINT fk_invoices_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_sub FOREIGN KEY (subscription_id) REFERENCES company_subscriptions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `BillingPage.tsx` (mockInvoices: id, date, amount, status, plan, agents)

---

### 2.9 Notifications

#### `notifications`

Notification feed items. Viewed via the Bell icon dropdown and the `NotificationsPage.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `company_id` | `VARCHAR(36)` | `NULL, FK → companies.id` | NULL for platform-wide notifications |
| `user_id` | `VARCHAR(36)` | `NULL, FK → users.id` | Target user (NULL = broadcast to company) |
| `title` | `VARCHAR(255)` | `NOT NULL` | Notification headline |
| `description` | `TEXT` | `NOT NULL` | Detailed message |
| `type` | `ENUM('alert','security','user','billing','system','success')` | `NOT NULL` | Icon/color mapping |
| `is_read` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Read/unread state |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Maps to `time` display |

```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('alert','security','user','billing','system','success') NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id),
  KEY idx_notif_company (company_id),
  KEY idx_notif_read (is_read),
  KEY idx_notif_created (created_at),
  CONSTRAINT fk_notif_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `notificationsData.ts` (Notification interface: id, title, description, time, read, type)

---

### 2.10 Customer Activity Tracking

#### `customer_sessions`

Browsing sessions tracked for customers. Displayed in the `ChatsView.tsx` customer info side panel.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `customer_id` | `VARCHAR(36)` | `NOT NULL, FK → customers.id` | |
| `chat_id` | `VARCHAR(36)` | `NULL, FK → chats.id` | Chat initiated during this session |
| `browser` | `VARCHAR(100)` | `NULL` | e.g. "Chrome 120.0" |
| `device` | `VARCHAR(100)` | `NULL` | e.g. "Desktop - Windows", "Mobile - iPhone 15" |
| `location` | `VARCHAR(255)` | `NULL` | e.g. "San Francisco, CA" |
| `referral_source` | `VARCHAR(500)` | `NULL` | e.g. "Google Search - ...", "Direct Traffic" |
| `chat_initiated_from` | `VARCHAR(500)` | `NULL` | URL path where chat was started |
| `session_start` | `DATETIME` | `NOT NULL` | |
| `session_end` | `DATETIME` | `NULL` | NULL if still active |

```sql
CREATE TABLE customer_sessions (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  chat_id VARCHAR(36) NULL,
  browser VARCHAR(100) NULL,
  device VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  referral_source VARCHAR(500) NULL,
  chat_initiated_from VARCHAR(500) NULL,
  session_start DATETIME NOT NULL,
  session_end DATETIME NULL,
  KEY idx_cs_customer (customer_id),
  KEY idx_cs_chat (chat_id),
  CONSTRAINT fk_cs_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockCustomerActivity` in `mockData.ts` (browser, device, location, sessionStart, chatInitiatedFrom, referralSource)

---

#### `customer_page_visits`

Individual page visits within a customer session. Displayed as the activity timeline in the `ChatsView.tsx` side panel.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `session_id` | `VARCHAR(36)` | `NOT NULL, FK → customer_sessions.id` | |
| `page_title` | `VARCHAR(255)` | `NOT NULL` | e.g. "Homepage", "Pricing Page" |
| `page_url` | `VARCHAR(500)` | `NOT NULL` | e.g. "/pricing" |
| `duration` | `VARCHAR(20)` | `NULL` | e.g. "2m 15s", "Active" |
| `visited_at` | `DATETIME` | `NOT NULL` | |

```sql
CREATE TABLE customer_page_visits (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  page_title VARCHAR(255) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  duration VARCHAR(20) NULL,
  visited_at DATETIME NOT NULL,
  KEY idx_cpv_session (session_id),
  CONSTRAINT fk_cpv_session FOREIGN KEY (session_id) REFERENCES customer_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `mockCustomerActivity.pagesVisited` (page, url, timestamp, duration)

---

### 2.11 Project Configuration

#### `chat_widget_configs`

Per-project chat widget appearance and behavior settings. Managed in the `ChatWidgetTab.tsx` of ProjectDetails.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `project_id` | `VARCHAR(36)` | `NOT NULL, UNIQUE, FK → projects.id` | One config per project |
| `widget_id` | `VARCHAR(64)` | `NOT NULL` | Embed ID for script tag |
| `design_style` | `ENUM('modern','classic','minimal')` | `NOT NULL DEFAULT 'modern'` | Widget visual style |
| `primary_color` | `CHAR(7)` | `NOT NULL DEFAULT '#3B82F6'` | Hex color |
| `offline_behavior` | `ENUM('hide','show_form','show_message')` | `NOT NULL DEFAULT 'hide'` | What to show when offline |
| `offline_message` | `TEXT` | `NULL` | Custom offline message |
| `auto_greeting` | `TEXT` | `NULL` | Initial greeting message |
| `position` | `ENUM('bottom-right','bottom-left')` | `NOT NULL DEFAULT 'bottom-right'` | Widget position |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE chat_widget_configs (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  widget_id VARCHAR(64) NOT NULL,
  design_style ENUM('modern','classic','minimal') NOT NULL DEFAULT 'modern',
  primary_color CHAR(7) NOT NULL DEFAULT '#3B82F6',
  offline_behavior ENUM('hide','show_form','show_message') NOT NULL DEFAULT 'hide',
  offline_message TEXT NULL,
  auto_greeting TEXT NULL,
  position ENUM('bottom-right','bottom-left') NOT NULL DEFAULT 'bottom-right',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cwc_project (project_id),
  CONSTRAINT fk_cwc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `ChatWidgetTab.tsx` (widgetDesign, widgetColor, offlineBehavior, offlineMessage, widgetId)

---

#### `project_ai_settings`

Per-project AI chatbot configuration. Managed in the `AISettingsTab.tsx` of ProjectDetails.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `project_id` | `VARCHAR(36)` | `NOT NULL, UNIQUE, FK → projects.id` | One config per project |
| `ai_enabled` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Master toggle |
| `ai_model` | `VARCHAR(100)` | `NULL` | e.g. "gpt-4", "gpt-3.5-turbo" |
| `resolution_rate` | `DECIMAL(5,2)` | `NULL` | % of conversations resolved by AI |
| `avg_response_time_ms` | `INT UNSIGNED` | `NULL` | AI response latency |
| `customer_satisfaction` | `DECIMAL(3,1)` | `NULL` | e.g. 4.6 out of 5.0 |
| `total_ratings` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Number of ratings |
| `kb_articles_indexed` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Knowledge base coverage |
| `training_examples` | `INT UNSIGNED` | `NOT NULL DEFAULT 0` | Custom training data count |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE project_ai_settings (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model VARCHAR(100) NULL,
  resolution_rate DECIMAL(5,2) NULL,
  avg_response_time_ms INT UNSIGNED NULL,
  customer_satisfaction DECIMAL(3,1) NULL,
  total_ratings INT UNSIGNED NOT NULL DEFAULT 0,
  kb_articles_indexed INT UNSIGNED NOT NULL DEFAULT 0,
  training_examples INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pais_project (project_id),
  CONSTRAINT fk_pais_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `AISettingsTab.tsx` (AI Performance Metrics, AI Learning Overview)

---

### 2.12 Activity Logs

#### `activity_logs`

Agent activity timeline entries. Displayed in the Activity tab of `AgentDetails.tsx`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID |
| `user_id` | `VARCHAR(36)` | `NOT NULL, FK → users.id` | Agent who performed the action |
| `action` | `VARCHAR(255)` | `NOT NULL` | e.g. "Resolved ticket", "Started chat" |
| `details` | `TEXT` | `NULL` | e.g. "T-1045 - Login issues" |
| `entity_type` | `ENUM('ticket','chat','article','project','user')` | `NULL` | What was acted upon |
| `entity_id` | `VARCHAR(36)` | `NULL` | ID of the affected entity |
| `icon_type` | `VARCHAR(50)` | `NULL` | Lucide icon name for UI rendering |
| `icon_color` | `VARCHAR(50)` | `NULL` | Tailwind color class |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

```sql
CREATE TABLE activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT NULL,
  entity_type ENUM('ticket','chat','article','project','user') NULL,
  entity_id VARCHAR(36) NULL,
  icon_type VARCHAR(50) NULL,
  icon_color VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_al_user (user_id),
  KEY idx_al_entity (entity_type, entity_id),
  KEY idx_al_created (created_at),
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Source**: `AgentDetails.tsx` (recentActivity array with time, action, details, icon, color)

---

## 3. Relationship Map

| Relationship | Type | FK Location | ON DELETE |
|---|---|---|---|
| `companies` → `projects` | 1:N | `projects.company_id` | CASCADE |
| `companies` → `users` | 1:N | `users.company_id` | CASCADE |
| `companies` → `customers` | 1:N | `customers.company_id` | CASCADE |
| `companies` → `company_subscriptions` | 1:N | `company_subscriptions.company_id` | CASCADE |
| `companies` → `payment_methods` | 1:N | `payment_methods.company_id` | CASCADE |
| `companies` → `invoices` | 1:N | `invoices.company_id` | CASCADE |
| `companies` → `notifications` | 1:N | `notifications.company_id` | CASCADE |
| `projects` → `tickets` | 1:N | `tickets.project_id` | CASCADE |
| `projects` → `chats` | 1:N | `chats.project_id` | CASCADE |
| `projects` → `kb_categories` | 1:N | `kb_categories.project_id` | CASCADE |
| `projects` → `chat_widget_configs` | 1:1 | `chat_widget_configs.project_id` | CASCADE |
| `projects` → `project_ai_settings` | 1:1 | `project_ai_settings.project_id` | CASCADE |
| `projects` → `chat_transfers` | 1:N | `chat_transfers.project_id` | CASCADE |
| `users` ↔ `projects` | M:N | `user_project_assignments` | CASCADE |
| `users` → `tickets` (assigned) | 1:N | `tickets.assigned_to` | SET NULL |
| `users` → `chats` (assigned) | 1:N | `chats.assigned_to` | SET NULL |
| `users` → `activity_logs` | 1:N | `activity_logs.user_id` | CASCADE |
| `users` → `notifications` | 1:N | `notifications.user_id` | CASCADE |
| `users` → `user_notification_preferences` | 1:1 | `user_notification_preferences.user_id` | CASCADE |
| `users` → `user_availability_settings` | 1:1 | `user_availability_settings.user_id` | CASCADE |
| `users` → `kb_articles` (author) | 1:N | `kb_articles.author_id` | SET NULL |
| `users` → `chat_transfers` (from) | 1:N | `chat_transfers.from_agent_id` | CASCADE |
| `users` → `chat_transfers` (to) | 1:N | `chat_transfers.to_agent_id` | SET NULL |
| `customers` → `tickets` | 1:N | `tickets.customer_id` | SET NULL |
| `customers` → `chats` | 1:N | `chats.customer_id` | CASCADE |
| `customers` → `customer_sessions` | 1:N | `customer_sessions.customer_id` | CASCADE |
| `chats` → `chat_messages` | 1:N | `chat_messages.chat_id` | CASCADE |
| `chats` → `chat_transfers` | 1:N | `chat_transfers.chat_id` | CASCADE |
| `tickets` → `ticket_messages` | 1:N | `ticket_messages.ticket_id` | CASCADE |
| `kb_categories` → `kb_articles` | 1:N | `kb_articles.category_id` | CASCADE |
| `subscription_plans` → `company_subscriptions` | 1:N | `company_subscriptions.plan_id` | RESTRICT |
| `company_subscriptions` → `invoices` | 1:N | `invoices.subscription_id` | SET NULL |
| `customer_sessions` → `customer_page_visits` | 1:N | `customer_page_visits.session_id` | CASCADE |

---

## 4. Indexes

All indexes are declared inline in the `CREATE TABLE` statements above. Summary of key access patterns they support:

| Access Pattern | Table | Index |
|---|---|---|
| List all projects for a company | `projects` | `idx_projects_company` |
| Filter tickets by status | `tickets` | `idx_tickets_status` |
| Filter tickets by project | `tickets` | `idx_tickets_project` |
| List tickets assigned to an agent | `tickets` | `idx_tickets_assigned` |
| Sort tickets by creation date | `tickets` | `idx_tickets_created` |
| List chats for a project | `chats` | `idx_chats_project` |
| Sort chats by last message | `chats` | `idx_chats_last_msg` |
| Unread chat messages count | `chat_messages` | `idx_chat_msgs_read` |
| Load messages for a chat | `chat_messages` | `idx_chat_msgs_chat` |
| Articles by category | `kb_articles` | `idx_kb_articles_category` |
| Full-text article search | `kb_articles` | `ft_kb_articles_title` |
| Pending transfer requests for an agent | `chat_transfers` | `idx_transfers_to_agent`, `idx_transfers_status` |
| Unread notifications for a user | `notifications` | `idx_notif_user`, `idx_notif_read` |
| Recent activity for an agent | `activity_logs` | `idx_al_user`, `idx_al_created` |
| Invoices by date | `invoices` | `idx_invoices_date` |
| Agents by status | `users` | `idx_users_status` |
| Filter agents by assigned projects | `user_project_assignments` | `uq_user_project`, `idx_upa_project` |

---

## 5. Enum Reference

| Enum | Values | Used In |
|---|---|---|
| Company Status | `Active`, `Archived`, `Suspended` | `companies.status` |
| Company Plan | `Free`, `Starter`, `Pro`, `Enterprise` | `companies.plan` |
| User Role | `Agent`, `Admin` | `users.role` |
| User Status | `Active`, `Away`, `Offline`, `Deactivated`, `Invited` | `users.status` |
| Project Status | `Active`, `Disabled` | `projects.status` |
| Ticket Status | `open`, `pending`, `closed` | `tickets.status` |
| Ticket Priority | `low`, `medium`, `high` | `tickets.priority` |
| Ticket Category | `Technical Support`, `Billing`, `Feature Request`, `Bug Report`, `Account Issue`, `General Inquiry` | `tickets.category` |
| Chat Status | `active`, `waiting`, `closed`, `offline` | `chats.status` |
| Chat Message Sender | `customer`, `agent`, `bot`, `system` | `chat_messages.sender_type` |
| Ticket Message Sender | `customer`, `agent`, `system` | `ticket_messages.sender_type` |
| Article Status | `published`, `draft` | `kb_articles.status` |
| Article Generation Method | `manual`, `ai_url`, `ai_description` | `kb_articles.generation_method` |
| Transfer Status | `pending`, `accepted`, `rejected` | `chat_transfers.status` |
| Card Brand | `visa`, `mastercard`, `amex`, `discover`, `unknown` | `payment_methods.card_brand` |
| Subscription Status | `active`, `cancelled`, `past_due`, `trialing` | `company_subscriptions.status` |
| Invoice Status | `Paid`, `Pending`, `Failed`, `Refunded` | `invoices.status` |
| Billing Cycle | `monthly`, `annual` | `company_subscriptions.billing_cycle` |
| Notification Type | `alert`, `security`, `user`, `billing`, `system`, `success` | `notifications.type` |
| Widget Design | `modern`, `classic`, `minimal` | `chat_widget_configs.design_style` |
| Widget Offline Behavior | `hide`, `show_form`, `show_message` | `chat_widget_configs.offline_behavior` |
| Widget Position | `bottom-right`, `bottom-left` | `chat_widget_configs.position` |
| Activity Entity Type | `ticket`, `chat`, `article`, `project`, `user` | `activity_logs.entity_type` |

---

## Total: 22 Tables

| # | Table | Category |
|---|---|---|
| 1 | `companies` | Core Tenancy |
| 2 | `users` | Users & Auth |
| 3 | `user_notification_preferences` | Users & Auth |
| 4 | `user_availability_settings` | Users & Auth |
| 5 | `projects` | Projects |
| 6 | `user_project_assignments` | Projects (M:N join) |
| 7 | `customers` | Tickets / Chats |
| 8 | `tickets` | Tickets |
| 9 | `ticket_messages` | Tickets |
| 10 | `chats` | Live Chat |
| 11 | `chat_messages` | Live Chat |
| 12 | `kb_categories` | Knowledge Base |
| 13 | `kb_articles` | Knowledge Base |
| 14 | `chat_transfers` | Chat Transfers |
| 15 | `subscription_plans` | Billing |
| 16 | `company_subscriptions` | Billing |
| 17 | `payment_methods` | Billing |
| 18 | `invoices` | Billing |
| 19 | `notifications` | Notifications |
| 20 | `customer_sessions` | Customer Activity |
| 21 | `customer_page_visits` | Customer Activity |
| 22 | `chat_widget_configs` | Project Config |
| 23 | `project_ai_settings` | Project Config |
| 24 | `activity_logs` | Activity Logs |