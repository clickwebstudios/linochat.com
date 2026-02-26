# LinoChat - Entity-Relationship Diagram (ERD)

**Database**: MySQL 8.0 | **Engine**: InnoDB | **Charset**: utf8mb4_unicode_ci
**Audience**: OpenClaw backend worker

---

## Module Color Legend

| Color | Module | Tables |
|---|---|---|
| BLUE | Users & Organizations | `companies`, `users`, `customers`, `user_notification_preferences`, `user_availability_settings` |
| GREEN | Tickets & Support | `tickets`, `ticket_messages` |
| PURPLE | Live Chat | `chats`, `chat_messages`, `chat_transfers` |
| ORANGE | Projects | `projects`, `user_project_assignments`, `chat_widget_configs`, `project_ai_settings` |
| YELLOW | Billing & Subscriptions | `subscription_plans`, `company_subscriptions`, `payment_methods`, `invoices` |
| TEAL | Knowledge Base | `kb_categories`, `kb_articles` |
| GRAY | System | `notifications`, `activity_logs`, `customer_sessions`, `customer_page_visits` |

---

## Full ERD (Text Diagram - Crow's Foot Notation)

```
============================================================================================
  BLUE MODULE: USERS & ORGANIZATIONS
============================================================================================

+-------------------------------------------+
| companies                          [BLUE]  |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
|     name            VARCHAR(255)  NOT NULL |
|     email           VARCHAR(255)  NOT NULL |
|     location        VARCHAR(255)  NULL     |
|     status          ENUM(Active,           |
|                       Archived,Suspended)  |
|     plan            ENUM(Free,Starter,     |
|                       Pro,Enterprise)      |
|     archived_reason TEXT          NULL      |
|     archived_at     DATETIME      NULL     |
|     created_at      DATETIME      NOT NULL |
|     updated_at      DATETIME      NOT NULL |
+-------------------------------------------+
       |
       | 1:N  (company_id)
       |
       +----------+----------+-----------+-----------+
       |          |          |           |           |
       v          v          v           v           v
  +--------+  +------+  +-----------+  +--------+  +--------+
  | users  |  |custo-|  | projects  |  |company_|  |payment_|
  |        |  |mers  |  |           |  |subscr. |  |methods |
  +--------+  +------+  +-----------+  +--------+  +--------+
  (see below)            (see ORANGE)  (see YELLOW) (see YELLOW)


+-------------------------------------------+
| users                              [BLUE]  |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
|     first_name      VARCHAR(100) NOT NULL |
|     last_name       VARCHAR(100) NOT NULL |
|     email           VARCHAR(255) NOT NULL |
|     phone           VARCHAR(50)  NULL     |
|     location        VARCHAR(255) NULL     |
|     country         CHAR(2)      NULL     |
|     bio             TEXT         NULL      |
|     avatar_url      VARCHAR(512) NULL     |
|     role            ENUM(Agent,Admin)     |
|     status          ENUM(Active,Away,     |
|                       Offline,Deactivated,|
|                       Invited)            |
|     password_hash   VARCHAR(255) NOT NULL |
|     two_factor_enabled BOOLEAN   NOT NULL |
|     last_active_at  DATETIME     NULL     |
|     join_date       DATE         NOT NULL |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: uq_users_email (UNIQUE)             |
| IDX: idx_users_company, idx_users_status  |
| IDX: idx_users_role                       |
| FK:  company_id -> companies.id CASCADE   |
+-------------------------------------------+
       |
       | 1:1  (user_id, UNIQUE)
       |
       +-----------------------------+
       |                             |
       v                             v
+-------------------------------+  +-------------------------------+
| user_notification_preferences |  | user_availability_settings    |
|                        [BLUE] |  |                        [BLUE] |
|-------------------------------|  |-------------------------------|
| PK  id         VARCHAR(36)   |  | PK  id         VARCHAR(36)   |
| FK  user_id    VARCHAR(36)   |  | FK  user_id    VARCHAR(36)   |
|     email_notifications BOOL |  |     auto_accept_chats  BOOL  |
|     desktop_notifications    |  |     max_concurrent_chats     |
|     sound_alerts     BOOLEAN |  |              TINYINT UNSIGNED|
|     weekly_summary   BOOLEAN |  +-------------------------------+
+-------------------------------+  | FK: user_id -> users.id      |
| FK: user_id -> users.id      |  |     CASCADE (UNIQUE)         |
|     CASCADE (UNIQUE)          |  +-------------------------------+
+-------------------------------+


+-------------------------------------------+
| customers                          [BLUE]  |
|-------------------------------------------|
| ** TRACKING ENTITY -- NOT an auth role ** |
| A visitor becomes a customer record when  |
| they create their first ticket or chat.   |
| Identified by email. No password, no      |
| login, no dashboard.                      |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
|     name            VARCHAR(255) NOT NULL |
|     email           VARCHAR(255) NOT NULL |
|     avatar          VARCHAR(10)  NULL     |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_customers_company                |
| IDX: idx_customers_email                  |
| FK:  company_id -> companies.id CASCADE   |
+-------------------------------------------+


============================================================================================
  ORANGE MODULE: PROJECTS
============================================================================================

+-------------------------------------------+
| projects                        [ORANGE]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
|     name            VARCHAR(255) NOT NULL |
|     description     TEXT         NULL      |
|     color           CHAR(7)      NOT NULL |
|     website         VARCHAR(512) NULL     |
|     status          ENUM(Active,Disabled) |
|     total_tickets   INT UNSIGNED NOT NULL |
|     active_tickets  INT UNSIGNED NOT NULL |
|     member_count    INT UNSIGNED NOT NULL |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_projects_company                 |
| IDX: idx_projects_status                  |
| FK:  company_id -> companies.id CASCADE   |
+-------------------------------------------+
       |
       | 1:1  (project_id, UNIQUE)
       |
       +-----------------------------+
       |                             |
       v                             v
+-------------------------------+  +-------------------------------+
| chat_widget_configs  [ORANGE] |  | project_ai_settings  [ORANGE] |
|-------------------------------|  |-------------------------------|
| PK  id         VARCHAR(36)   |  | PK  id         VARCHAR(36)   |
| FK  project_id VARCHAR(36)   |  | FK  project_id VARCHAR(36)   |
|     widget_id  VARCHAR(64)   |  |     ai_enabled       BOOLEAN |
|     design_style ENUM(modern,|  |     ai_model   VARCHAR(100)  |
|       classic,minimal)       |  |     resolution_rate          |
|     primary_color CHAR(7)    |  |              DECIMAL(5,2)    |
|     offline_behavior ENUM    |  |     avg_response_time_ms     |
|       (hide,show_form,       |  |              INT UNSIGNED    |
|        show_message)         |  |     customer_satisfaction    |
|     offline_message TEXT     |  |              DECIMAL(3,1)    |
|     auto_greeting   TEXT     |  |     total_ratings            |
|     position ENUM(bottom-    |  |              INT UNSIGNED    |
|       right,bottom-left)     |  |     kb_articles_indexed      |
|     created_at    DATETIME   |  |              INT UNSIGNED    |
|     updated_at    DATETIME   |  |     training_examples        |
+-------------------------------+  |              INT UNSIGNED    |
| FK: project_id -> projects.id |  |     created_at  DATETIME    |
|     CASCADE (UNIQUE)          |  |     updated_at  DATETIME    |
+-------------------------------+  +-------------------------------+
                                   | FK: project_id -> projects.id |
                                   |     CASCADE (UNIQUE)          |
                                   +-------------------------------+


+-------------------------------------------+
| user_project_assignments        [ORANGE]   |
| (M:N join: users <-> projects)             |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  user_id         VARCHAR(36)  NOT NULL |
| FK  project_id      VARCHAR(36)  NOT NULL |
|     assigned_at     DATETIME     NOT NULL |
+-------------------------------------------+
| UNIQUE: uq_user_project (user_id,        |
|         project_id)                        |
| IDX: idx_upa_project                      |
| FK:  user_id -> users.id CASCADE          |
| FK:  project_id -> projects.id CASCADE    |
+-------------------------------------------+


============================================================================================
  GREEN MODULE: TICKETS & SUPPORT
============================================================================================

+-------------------------------------------+
| tickets                          [GREEN]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
| FK  project_id      VARCHAR(36)  NOT NULL |
| FK  customer_id     VARCHAR(36)  NULL     |
| FK  assigned_to     VARCHAR(36)  NULL     |
|     subject         VARCHAR(500) NOT NULL |
|     description     TEXT         NULL      |
|     status          ENUM(open,pending,    |
|                       closed)             |
|     priority        ENUM(low,medium,high) |
|     category        ENUM(Technical        |
|                       Support,Billing,    |
|                       Feature Request,    |
|                       Bug Report,Account  |
|                       Issue,General       |
|                       Inquiry)    NULL    |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_tickets_company                  |
| IDX: idx_tickets_project                  |
| IDX: idx_tickets_assigned                 |
| IDX: idx_tickets_status                   |
| IDX: idx_tickets_priority                 |
| IDX: idx_tickets_created                  |
| FK:  company_id -> companies.id CASCADE   |
| FK:  project_id -> projects.id CASCADE    |
| FK:  customer_id -> customers.id SET NULL |
| FK:  assigned_to -> users.id SET NULL     |
+-------------------------------------------+
       |
       | 1:N  (ticket_id)
       v
+-------------------------------------------+
| ticket_messages                  [GREEN]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  ticket_id       VARCHAR(36)  NOT NULL |
|     sender_type     ENUM(customer,agent,  |
|                       system)             |
|     sender_id       VARCHAR(36)  NULL     |
|     body            TEXT         NOT NULL |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_ticket_msgs_ticket               |
| IDX: idx_ticket_msgs_created              |
| FK:  ticket_id -> tickets.id CASCADE      |
+-------------------------------------------+


============================================================================================
  PURPLE MODULE: LIVE CHAT
============================================================================================

+-------------------------------------------+
| chats                           [PURPLE]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
| FK  project_id      VARCHAR(36)  NOT NULL |
| FK  customer_id     VARCHAR(36)  NOT NULL |
| FK  assigned_to     VARCHAR(36)  NULL     |
|     status          ENUM(active,waiting,  |
|                       closed,offline)     |
|     is_ai_bot       BOOLEAN      NOT NULL |
|     unread_count    INT UNSIGNED  NOT NULL |
|     last_message_preview                  |
|                     VARCHAR(500) NULL     |
|     last_message_at DATETIME     NULL     |
|     created_at      DATETIME     NOT NULL |
|     closed_at       DATETIME     NULL     |
+-------------------------------------------+
| IDX: idx_chats_company                    |
| IDX: idx_chats_project                    |
| IDX: idx_chats_assigned                   |
| IDX: idx_chats_status                     |
| IDX: idx_chats_last_msg                   |
| FK:  company_id -> companies.id CASCADE   |
| FK:  project_id -> projects.id CASCADE    |
| FK:  customer_id -> customers.id CASCADE  |
| FK:  assigned_to -> users.id SET NULL     |
+-------------------------------------------+
       |
       | 1:N  (chat_id)
       |
       +-----------------------------+
       |                             |
       v                             v
+-------------------------------+  +-------------------------------+
| chat_messages        [PURPLE] |  | chat_transfers       [PURPLE] |
|-------------------------------|  |-------------------------------|
| PK  id         VARCHAR(36)   |  | PK  id         VARCHAR(36)   |
| FK  chat_id    VARCHAR(36)   |  | FK  chat_id    VARCHAR(36)   |
|     sender_type ENUM(customer|  | FK  customer_id VARCHAR(36)  |
|       ,agent,bot,system)     |  | FK  from_agent_id VARCHAR(36)|
|     sender_id  VARCHAR(36)   |  | FK  to_agent_id VARCHAR(36)  |
|     body       TEXT NOT NULL |  | FK  project_id VARCHAR(36)   |
|     is_read    BOOLEAN       |  |     reason     TEXT NOT NULL  |
|     created_at DATETIME      |  |     notes      TEXT NULL      |
+-------------------------------+  |     status ENUM(pending,     |
| IDX: idx_chat_msgs_chat      |  |       accepted,rejected)     |
| IDX: idx_chat_msgs_created   |  |     created_at DATETIME      |
| IDX: idx_chat_msgs_read      |  |     resolved_at DATETIME NULL|
| FK: chat_id -> chats.id      |  +-------------------------------+
|     CASCADE                   |  | FK: chat_id -> chats.id      |
+-------------------------------+  |     CASCADE                   |
                                   | FK: from_agent_id -> users.id |
                                   |     CASCADE                   |
                                   | FK: to_agent_id -> users.id   |
                                   |     SET NULL                  |
                                   | FK: project_id -> projects.id |
                                   |     CASCADE                   |
                                   +-------------------------------+


============================================================================================
  TEAL MODULE: KNOWLEDGE BASE
============================================================================================

+-------------------------------------------+
| kb_categories                     [TEAL]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  project_id      VARCHAR(36)  NOT NULL |
|     name            VARCHAR(255) NOT NULL |
|     article_count   INT UNSIGNED NOT NULL |
|     sort_order      INT          NOT NULL |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_kb_cat_project                   |
| FK:  project_id -> projects.id CASCADE    |
+-------------------------------------------+
       |
       | 1:N  (category_id)
       v
+-------------------------------------------+
| kb_articles                       [TEAL]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  category_id     VARCHAR(36)  NOT NULL |
|     title           VARCHAR(500) NOT NULL |
|     excerpt         TEXT         NULL      |
|     content         LONGTEXT     NULL      |
|     status          ENUM(published,draft) |
| FK  author_id       VARCHAR(36)  NULL     |
|     views           INT UNSIGNED NOT NULL |
|     helpful_count   INT UNSIGNED NOT NULL |
|     tags            JSON         NULL      |
|     generation_method ENUM(manual,        |
|                       ai_url,             |
|                       ai_description) NULL|
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| IDX: idx_kb_articles_category             |
| IDX: idx_kb_articles_status               |
| IDX: idx_kb_articles_author               |
| FT:  ft_kb_articles_title (FULLTEXT)      |
| FK:  category_id -> kb_categories.id      |
|      CASCADE                               |
| FK:  author_id -> users.id SET NULL       |
+-------------------------------------------+


============================================================================================
  YELLOW MODULE: BILLING & SUBSCRIPTIONS
============================================================================================

+-------------------------------------------+
| subscription_plans              [YELLOW]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
|     name            VARCHAR(100) NOT NULL |
|     price_monthly   DECIMAL(10,2)NOT NULL |
|     price_annual    DECIMAL(10,2)NOT NULL |
|     period_label    VARCHAR(50)  NOT NULL |
|     agent_limit     INT          NOT NULL |
|     ticket_limit    INT          NOT NULL |
|     chat_limit      INT          NOT NULL |
|     features        JSON         NOT NULL |
|     is_popular      BOOLEAN      NOT NULL |
|     sort_order      INT          NOT NULL |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
       |
       | 1:N  (plan_id)
       v
+-------------------------------------------+
| company_subscriptions           [YELLOW]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
| FK  plan_id         VARCHAR(36)  NOT NULL |
|     billing_cycle   ENUM(monthly,annual)  |
|     status          ENUM(active,cancelled,|
|                       past_due,trialing)  |
|     current_period_start DATE    NOT NULL |
|     current_period_end   DATE    NOT NULL |
|     cancel_at_period_end BOOLEAN NOT NULL |
|     cancelled_at    DATETIME     NULL     |
|     created_at      DATETIME     NOT NULL |
|     updated_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: company_id -> companies.id CASCADE    |
| FK: plan_id -> subscription_plans.id      |
|     RESTRICT                               |
+-------------------------------------------+
       |
       | 1:N  (subscription_id)
       v
+-------------------------------------------+
| invoices                        [YELLOW]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
| FK  subscription_id VARCHAR(36)  NULL     |
|     plan_name       VARCHAR(100) NOT NULL |
|     agent_count     INT UNSIGNED NOT NULL |
|     amount          DECIMAL(10,2)NOT NULL |
|     currency        CHAR(3)      NOT NULL |
|     status          ENUM(Paid,Pending,    |
|                       Failed,Refunded)    |
|     invoice_date    DATE         NOT NULL |
|     pdf_url         VARCHAR(512) NULL     |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: company_id -> companies.id CASCADE    |
| FK: subscription_id ->                    |
|     company_subscriptions.id SET NULL     |
+-------------------------------------------+

+-------------------------------------------+
| payment_methods                 [YELLOW]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NOT NULL |
|     card_brand      ENUM(visa,mastercard, |
|                       amex,discover,      |
|                       unknown)            |
|     card_last_four  CHAR(4)      NOT NULL |
|     card_exp_month  TINYINT UNSIGNED      |
|     card_exp_year   SMALLINT UNSIGNED     |
|     cardholder_name VARCHAR(255) NOT NULL |
|     is_default      BOOLEAN      NOT NULL |
|     stripe_payment_method_id              |
|                     VARCHAR(255) NULL     |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: company_id -> companies.id CASCADE    |
+-------------------------------------------+


============================================================================================
  GRAY MODULE: SYSTEM (Notifications, Logs, Activity Tracking)
============================================================================================

+-------------------------------------------+
| notifications                     [GRAY]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  company_id      VARCHAR(36)  NULL     |
| FK  user_id         VARCHAR(36)  NULL     |
|     title           VARCHAR(255) NOT NULL |
|     description     TEXT         NOT NULL |
|     type            ENUM(alert,security,  |
|                       user,billing,       |
|                       system,success)     |
|     is_read         BOOLEAN      NOT NULL |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: company_id -> companies.id CASCADE    |
| FK: user_id -> users.id CASCADE           |
+-------------------------------------------+

+-------------------------------------------+
| activity_logs                     [GRAY]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  user_id         VARCHAR(36)  NOT NULL |
|     action          VARCHAR(255) NOT NULL |
|     details         TEXT         NULL      |
|     entity_type     ENUM(ticket,chat,     |
|                       article,project,    |
|                       user)       NULL    |
|     entity_id       VARCHAR(36)  NULL     |
|     icon_type       VARCHAR(50)  NULL     |
|     icon_color      VARCHAR(50)  NULL     |
|     created_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: user_id -> users.id CASCADE           |
+-------------------------------------------+

+-------------------------------------------+
| customer_sessions                 [GRAY]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  customer_id     VARCHAR(36)  NOT NULL |
| FK  chat_id         VARCHAR(36)  NULL     |
|     browser         VARCHAR(100) NULL     |
|     device          VARCHAR(100) NULL     |
|     location        VARCHAR(255) NULL     |
|     referral_source VARCHAR(500) NULL     |
|     chat_initiated_from                   |
|                     VARCHAR(500) NULL     |
|     session_start   DATETIME     NOT NULL |
|     session_end     DATETIME     NULL     |
+-------------------------------------------+
| FK: customer_id -> customers.id CASCADE   |
| FK: chat_id -> chats.id SET NULL          |
+-------------------------------------------+
       |
       | 1:N  (session_id)
       v
+-------------------------------------------+
| customer_page_visits              [GRAY]   |
|-------------------------------------------|
| PK  id              VARCHAR(36)           |
| FK  session_id      VARCHAR(36)  NOT NULL |
|     page_title      VARCHAR(255) NOT NULL |
|     page_url        VARCHAR(500) NOT NULL |
|     duration        VARCHAR(20)  NULL     |
|     visited_at      DATETIME     NOT NULL |
+-------------------------------------------+
| FK: session_id -> customer_sessions.id    |
|     CASCADE                                |
+-------------------------------------------+
```

