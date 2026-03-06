#!/bin/bash
# LinoChat deploy script - run this on the server (or via SSH from CI)
# Usage: ./scripts/deploy.sh [path-to-repo]
# Default: assumes script is run from repo root

set -e

REPO_PATH="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_PATH"

echo ">>> Deploying from $REPO_PATH"

echo ">>> Pulling latest code..."
git pull origin master

echo ">>> Backend: Installing dependencies..."
cd backend
composer install --no-dev --optimize-autoloader --no-interaction

echo ">>> Backend: Running migrations..."
php artisan migrate --force

echo ">>> Backend: Caching..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ">>> Frontend: Installing dependencies..."
cd ../frontend
if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
else
  npm ci
fi

echo ">>> Frontend: Building..."
if command -v pnpm &> /dev/null; then
  pnpm run build
else
  npm run build
fi

cd ..

echo ">>> Restarting services (if configured)..."
# Uncomment and adjust for your setup:
# sudo systemctl reload php8.2-fpm
# sudo supervisorctl restart linochat-worker
# sudo supervisorctl restart linochat-reverb

echo ">>> Deploy complete!"
