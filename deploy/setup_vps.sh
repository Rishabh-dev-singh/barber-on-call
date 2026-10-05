#!/bin/bash
# ==============================================================================
# Barber On Call - Automated Production Setup Script for Hostinger VPS (Ubuntu)
# Domain: barberoncall.site | Host IP: 187.127.143.21
# ==============================================================================

set -e

echo "🚀 [1/8] Updating Ubuntu system packages..."
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv python3-dev libpq-dev postgresql postgresql-contrib nginx git curl ufw

echo "📦 [2/8] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "🗄️ [3/8] Setting up PostgreSQL Database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'barber_on_call'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE barber_on_call;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'barber_user'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER barber_user WITH PASSWORD 'BarberOnCall@2026_SecureDb!';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE barber_on_call TO barber_user;"
sudo -u postgres psql -d barber_on_call -c "GRANT ALL ON SCHEMA public TO barber_user;"

echo "📁 [4/8] Creating Directory Structure & Log Directories..."
mkdir -p /var/www/barberoncall
mkdir -p /var/log/gunicorn

# Handle case sensitivity on Linux
if [ -d "/var/www/barberoncall/Backend" ] && [ ! -d "/var/www/barberoncall/backend" ]; then
    mv /var/www/barberoncall/Backend /var/www/barberoncall/backend
fi
ln -sf /var/www/barberoncall/backend /var/www/barberoncall/Backend 2>/dev/null || true

mkdir -p /var/www/barberoncall/backend/media
mkdir -p /var/www/barberoncall/backend/staticfiles
chmod -R 775 /var/www/barberoncall/backend/media
chown -R root:www-data /var/log/gunicorn

echo "🐍 [5/8] Setting up Python Virtual Environment..."
if [ ! -d "/var/www/barberoncall/venv" ]; then
    python3 -m venv /var/www/barberoncall/venv
fi

/var/www/barberoncall/venv/bin/pip install --upgrade pip
if [ -f "/var/www/barberoncall/backend/requirements.txt" ]; then
    /var/www/barberoncall/venv/bin/pip install -r /var/www/barberoncall/backend/requirements.txt
fi

echo "⚙️ [6/8] Configuring Systemd Service for Gunicorn..."
cp /var/www/barberoncall/deploy/barberoncall.service /etc/systemd/system/barberoncall.service
systemctl daemon-reload
systemctl enable barberoncall.service

echo "🌐 [7/8] Configuring Nginx Web Server..."
cp /var/www/barberoncall/deploy/barberoncall.nginx.conf /etc/nginx/sites-available/barberoncall
ln -sf /etc/nginx/sites-available/barberoncall /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "🔒 [8/8] Setting up Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true

echo "=================================================================="
echo "✅ VPS Environment Setup Complete!"
echo "Next step: Run the project migration & build script:"
echo "bash /var/www/barberoncall/deploy/deploy.sh"
echo "=================================================================="
