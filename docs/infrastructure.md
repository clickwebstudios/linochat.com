# Infrastructure

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan jwt:secret          # For invitation accept flow
composer install
php artisan migrate --seed
php artisan serve               # Runs on :8000
php artisan queue:work          # Background jobs
php artisan reverb:start        # WebSocket server (if using Reverb)
```

Minimum `.env` for local dev:
```
DB_CONNECTION=sqlite            # Works out of box, no MySQL needed
OPENAI_API_KEY=sk-...           # Required for AI chat
MAIL_MAILER=log                 # Emails go to storage/logs, not sent
FRONTEND_URL=http://localhost:5173
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=...               # Or switch to reverb for local WS
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev                        # Runs on :5173
```

Minimum `.env` (create `.env.local`):
```
VITE_API_URL=http://localhost:8000/api
VITE_PUSHER_APP_KEY=...
VITE_PUSHER_APP_CLUSTER=us3
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## Production Deployment

### Auto-Deploy (GitHub Actions)

Triggers on push to `master`. Workflow file: `.github/workflows/deploy.yml`

Required GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user (e.g. `root`, `deploy`) |
| `DEPLOY_SSH_KEY` | Private SSH key (full PEM content) |
| `DEPLOY_PATH` | Repo path on server (e.g. `/var/www/linochat.com`) |
| `DEPLOY_PORT` | SSH port (default 22) |

### Manual Deploy

```bash
cd /var/www/linochat.com
./scripts/deploy.sh
```

What `deploy.sh` does:
1. `git pull origin master`
2. `composer install --no-dev --optimize-autoloader`
3. `php artisan migrate --force`
4. `php artisan config:cache && route:cache && view:cache`
5. `pnpm install --frozen-lockfile`
6. `pnpm run build`

### Server Requirements

| Requirement | Version |
|-------------|---------|
| PHP | 8.2+ (8.4 recommended) |
| PHP extensions | mbstring, pdo_mysql, openssl, tokenizer, xml, ctype, json, bcmath, curl |
| Composer | 2.x |
| Node.js | 18+ |
| pnpm | latest |
| MySQL | 8.0+ |
| Nginx | 1.18+ |

---

## Nginx Configuration

### Same-Domain Setup (frontend + API on `linochat.com`)

```nginx
server {
    listen 443 ssl;
    server_name linochat.com www.linochat.com;
    root /var/www/linochat.com/frontend/dist;

    # API → Laravel
    location /api {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/linochat.com/backend/public/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
    }

    # File storage
    location /storage {
        alias /var/www/linochat.com/backend/storage/app/public;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Common issue**: "Failed to initialize chat: 404" means the `/api` location block is missing or misconfigured. The chat widget calls `/api/widget/{id}/init` — if this 404s, no chat works.

### WebSocket (Reverb)

```nginx
location /app {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

---

## Supervisor (Queue Workers + Reverb)

Create `/etc/supervisor/conf.d/linochat.conf`:

```ini
[program:linochat-worker]
command=php /var/www/linochat.com/backend/artisan queue:work --sleep=3 --tries=3
directory=/var/www/linochat.com/backend
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/log/linochat-worker.log
stderr_logfile=/var/log/linochat-worker-err.log

[program:linochat-reverb]
command=php /var/www/linochat.com/backend/artisan reverb:start
directory=/var/www/linochat.com/backend
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/log/linochat-reverb.log
stderr_logfile=/var/log/linochat-reverb-err.log
```

```bash
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl start linochat-worker
sudo supervisorctl start linochat-reverb
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_KEY` | Yes | Laravel app key — `php artisan key:generate` |
| `APP_URL` | Yes | API URL (e.g. `https://linochat.com/api`) |
| `APP_DEBUG` | Yes | `false` in production |
| `FRONTEND_URL` | Yes | Frontend URL for email links and OAuth redirects |
| `DB_CONNECTION` | Yes | `mysql` (production) or `sqlite` (local) |
| `DB_HOST` | MySQL only | |
| `DB_DATABASE` | MySQL only | |
| `DB_USERNAME` | MySQL only | |
| `DB_PASSWORD` | MySQL only | |
| `JWT_SECRET` | Yes | `php artisan jwt:secret` — for invitation flow |
| `BROADCAST_CONNECTION` | Yes | `pusher` or `reverb` |
| `PUSHER_APP_ID` | If Pusher | |
| `PUSHER_APP_KEY` | If Pusher | |
| `PUSHER_APP_SECRET` | If Pusher | |
| `PUSHER_APP_CLUSTER` | If Pusher | |
| `REVERB_APP_ID` | If Reverb | |
| `REVERB_APP_KEY` | If Reverb | |
| `REVERB_APP_SECRET` | If Reverb | |
| `REVERB_HOST` | If Reverb | |
| `REVERB_PORT` | If Reverb | |
| `OPENAI_API_KEY` | Yes | For AI chat, KB generation, embeddings |
| `MAIL_MAILER` | Yes | `resend`, `smtp`, `mailgun`, `ses`, or `log` |
| `RESEND_API_KEY` | If Resend | |
| `MAIL_FROM_ADDRESS` | Yes | Sender email |
| `QUEUE_CONNECTION` | Yes | `database` (default) or `redis` |
| `FRUBIX_URL` | If Frubix | Default `https://frubix.com` |
| `FRUBIX_CLIENT_ID` | If Frubix | OAuth client ID |
| `FRUBIX_CLIENT_SECRET` | If Frubix | OAuth client secret |
| `FRUBIX_REDIRECT_URI` | If Frubix | Must match registered URI |
| `CORS_WIDGET_ALLOWED_ORIGINS` | Optional | `*` or comma-separated origins for widget CORS |

### Frontend (build-time, `.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. `/api` for same-domain) |
| `VITE_PUSHER_APP_KEY` | Pusher app key |
| `VITE_PUSHER_APP_CLUSTER` | Pusher cluster |
| `VITE_REVERB_APP_KEY` | If using Reverb |
| `VITE_REVERB_HOST` | If using Reverb |
| `VITE_REVERB_PORT` | If using Reverb |

---

## Database Backup

No automated backup configured. Recommended:
```bash
# Add to crontab
0 2 * * * mysqldump -u root -p linochat | gzip > /backup/linochat-$(date +%Y%m%d).sql.gz
```

---

## SSL

Use Let's Encrypt / Certbot:
```bash
certbot --nginx -d linochat.com -d www.linochat.com
```
