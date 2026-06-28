# 7hive — Connect GoDaddy Domain to AWS EC2

This guide connects your GoDaddy domain to your running EC2 instance and sets up
free HTTPS via Let's Encrypt. Estimated time: 15–30 minutes (+ up to 30 min DNS propagation).

---

## Prerequisites

- Your EC2 is running with an **Elastic IP** assigned (see AWS_DEPLOY.md Step 8)
- You own a domain on GoDaddy (e.g. `7hive.com`)
- The app is already running on EC2

---

## Step 1 — Point GoDaddy DNS to your EC2 Elastic IP

1. Log in to **https://godaddy.com → My Products → Domains**
2. Click **DNS** next to your domain
3. Find the **A records** section and update/add these two records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<YOUR_ELASTIC_IP>` | 600 |
| A | `www` | `<YOUR_ELASTIC_IP>` | 600 |

> - `@` means the root domain (e.g. `7hive.com`)
> - `www` covers `www.7hive.com`
> - Delete any existing A records that point elsewhere before adding these

4. Click **Save**

DNS changes propagate in **5–30 minutes** (sometimes up to 2 hours).

### Verify DNS is propagated

```bash
# Run this on your local machine (replace yourdomain.com)
nslookup yourdomain.com
# or
dig yourdomain.com +short

# Should return your Elastic IP
```

---

## Step 2 — Open Port 80 & 443 on EC2 Security Group

Make sure these ports are open (you may have done this already):

1. AWS Console → **EC2 → Instances → your instance → Security tab**
2. Click the Security Group link → **Edit inbound rules**
3. Ensure these rules exist:

| Type | Port | Source |
|------|------|--------|
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| SSH | 22 | My IP |

---

## Step 3 — Update `CORS_ORIGINS` on EC2

SSH into your EC2 and update the `.env` file:

```bash
ssh -i ~/Downloads/7hive-key.pem ubuntu@<ELASTIC_IP>
cd ~/7hive
nano .env
```

Update `CORS_ORIGINS` to include your domain:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Save (`Ctrl+O`, `Enter`, `Ctrl+X`), then restart the backend:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

## Step 4 — Install Certbot and get a free SSL certificate

```bash
# On EC2
sudo apt-get update
sudo apt-get install -y certbot

# Temporarily stop the frontend container so port 80 is free
docker compose -f docker-compose.prod.yml stop frontend

# Get the SSL certificate (replace yourdomain.com with your actual domain)
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --non-interactive \
  --email your@email.com
```

Certificates will be saved to:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

---

## Step 5 — Update nginx config for HTTPS

The repo already includes `nginx-ssl.conf`. Open it and fill in your domain:

```bash
nano ~/7hive/nginx-ssl.conf
```

Find and replace `yourdomain.com` with your actual domain name (there are usually
2–3 occurrences for the certificate paths and server_name).

---

## Step 6 — Update `docker-compose.prod.yml` for HTTPS

SSH into EC2, open the prod compose file:

```bash
nano ~/7hive/docker-compose.prod.yml
```

Replace the `frontend` service section with this:

```yaml
  frontend:
    image: ${DOCKERHUB_USERNAME:-}/7hive-frontend:latest
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - app-network
    depends_on:
      backend:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Then restart:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

Your site is now live at **https://yourdomain.com** 🎉

---

## Step 7 — Auto-renew SSL certificates (Let's Encrypt expires every 90 days)

```bash
# Test renewal works
sudo certbot renew --dry-run

# Add a cron job to auto-renew every month
sudo crontab -e
```

Add this line to the crontab:

```
0 3 1 * * certbot renew --quiet && docker compose -f /home/ubuntu/7hive/docker-compose.prod.yml restart frontend
```

This runs on the 1st of every month at 3 AM, renews the cert if needed, and restarts nginx.

---

## Step 8 — Verify everything works

```bash
# Check HTTP redirects to HTTPS
curl -I http://yourdomain.com
# Should see: Location: https://yourdomain.com

# Check HTTPS loads correctly
curl -I https://yourdomain.com
# Should see: HTTP/2 200

# Check the SSL certificate
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Troubleshooting

**`certbot` fails with "port 80 already in use":**
```bash
docker compose -f docker-compose.prod.yml stop frontend
# then retry certbot command
```

**DNS not resolving yet:**
- Wait 15–30 more minutes, GoDaddy TTL can be slow
- Check at https://dnschecker.org — enter your domain and select A record

**Site loads on IP but not domain:**
- Confirm the A record in GoDaddy is pointing to the Elastic IP (not the regular public IP)
- Elastic IP never changes; regular public IP changes on every restart

**Mixed content warnings (HTTP resources on HTTPS page):**
- Check Angular environment files — API base URL should use `https://yourdomain.com/api`
- Update and redeploy the frontend image
