# LinoChat API Documentation

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/api/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.yaml

## 🔐 Authentication

The API uses JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

## 🌐 Base URL

```
http://localhost:8000/api
```

## 📡 WebSocket

Real-time events are delivered via WebSocket:
- **URL**: `ws://localhost:8080/app/{REVERB_APP_KEY}`
- **Channels**:
  - `chat.{chat_id}` - Chat messages
  - `agent.{user_id}` - Agent notifications
  - `project.{project_id}` - Project-wide events

## 📋 API Endpoints Overview

### Authentication
- `POST /auth/register` - Register with AI website analysis
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Current user

### Widget (Public - No Auth)
- `GET /widget/{id}/config` - Widget configuration
- `POST /widget/{id}/init` - Initialize chat
- `POST /widget/{id}/message` - Send message
- `GET /widget/{id}/messages` - Get messages
- `POST /widget/{id}/handover` - Request human
- `POST /widget/{id}/check-ticket-needed` - Check ticket needed
- `POST /widget/{id}/create-ticket` - Create ticket

### Agent Dashboard (Auth Required)
- `GET /agent/chats` - List chats
- `GET /agent/chats/{id}` - Chat details
- `POST /agent/chats/{id}/take` - Take chat
- `POST /agent/chats/{id}/message` - Send message
- `POST /agent/chats/{id}/close` - Close chat
- `POST /agent/chats/{id}/typing` - Typing indicator
- `GET /agent/stats` - Statistics

### Tickets (Auth Required)
- `GET /agent/tickets` - List tickets
- `POST /agent/tickets` - Create ticket
- `GET /agent/tickets/{id}` - Ticket details
- `POST /agent/tickets/{id}/take` - Take ticket
- `POST /agent/tickets/{id}/assign` - Assign ticket
- `POST /agent/tickets/{id}/status` - Update status
- `POST /agent/tickets/{id}/reply` - Reply to ticket

### Projects (Auth Required)
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project
- `GET /projects/{id}/agents` - List agents

### Widget Settings (Auth Required)
- `GET /projects/{id}/widget-settings` - Get settings
- `PUT /projects/{id}/widget-settings` - Update settings
- `GET /projects/{id}/embed-code` - Get embed code

### Invitations
- `GET /invitations/{token}` - View invitation (Public)
- `POST /invitations/{token}/accept` - Accept invitation (Public)
- `POST /invitations/{token}/reject` - Reject invitation (Public)
- `POST /projects/{id}/invitations` - Send invitation (Auth)
- `GET /projects/{id}/invitations` - List invitations (Auth)

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_DATABASE=linochat
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# SendGrid Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your-sendgrid-key

# WebSocket (Reverb)
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

## 🚀 Quick Start

1. **Install dependencies**:
```bash
composer install
```

2. **Run migrations**:
```bash
php artisan migrate
```

3. **Generate JWT secret**:
```bash
php artisan jwt:secret
```

4. **Start the server**:
```bash
php artisan serve --port=8000
```

5. **Start WebSocket server**:
```bash
php artisan reverb:start --port=8080
```

6. **View API docs**:
Open http://localhost:8000/api/docs

## 📖 Example Requests

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "website": "https://company.com",
    "company_name": "Acme Inc"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Initialize Widget Chat
```bash
curl -X POST http://localhost:8000/api/widget/{widget_id}/init \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "customer@example.com",
    "customer_name": "Jane Doe"
  }'
```

## 📝 License

MIT License
