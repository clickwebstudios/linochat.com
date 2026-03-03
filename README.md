# LinoChat

## Design

🎨 **Figma Design File:** [LinoChat - Desktop](https://www.figma.com/design/0jiiT3qjd5QfHbPWHigV7y/LinoChat---Desktop) - AI-Powered Customer Support Platform

LinoChat is a modern customer support platform with live chat, ticketing, knowledge base, and multi-tenant company management. It features role-based access for Agents, Admins, and Superadmins, plus a customer-facing help center and embeddable chat widget.

## Features

- **Live Chat** - Real-time customer chat with AI assistance and human handover
- **Ticket Management** - Support ticket system with priorities, categories, and assignments
- **Knowledge Base** - AI-powered article search and recommendations
- **Multi-tenant** - Company-based organization with project isolation
- **Role-based Access** - Superadmin, Admin, and Agent roles with different permissions
- **Embeddable Widget** - JavaScript widget for customer websites
- **Real-time Updates** - WebSocket-powered live updates via Laravel Reverb/Pusher

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript | React 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **Styling** | Tailwind CSS | 4.1.12 |
| **UI Components** | shadcn/ui + Radix UI | Various |
| **Backend** | Laravel (PHP) | 12.0 |
| **Authentication** | JWT (tymon/jwt-auth) | ^2.2 |
| **Database** | MySQL 8.0 / SQLite | - |
| **Real-time** | Laravel Reverb / Pusher | - |
| **AI** | OpenAI GPT-4o-mini | - |

## Project Structure

```
linochat/
├── frontend/                  # React SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx           # Main router configuration
│   │   │   ├── components/
│   │   │   │   ├── ui/          # 48 shadcn/ui primitives
│   │   │   │   ├── layouts/     # Dashboard layouts
│   │   │   │   ├── agent-dashboard/   # Agent dashboard views
│   │   │   │   ├── project-details/   # Project detail tabs
│   │   │   │   └── superadmin/        # Superadmin components
│   │   │   ├── pages/           # Route pages
│   │   │   │   ├── marketing/   # Public marketing pages
│   │   │   │   ├── auth/        # Login, Signup, ForgotPassword
│   │   │   │   ├── dashboards/  # Agent, Admin, Superadmin dashboards
│   │   │   │   └── customer/    # HelpCenter
│   │   │   ├── data/            # Mock data, stores
│   │   │   ├── api/             # API client and services
│   │   │   ├── hooks/           # React hooks
│   │   │   ├── lib/             # Utility functions
│   │   │   └── types/           # TypeScript types
│   │   ├── styles/              # CSS files (theme.css, tailwind.css)
│   │   ├── main.tsx             # App entry point
│   │   └── ssg-entry.tsx        # SSG entry point
│   ├── docs/                    # Project documentation
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                   # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/         # API controllers
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── WidgetController.php
│   │   │   │   │   ├── AgentChatController.php
│   │   │   │   │   ├── TicketController.php
│   │   │   │   │   └── ...
│   │   │   │   └── WidgetLoaderController.php  # Serves widget.js
│   │   ├── Models/              # Eloquent models
│   │   │   ├── User.php
│   │   │   ├── Chat.php
│   │   │   ├── Project.php
│   │   │   ├── Ticket.php
│   │   │   └── ...
│   │   ├── Services/            # Business logic services
│   │   │   └── AiChatService.php
│   │   ├── Events/              # Broadcasting events
│   │   └── ...
│   ├── config/                  # Laravel configuration
│   ├── database/
│   │   ├── migrations/          # Database migrations
│   │   └── seeders/             # Database seeders
│   ├── routes/
│   │   └── api.php              # API route definitions
│   ├── tests/                   # PHPUnit tests
│   ├── composer.json
│   └── .env.example
│
├── mobile/                    # Reserved for future mobile app
├── docker/                    # Docker configuration
├── nginx/                     # Nginx configuration
├── supervisor/                # Supervisor configuration
├── scripts/                   # Deployment scripts
└── docs/                      # Additional documentation
```

## Key Components

### Frontend Components

| Component | Description |
|-----------|-------------|
| `ChatWidget.tsx` | Embeddable chat widget for customer sites |
| `ChatsView.tsx` | Agent dashboard chat interface |
| `AgentDashboard.tsx` | Main agent dashboard with routing |
| `SuperadminDashboard.tsx` | Superadmin management interface |
| `HelpCenter.tsx` | Customer-facing help center |

### Backend Controllers

| Controller | Description |
|------------|-------------|
| `WidgetController.php` | Widget API endpoints (config, init, messages) |
| `WidgetLoaderController.php` | Serves widget.js and widget.css |
| `AgentChatController.php` | Agent chat management |
| `AuthController.php` | JWT authentication |
| `TicketController.php` | Ticket CRUD operations |

## Quick Start

### Prerequisites

- PHP 8.2+
- Node.js 18+
- MySQL 8.0+ or SQLite
- Composer
- npm

### Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Configure database in .env, then run migrations
php artisan migrate

# Start development server
php artisan serve
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

> **⚠️ Security Warning**: Never commit `.env` files to git! They contain sensitive credentials.
> 
> The `.gitignore` already excludes `.env` files. Use `.env.backend.example` and `.env.frontend.example` as templates.

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
# Then edit backend/.env with your actual values
```

Key variables to configure:
- `APP_NAME` - Application name
- `APP_URL` - Your application URL
- `DB_*` - Database connection settings
- `JWT_SECRET` - Secret key for JWT tokens (generate with `php artisan jwt:secret`)
- `REVERB_*` - WebSocket configuration for real-time features
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `MAIL_*` - SMTP settings for email notifications

#### Frontend (.env)
```bash
cp frontend/.env.frontend.example frontend/.env
# Then edit frontend/.env with your actual values
```

Key variables:
- `VITE_API_URL` - Backend API URL
- `VITE_REVERB_*` - WebSocket configuration (should match backend)

## Widget Integration

Add the chat widget to any website:

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/widget?id=YOUR_WIDGET_ID';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  })();
</script>
```

## API Documentation

API documentation is available via Swagger UI at:
```
http://localhost:8000/api/docs
```

## Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```

## Deployment

See [DEPLOY.md](DEPLOY.md) and [CI_CD_SETUP.md](CI_CD_SETUP.md) for detailed deployment instructions.

> **⚠️ Security**: On production servers, ensure `.env` files have restricted permissions (`chmod 600 .env`) and are never exposed publicly.

Quick deployment checklist:
1. Configure production `.env` files (manually on server, never commit them!)
2. Run `composer install --no-dev --optimize-autoloader`
3. Run `php artisan config:cache` and `php artisan route:cache`
4. Run `npm run build` in frontend
5. Set proper permissions on `storage/` and `bootstrap/cache/`

## Documentation

| Document | Description |
|----------|-------------|
| [AGENTS.md](AGENTS.md) | AI coding agent guide |
| [SETUP.md](SETUP.md) | Detailed setup instructions |
| [DEPLOY.md](DEPLOY.md) | Deployment guide |
| [CI_CD_SETUP.md](CI_CD_SETUP.md) | CI/CD configuration |
| [INTEGRATION_GUIDE.md](frontend/INTEGRATION_GUIDE.md) | Frontend integration guide |
| [frontend/docs/architecture.md](frontend/docs/architecture.md) | Frontend architecture |
| [frontend/docs/database-schema.md](frontend/docs/database-schema.md) | Database schema |

## License

This project is open-sourced software licensed under the MIT license.
