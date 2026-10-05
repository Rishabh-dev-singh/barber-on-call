#!/bin/bash
# ==============================================================================
# Barber On Call - Build, Migrate & Service Restart Script
# ==============================================================================

set -e

APP_DIR="/var/www/barberoncall"
if [ -d "$APP_DIR/Backend" ] && [ ! -d "$APP_DIR/backend" ]; then
    mv "$APP_DIR/Backend" "$APP_DIR/backend"
fi
ln -sf "$APP_DIR/backend" "$APP_DIR/Backend" 2>/dev/null || true

BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
VENV_BIN="$APP_DIR/venv/bin"

echo "🔄 [1/5] Installing Backend Dependencies..."
cd $BACKEND_DIR
$VENV_BIN/pip install -r requirements.txt

echo "🗄️ [2/5] Running Database Migrations..."
$VENV_BIN/python manage.py migrate --noinput

echo "📦 [3/5] Collecting Static Files..."
$VENV_BIN/python manage.py collectstatic --noinput

echo "⚛️ [4/5] Building React Production Frontend..."
cd $FRONTEND_DIR
npm install --legacy-peer-deps
npm run build

echo "🚀 [5/5] Restarting Gunicorn & Nginx Services..."
systemctl restart barberoncall.service
systemctl restart nginx

echo "=================================================================="
echo "🎉 Deployment Successful! App is live at http://barberoncall.site"
echo "To enable Free SSL (HTTPS), run:"
echo "apt install -y certbot python3-certbot-nginx"
echo "certbot --nginx -d barberoncall.site -d www.barberoncall.site -d api.barberoncall.site"
echo "=================================================================="
