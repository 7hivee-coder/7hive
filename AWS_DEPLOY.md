# 7hive — AWS Permanent Deployment Guide

This guide deploys 7hive (Angular + FastAPI + PostgreSQL) on an **AWS EC2** instance
using Docker Compose. Estimated time: 30–45 minutes.

---

## Prerequisites (do these once)

- AWS account with EC2 access
- A domain name (optional but recommended for HTTPS)
- Your project pushed to a GitHub repository

---

## Step 1 — Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose these settings:
   - **Name**: `7hive-server`
   - **AMI**: `Ubuntu Server 24.04 LTS (HVM)` (x86_64)
   - **Instance type**: `t3.small` (minimum; `t3.medium` recommended for builds)
   - **Key pair**: Create a new key pair → name it `7hive-key` → download the `.pem` file
3. Under **Network settings**:
   - Allow **SSH** (port 22) — your IP only
   - Allow **HTTP** (port 80) — Anywhere (0.0.0.0/0)
   - Allow **HTTPS** (port 443) — Anywhere (0.0.0.0/0)
4. Under **Storage**: Set root volume to **20 GB** (gp3)
5. Click **Launch Instance**

---

## Step 2 — Connect to EC2

```bash
# Fix key permissions (Mac/Linux)
chmod 400 ~/Downloads/7hive-key.pem

# SSH in (replace <EC2_PUBLIC_IP> with your instance's public IPv4)
ssh -i ~/Downloads/7hive-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## Step 3 — Install Docker & Docker Compose on EC2

Run these commands on the EC2 instance:

```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Step 4 — Push your code to GitHub (if not done yet)

On your **local machine**:

```bash
cd /path/to/7hive

# Initialize git if needed
git init
git remote add origin https://github.com/YOUR_USERNAME/7hive.git

# Push
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Step 5 — Clone repo on EC2

```bash
# On EC2
git clone https://github.com/YOUR_USERNAME/7hive.git
cd 7hive
```

---

## Step 6 — Create the production `.env` on EC2

```bash
# On EC2 inside the 7hive directory
nano .env
```

Paste this content (replace ALL values with your own strong passwords):

```env
# PostgreSQL
POSTGRES_USER=sevenhive
POSTGRES_PASSWORD=CHANGE_THIS_VERY_STRONG_PASSWORD
POSTGRES_DB=imagedb

# Backend — fully expanded (no nested variable references)
DATABASE_URL=postgresql://sevenhive:CHANGE_THIS_VERY_STRONG_PASSWORD@db:5432/imagedb

# Your domain or EC2 public IP
CORS_ORIGINS=http://<EC2_PUBLIC_IP>,https://yourdomain.com
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Step 7 — Build and Start with Production Compose

```bash
# On EC2
docker compose -f docker-compose.prod.yml up --build -d
```

This will:
- Build the Angular frontend (takes ~3–5 min on first run)
- Build the FastAPI backend
- Start PostgreSQL, backend, and nginx frontend

Check status:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

App will be available at: **http://<EC2_PUBLIC_IP>:8080** (prod compose uses port 8080)

> **Note**: `docker-compose.prod.yml` exposes the frontend on port **8080**.
> To serve on port 80 directly, either change that to `"80:80"` or use the
> Elastic IP + domain setup below.

---

## Step 8 — Assign an Elastic IP (permanent IP)

1. AWS Console → **EC2 → Elastic IPs → Allocate Elastic IP address**
2. Click **Allocate**
3. Select the new IP → **Actions → Associate Elastic IP address**
4. Choose your `7hive-server` instance → **Associate**

Your app now has a **permanent IP** that survives instance restarts.

---

## Step 9 — (Optional) Set up a Custom Domain + HTTPS

### 9a — Point your domain to the EC2 IP

In your domain registrar's DNS settings, add:
```
A   @   <ELASTIC_IP>
A   www <ELASTIC_IP>
```
Wait 5–30 minutes for DNS propagation.

### 9b — Install Certbot for free SSL (Let's Encrypt)

```bash
# On EC2
sudo apt-get install -y certbot

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop frontend

# Get certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates are saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 9c — Use the SSL nginx config

The repo already includes `nginx-ssl.conf`. Mount it in your compose:

```bash
# Edit docker-compose.prod.yml on EC2 to add volumes to the frontend service:
#   volumes:
#     - /etc/letsencrypt:/etc/letsencrypt:ro
#     - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
#   ports:
#     - "80:80"
#     - "443:443"

docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

---

## Step 10 — Make it survive reboots

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create a systemd service for auto-start
sudo nano /etc/systemd/system/7hive.service
```

Paste:
```ini
[Unit]
Description=7hive Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/7hive
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable 7hive
sudo systemctl start 7hive
```

---

## Quick Reference — Useful Commands on EC2

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Full rebuild after code changes
git pull
docker compose -f docker-compose.prod.yml up --build -d

# Stop everything
docker compose -f docker-compose.prod.yml down
```

---

## Security Checklist

- [ ] Strong `POSTGRES_PASSWORD` (20+ chars, random)
- [ ] EC2 Security Group: SSH restricted to your IP only
- [ ] `.env` never committed to git (already in `.gitignore`)
- [ ] HTTPS enabled via Let's Encrypt
- [ ] Regular backups of the `db-data` Docker volume
