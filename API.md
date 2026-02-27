# LinoChat API Documentation

Complete API documentation for the LinoChat customer support platform.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Authentication Endpoints](#authentication-endpoints)
- [Widget API (Public)](#widget-api-public)
- [Agent Dashboard API](#agent-dashboard-api)
- [Tickets API](#tickets-api)
- [Projects API](#projects-api)
- [Knowledge Base API](#knowledge-base-api)
- [Widget Settings API](#widget-settings-api)
- [Invitations API](#invitations-api)
- [Dashboard API](#dashboard-api)
- [Superadmin API](#superadmin-api)
- [AI API](#ai-api)
- [WebSocket Events](#websocket-events)
- [Error Codes](#error-codes)

---

## Base URL

```
http://localhost:8000/api
```

All endpoints are prefixed with `/api`.

---

## Authentication

The API uses **JWT Bearer tokens** for authentication. 

### Getting a Token

1. Register or login to receive an `access_token`
2. Include the token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

### Token Refresh

Access tokens expire after 2 hours. Use the `refresh_token` to get a new access token:

```http
POST /auth/refresh
```

---

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["error details"]
  }
}
```

---

## Authentication Endpoints

### Register

```http
POST /auth/register
```

Create a new user account with company and project.

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "website": "https://company.com",
  "company_name": "Acme Inc"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "def50200...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "project": {
      "id": 1,
      "name": "Acme Inc",
      "widget_id": "wid_abc123"
    }
  }
}
```

### Login

```http
POST /auth/login
```

Authenticate and receive JWT tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register.

### Logout

```http
POST /auth/logout
```

Invalidate the current token.

**Headers:**

```
Authorization: Bearer {token}
```

### Get Current User

```http
GET /auth/me
```

Get authenticated user details.

**Headers:**

```
Authorization: Bearer {token}
```

### Refresh Token

```http
POST /auth/refresh
```

Get new access token using refresh token.

**Request Body:**

```json
{
  "refresh_token": "def50200..."
}
```

### Update Profile

```http
PUT /auth/me
```

Update current user profile.

**Headers:**

```
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com"
}
```

### Forgot Password

```http
POST /auth/forgot-password
```

Request password reset email.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

### Reset Password

```http
POST /auth/reset-password
```

Reset password using token from email.

**Request Body:**

```json
{
  "token": "reset-token",
  "email": "john@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

---

## Widget API (Public)

These endpoints are publicly accessible and used by the embeddable chat widget.

### Get Widget Config

```http
GET /widget/{widget_id}/config
```

Get widget configuration (colors, position, welcome message).

**Response:**

```json
{
  "success": true,
  "data": {
    "widget_id": "wid_abc123",
    "company_name": "Acme Inc",
    "color": "#155dfc",
    "position": "bottom-right",
    "welcome_message": "Hi! How can we help you today?",
    "button_text": "💬",
    "widget_title": "Acme Support",
    "show_agent_name": true,
    "show_agent_avatar": true,
    "auto_open": false,
    "auto_open_delay": 5
  }
}
```

### Initialize Chat

```http
POST /widget/{widget_id}/init
```

Initialize a new or get existing chat session.

**Request Body:**

```json
{
  "customer_email": "customer@example.com",
  "customer_name": "Jane Doe",
  "current_page": "https://example.com/pricing",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chat_id": "chat_123",
    "customer_id": "cust_456",
    "status": "ai_handling",
    "messages": [
      {
        "id": 1,
        "content": "Hi there! I'm the AI assistant for Acme Inc. How can I help you today?",
        "sender_type": "ai",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Send Message

```http
POST /widget/{widget_id}/message
```

Send a message from the customer.

**Request Body:**

```json
{
  "chat_id": "chat_123",
  "customer_id": "cust_456",
  "message": "I need help with my order"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": {
      "id": 2,
      "content": "I need help with my order",
      "sender_type": "customer",
      "created_at": "2024-01-15T10:31:00Z"
    },
    "ai_response": {
      "id": 3,
      "content": "I'd be happy to help with your order...",
      "sender_type": "ai"
    },
    "chat_status": "ai_handling"
  }
}
```

### Get Messages

```http
GET /widget/{widget_id}/messages?chat_id={chat_id}&customer_id={customer_id}
```

Retrieve chat messages.

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [...],
    "status": "active",
    "agent_name": "John Doe"
  }
}
```

### Typing Indicator

```http
POST /widget/{widget_id}/typing
```

Notify that customer is typing.

**Request Body:**

```json
{
  "chat_id": "chat_123",
  "customer_id": "cust_456",
  "is_typing": true
}
```

### Request Human Handover

```http
POST /widget/{widget_id}/handover
```

Request transfer from AI to human agent.

**Request Body:**

```json
{
  "chat_id": "chat_123",
  "customer_id": "cust_456"
}
```

### Check Ticket Needed

```http
POST /widget/{widget_id}/check-ticket-needed
```

Check if agents are busy and ticket should be created.

### Create Ticket

```http
POST /widget/{widget_id}/create-ticket
```

Create a support ticket with customer contact info.

**Request Body:**

```json
{
  "chat_id": "chat_123",
  "customer_id": "cust_456",
  "email": "customer@example.com",
  "name": "Jane Doe"
}
```

### Get Agent Status

```http
GET /widget/{widget_id}/status
```

Get current agent availability status.

**Response:**

```json
{
  "success": true,
  "data": {
    "agents_online": 2,
    "status": "online",
    "estimated_wait": "1-2 minutes"
  }
}
```

---

## Agent Dashboard API

All endpoints require authentication.

### List Chats

```http
GET /agent/chats?status={status}
```

Get list of chats. Optional `status` filter: `active`, `waiting`, `closed`.

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "chat_123",
      "customer_name": "Jane Doe",
      "customer_email": "jane@example.com",
      "status": "active",
      "agent_id": 1,
      "agent_name": "John Doe",
      "preview": "I need help with...",
      "last_message_at": "2024-01-15T10:30:00Z",
      "unread": 2,
      "project_id": 1,
      "ai_enabled": false
    }
  ]
}
```

### Get Chat Details

```http
GET /agent/chats/{chat_id}
```

Get detailed chat information with all messages.

### Take Chat

```http
POST /agent/chats/{chat_id}/take
```

Assign chat to current agent.

**Response:**

```json
{
  "success": true,
  "message": "Chat assigned to you",
  "data": {
    "chat_id": "chat_123",
    "agent_id": 1,
    "status": "active"
  }
}
```

### Send Message

```http
POST /agent/chats/{chat_id}/message
```

Send message as agent.

**Request Body:**

```json
{
  "message": "How can I help you today?",
  "attachments": []
}
```

Or multipart/form-data for file uploads.

### Close Chat

```http
POST /agent/chats/{chat_id}/close
```

Close the chat session.

### Typing Indicator

```http
POST /agent/chats/{chat_id}/typing
```

Send typing indicator to customer.

**Request Body:**

```json
{
  "is_typing": true
}
```

### Mark Messages Read

```http
POST /agent/chats/{chat_id}/mark-read
```

Mark all chat messages as read.

### Toggle AI

```http
POST /agent/chats/{chat_id}/toggle-ai
```

Enable/disable AI for the chat.

### Get Chat Activity

```http
GET /agent/chats/{chat_id}/activity
```

Get customer activity history (pages visited, device info, etc.).

**Response:**

```json
{
  "success": true,
  "data": {
    "customer": "Jane Doe",
    "customer_email": "jane@example.com",
    "session_start": "2024-01-15T10:00:00Z",
    "location": "New York, USA",
    "device": "Desktop",
    "browser": "Chrome",
    "referral_source": "Google",
    "pages_visited": [...],
    "previous_chats": [...]
  }
}
```

### Get Agent Stats

```http
GET /agent/stats
```

Get statistics for current agent.

**Response:**

```json
{
  "success": true,
  "data": {
    "active_chats": 3,
    "resolved_today": 12,
    "avg_response_time": "2m 30s",
    "satisfaction_score": 4.8
  }
}
```

### List Users

```http
GET /agent/users
```

Get list of agents in the company.

### Invite Agent

```http
POST /agent/invitations
```

Invite a new agent to the company.

**Request Body:**

```json
{
  "email": "newagent@example.com",
  "first_name": "New",
  "last_name": "Agent",
  "role": "agent"
}
```

### Resend Invitation

```http
POST /agent/invitations/{id}/resend
```

Resend invitation email.

---

## Tickets API

### List Tickets

```http
GET /agent/tickets?status={status}&priority={priority}&assigned_to={user_id}
```

Get list of tickets with optional filters.

**Query Parameters:**

- `status` - `open`, `in_progress`, `waiting`, `resolved`, `closed`
- `priority` - `low`, `medium`, `high`, `urgent`
- `assigned_to` - User ID

### Get Ticket

```http
GET /agent/tickets/{ticket_id}
```

Get ticket details.

### Create Ticket

```http
POST /agent/tickets
```

Create a new ticket.

**Request Body:**

```json
{
  "subject": "Login Issue",
  "description": "Cannot login to my account",
  "priority": "high",
  "category": "technical",
  "customer_email": "customer@example.com",
  "customer_name": "Jane Doe",
  "project_id": 1
}
```

### Take Ticket

```http
POST /agent/tickets/{ticket_id}/take
```

Assign ticket to current agent.

### Assign Ticket

```http
POST /agent/tickets/{ticket_id}/assign
```

Assign ticket to specific agent.

**Request Body:**

```json
{
  "agent_id": 2
}
```

### Update Status

```http
POST /agent/tickets/{ticket_id}/status
```

Update ticket status.

**Request Body:**

```json
{
  "status": "resolved"
}
```

### Reply to Ticket

```http
POST /agent/tickets/{ticket_id}/reply
```

Send reply to ticket (optionally email customer).

**Request Body:**

```json
{
  "message": "Your issue has been resolved...",
  "send_email": true
}
```

### Delete Ticket

```http
DELETE /agent/tickets/{ticket_id}
```

Delete a ticket.

### Get Ticket Stats

```http
GET /agent/tickets/stats
```

Get ticket statistics.

### Get Ticket Volume

```http
GET /agent/tickets/volume
```

Get ticket volume data for charts.

---

## Projects API

### List Projects

```http
GET /projects
```

Get all projects for current user.

### Create Project

```http
POST /projects
```

Create a new project.

**Request Body:**

```json
{
  "name": "New Project",
  "website": "https://project.com",
  "color": "#155dfc",
  "description": "Project description"
}
```

### Get Project

```http
GET /projects/{project_id}
```

Get project details.

### Update Project

```http
PUT /projects/{project_id}
```

Update project information.

### Delete Project

```http
DELETE /projects/{project_id}
```

Delete a project.

### Analyze Website

```http
POST /projects/analyze
```

Analyze website for AI knowledge base generation.

**Request Body:**

```json
{
  "website": "https://example.com"
}
```

### List Project Agents

```http
GET /projects/{project_id}/agents
```

Get agents assigned to project.

### Remove Agent

```http
DELETE /projects/{project_id}/agents/{agent_id}
```

Remove agent from project.

### Get Project Tickets

```http
GET /projects/{project_id}/tickets
```

Get tickets for a specific project.

### Get Project Chats

```http
GET /projects/{project_id}/chats
```

Get chats for a specific project.

### Get Project Activities

```http
GET /projects/{project_id}/activities
```

Get recent activities for a project.

---

## Knowledge Base API

### List Categories

```http
GET /projects/{project_id}/kb/categories
```

Get all KB categories for a project.

### Create Category

```http
POST /projects/{project_id}/kb/categories
```

Create a new category.

**Request Body:**

```json
{
  "name": "Getting Started",
  "description": "Articles for new users",
  "sort_order": 1
}
```

### List Articles

```http
GET /projects/{project_id}/kb/categories/{category_id}/articles
```

Get articles in a category.

### Get All Articles

```http
GET /projects/{project_id}/kb/articles
```

Get all articles across all categories.

### Get Article

```http
GET /projects/{project_id}/kb/articles/{article_id}
```

Get article by ID (within project context).

```http
GET /kb/articles/{article_id}
```

Get article by ID (global).

### Create Article

```http
POST /projects/{project_id}/kb/categories/{category_id}/articles
```

Create a new article.

**Request Body:**

```json
{
  "title": "How to Get Started",
  "content": "Article content in markdown...",
  "is_published": true,
  "tags": ["getting-started", "tutorial"]
}
```

### Update Article

```http
PUT /projects/{project_id}/kb/articles/{article_id}
```

Update an article.

### Delete Article

```http
DELETE /projects/{project_id}/kb/articles/{article_id}
```

Delete an article.

### Search Articles

```http
POST /projects/{project_id}/kb/search
```

Search articles with AI-powered semantic search.

**Request Body:**

```json
{
  "query": "how to reset password",
  "limit": 5
}
```

### Generate from Website

```http
POST /projects/{project_id}/kb/generate
```

Generate articles from website content using AI.

### Generate Single Article

```http
POST /projects/{project_id}/kb/categories/{category_id}/generate-article
```

Generate a single article using AI.

**Request Body:**

```json
{
  "topic": "Password Reset",
  "target_word_count": 500
}
```

### Get Generation Status

```http
GET /projects/{project_id}/kb/generation-status
```

Check status of AI article generation.

### Delete AI Articles

```http
DELETE /projects/{project_id}/kb/ai-articles
```

Delete all AI-generated articles.

---

## Widget Settings API

### Get Settings

```http
GET /projects/{project_id}/widget-settings
```

Get widget configuration settings.

**Response:**

```json
{
  "success": true,
  "data": {
    "color": "#155dfc",
    "position": "bottom-right",
    "widget_title": "Support",
    "welcome_message": "Hi! How can we help?",
    "button_text": "💬",
    "auto_open": false,
    "auto_open_delay": 5
  }
}
```

### Update Settings

```http
PUT /projects/{project_id}/widget-settings
```

Update widget settings.

**Request Body:**

```json
{
  "color": "#155dfc",
  "position": "bottom-right",
  "widget_title": "Support",
  "welcome_message": "Hi! How can we help?",
  "button_text": "💬",
  "auto_open": true,
  "auto_open_delay": 10
}
```

### Reset Settings

```http
DELETE /projects/{project_id}/widget-settings
```

Reset widget settings to defaults.

### Get Embed Code

```http
GET /projects/{project_id}/embed-code
```

Get widget embed code for website.

---

## Invitations API

### View Invitation (Public)

```http
GET /invitations/{token}
```

View invitation details (no auth required).

### Accept Invitation (Public)

```http
POST /invitations/{token}/accept
```

Accept invitation and create account.

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Reject Invitation (Public)

```http
POST /invitations/{token}/reject
```

Reject invitation.

### Send Invitation

```http
POST /projects/{project_id}/invitations
```

Send invitation to new agent (auth required).

**Request Body:**

```json
{
  "email": "agent@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "agent"
}
```

### List Invitations

```http
GET /projects/{project_id}/invitations
```

Get pending invitations for project.

### Cancel Invitation

```http
DELETE /invitations/{invitation_id}
```

Cancel a pending invitation.

---

## Dashboard API

### Get Stats

```http
GET /dashboard/stats
```

Get dashboard statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "total_chats": 150,
    "active_chats": 5,
    "total_tickets": 75,
    "open_tickets": 12,
    "avg_response_time": "3m 45s",
    "satisfaction_rate": 4.7
  }
}
```

### Get Ticket Volume

```http
GET /dashboard/ticket-volume
```

Get ticket volume data for charts.

---

## Superadmin API

These endpoints require superadmin role.

### List Companies

```http
GET /superadmin/companies
```

Get all companies.

### Get Company Details

```http
GET /superadmin/companies/{company_id}
```

Get company with projects and users.

### Get Company Chats

```http
GET /superadmin/companies/{company_id}/chats
```

Get all chats for a company.

### Get Dashboard Stats

```http
GET /superadmin/dashboard-stats
```

Get platform-wide statistics.

### Get Platform Stats

```http
GET /superadmin/stats
```

Get detailed platform statistics.

### List All Chats

```http
GET /superadmin/chats
```

Get all chats across all companies.

### List All Projects

```http
GET /superadmin/projects
```

Get all projects across all companies.

### List All Agents

```http
GET /superadmin/agents
```

Get all agents across all companies.

### Get Agent Details

```http
GET /superadmin/agents/{agent_id}
```

Get detailed agent information.

---

## AI API

### Chat

```http
POST /ai/chat
```

Send message to AI assistant.

**Request Body:**

```json
{
  "message": "How do I reset my password?",
  "context": "help_center",
  "project_id": 1
}
```

### Get Model Info

```http
GET /ai/model
```

Get AI model information.

### Get Rate Limit Status

```http
GET /ai/rate-limit
```

Get current rate limit status.

---

## WebSocket Events

Real-time events are broadcast via WebSocket using Laravel Reverb or Pusher.

### Connection

```javascript
// Using Pusher
const pusher = new Pusher('app_key', {
  wsHost: 'localhost',
  wsPort: 8080,
  forceTLS: false
});
```

### Channels

#### Chat Channel

`chat.{chat_id}`

**Events:**

- `message.sent` - New message in chat
- `chat.status` - Chat status changed
- `agent.typing` - Agent is typing
- `customer.typing` - Customer is typing
- `ai.typing` - AI is generating response
- `ai.typing.stop` - AI finished typing

#### Agent Channel

`agent.{user_id}`

**Events:**

- `NewChatForAgent` - New chat available
- `HumanRequested` - Human assistance requested

#### Project Channel

`project.{project_id}`

**Events:**

- Project-wide notifications

### Example Subscription

```javascript
const channel = pusher.subscribe('chat.123');

channel.bind('message.sent', (data) => {
  console.log('New message:', data);
});

channel.bind('agent.typing', (data) => {
  console.log('Agent typing:', data.agent_name);
});
```

---

## Error Codes

| HTTP Code | Meaning | Description |
|-----------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### Common Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 422 Validation Error

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

#### 429 Rate Limited

```json
{
  "success": false,
  "message": "Too many requests",
  "retry_after": 60
}
```

---

## Health Check

```http
GET /health
```

Public health check endpoint.

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "linochat-api"
}
```

---

## Interactive Documentation

For interactive API documentation with Swagger UI:

```
http://localhost:8000/api/docs
```

OpenAPI specification is available at:

```
http://localhost:8000/openapi.yaml
```

---

*Last updated: 2024*
