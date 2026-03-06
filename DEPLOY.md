# LinoChat Deployment Guide

Deploy runs on push to `master`.

## Auto-deploy via GitHub Actions

Deploys run automatically on push to `master`, or manually via **Actions → Deploy to Server → Run workflow**.

### 1. Add GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server hostname or IP (e.g. `linochat.com` or `123.45.67.89`) |
| `DEPLOY_USER` | SSH username (e.g. `deploy` or `root`) |
| `DEPLOY_SSH_KEY` | Private SSH key (full contents of `~/.ssh/id_rsa` or similar) |
| `DEPLOY_PATH` | Path to repo on server (e.g. `/var/www/linochat.com`) |
| `DEPLOY_PORT` | (Optional) SSH port, default 22 |

### 2. Server Setup

Ensure the server has:

- **Git** – repo cloned at `DEPLOY_PATH`
- **PHP 8.2+** with extensions: mbstring, pdo_mysql, openssl, tokenizer, xml, ctype, json, bcmath
- **Composer**
- **Node.js 18+** and **pnpm** (or npm)
- **MySQL** (or your DB)

Clone the repo if not already:

```bash
git clone https://github.com/clickwebstudios/linochat.com.git /var/www/linochat.com
cd /var/www/linochat.com
```

Configure `.env` files (never commit these):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with production values
php artisan key:generate
php artisan jwt:secret
```

### 3. SSH Key for GitHub Actions

Generate a deploy key or use an existing key:

```bash
ssh-keygen -t ed25519 -C "deploy@linochat" -f deploy_key -N ""
```

- Add **public key** (`deploy_key.pub`) to server `~/.ssh/authorized_keys`
- Add **private key** (`deploy_key`) as `DEPLOY_SSH_KEY` secret in GitHub

### 4. Web Server

Point your web server (Nginx/Apache) to:

- **Backend API**: `backend/public` (Laravel)
- **Frontend SPA**: `frontend/dist` (static files)

Example Nginx for API:

```nginx
server {
    listen 80;
    server_name api.linochat.com;
    root /var/www/linochat.com/backend/public;
    index index.php;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

Example for frontend:

```nginx
server {
    listen 80;
    server_name app.linochat.com;
    root /var/www/linochat.com/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5. Queue & Reverb (optional)

For background jobs and WebSockets, use Supervisor:

**`/etc/supervisor/conf.d/linochat-worker.conf`**:

```ini
[program:linochat-worker]
command=php /var/www/linochat.com/backend/artisan queue:work --sleep=3 --tries=3
directory=/var/www/linochat.com/backend
autostart=true
autorestart=true
user=www-data
```

**`/etc/supervisor/conf.d/linochat-reverb.conf`**:

```ini
[program:linochat-reverb]
command=php /var/www/linochat.com/backend/artisan reverb:start
directory=/var/www/linochat.com/backend
autostart=true
autorestart=true
user=www-data
```

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
```

### 6. Manual Deploy

To deploy manually on the server:

```bash
cd /var/www/linochat.com
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Environment Variables

### Backend (`backend/.env`)

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL` – API URL
- `DB_*` – Database
- `JWT_SECRET`
- `REVERB_*` – WebSocket
- `OPENAI_API_KEY`
- `MAIL_*` – SMTP
- `FRONTEND_URL` – Frontend URL for emails/redirects

### Frontend

Build-time vars (in `.env` or CI):

- `VITE_API_URL` – Backend API URL
- `VITE_REVERB_*` – WebSocket (match backend)