---

## Relationship Summary (Crow's Foot Notation)

```
NOTATION:
  ||------||  = 1:1 (one-to-one)
  ||------<   = 1:N (one-to-many)
  >------<    = M:N (many-to-many, via join table)

RELATIONSHIPS:

  companies          ||------<  users                     (company_id, CASCADE)
  companies          ||------<  customers                 (company_id, CASCADE)
  companies          ||------<  projects                  (company_id, CASCADE)
  companies          ||------<  company_subscriptions     (company_id, CASCADE)
  companies          ||------<  payment_methods           (company_id, CASCADE)
  companies          ||------<  invoices                  (company_id, CASCADE)
  companies          ||------<  notifications             (company_id, CASCADE)

  users              ||------|| user_notification_preferences  (user_id, UNIQUE, CASCADE)
  users              ||------|| user_availability_settings     (user_id, UNIQUE, CASCADE)
  users              ||------<  tickets (as assigned_to)       (assigned_to, SET NULL)
  users              ||------<  chats (as assigned_to)         (assigned_to, SET NULL)
  users              ||------<  kb_articles (as author)        (author_id, SET NULL)
  users              ||------<  activity_logs                  (user_id, CASCADE)
  users              ||------<  notifications                  (user_id, CASCADE)
  users              ||------<  chat_transfers (from)          (from_agent_id, CASCADE)
  users              ||------<  chat_transfers (to)            (to_agent_id, SET NULL)
  users              >------<   projects                       (via user_project_assignments)

  customers          ||------<  tickets                        (customer_id, SET NULL)
  customers          ||------<  chats                          (customer_id, CASCADE)
  customers          ||------<  customer_sessions              (customer_id, CASCADE)
  customers          ||------<  chat_transfers                 (customer_id, CASCADE)

  projects           ||------<  tickets                        (project_id, CASCADE)
  projects           ||------<  chats                          (project_id, CASCADE)
  projects           ||------<  kb_categories                  (project_id, CASCADE)
  projects           ||------<  chat_transfers                 (project_id, CASCADE)
  projects           ||------|| chat_widget_configs            (project_id, UNIQUE, CASCADE)
  projects           ||------|| project_ai_settings            (project_id, UNIQUE, CASCADE)

  tickets            ||------<  ticket_messages                (ticket_id, CASCADE)

  chats              ||------<  chat_messages                  (chat_id, CASCADE)
  chats              ||------<  chat_transfers                 (chat_id, CASCADE)

  kb_categories      ||------<  kb_articles                    (category_id, CASCADE)

  subscription_plans ||------<  company_subscriptions          (plan_id, RESTRICT)
  company_subscriptions ||---<  invoices                       (subscription_id, SET NULL)

  customer_sessions  ||------<  customer_page_visits           (session_id, CASCADE)
```

