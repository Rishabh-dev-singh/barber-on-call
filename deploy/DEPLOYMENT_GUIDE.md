# 🚀 Barber On Call — Hostinger VPS Deployment Guide

- **Domain**: `barberoncall.site`
- **VPS IP**: `187.127.143.21`
- **OS**: Ubuntu (KVM 2)

---

## Step 1: Hostinger Me DNS Records Point Karein

Hostinger Dashboard me jayein ➔ **Domains** ➔ **barberoncall.site** ➔ **DNS / Nameservers**:

Add/Update these 3 **A Records**:

| Type | Name / Host | Points to | TTL |
| :---: | :---: | :---: | :---: |
| **A** | `@` | `187.127.143.21` | 300 |
| **A** | `www` | `187.127.143.21` | 300 |
| **A** | `api` | `187.127.143.21` | 300 |

*(DNS update hone me 5-10 minute lagte hain)*

---

## Step 2: Code Ko VPS Par Upload Karna

Aapke laptop ke PowerShell se direct project ko VPS par copy kar sakte hain:

```powershell
# Project directory me jakar ye command chalayein:
scp -r "c:\Barber_On_Call - Copy (3) - Copy" root@187.127.143.21:/var/www/barberoncall
```

Ya fir project ka ek zip banakar VPS par upload kar sakte hain:
1. Pure project ko zip karein (node_modules aur venv chhod kar).
2. Hostinger VPS Browser Terminal ya File Manager se `/var/www/barberoncall` me unzip karein.

---

## Step 3: VPS Terminal Me Setup Script Chalana

Hostinger VPS ke **Browser Terminal** me jayein (ya SSH karein `ssh root@187.127.143.21`) aur bas ye 2 commands chalayein:

```bash
# 1. System packages, PostgreSQL, Node, Nginx install aur configure karein:
bash /var/www/barberoncall/deploy/setup_vps.sh

# 2. Production .env files copy karein:
cp /var/www/barberoncall/deploy/production.backend.env /var/www/barberoncall/backend/.env
cp /var/www/barberoncall/deploy/production.frontend.env /var/www/barberoncall/frontend/.env

# 3. Database migrations chalayein, Frontend build karein aur services start karein:
bash /var/www/barberoncall/deploy/deploy.sh
```

---

## Step 4: Free SSL (HTTPS) Activate Karna

Setup complete hone ke baad VPS terminal me ye command chalayein:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d barberoncall.site -d www.barberoncall.site -d api.barberoncall.site
```
Email enter karein aur `Y` dabayein. 
Aapka website **`https://barberoncall.site`** par completely secure live ho jayega!