---

## Table Count Summary

| Module | Tables | Count |
|---|---|---|
| Users & Organizations | companies, users, customers, user_notification_preferences, user_availability_settings | 5 |
| Projects | projects, user_project_assignments, chat_widget_configs, project_ai_settings | 4 |
| Tickets & Support | tickets, ticket_messages | 2 |
| Live Chat | chats, chat_messages, chat_transfers | 3 |
| Knowledge Base | kb_categories, kb_articles | 2 |
| Billing & Subscriptions | subscription_plans, company_subscriptions, payment_methods, invoices | 4 |
| System | notifications, activity_logs, customer_sessions, customer_page_visits | 4 |
| **Total** | | **24** |

---

## Multi-Tenancy Note

LinoChat is a **multi-tenant SaaS platform**. The `companies` table is the root tenant entity. Nearly every table has a direct or transitive FK path back to `companies.id`. When building queries:

- Always scope by `company_id` for tenant isolation
- The `users` table contains **agents and admins** (internal staff), NOT customers
- The `customers` table contains **end-users** who submit tickets and chat
- `projects` is the primary organizational unit within a company -- tickets, chats, KB articles, and widget configs all belong to a project
- The `subscription_plans` table is **platform-wide** (shared across all companies) -- it is the only major table without a `company_id`