# 7hive — GitHub Actions CI/CD Setup Guide

Every push to `main` automatically builds Docker images and deploys to your EC2.

---

## How the pipeline works

```
git push → GitHub Actions →
  1. Builds frontend & backend Docker images
  2. Pushes them to Docker Hub (with :latest and :<git-sha> tags)
  3. SSHs into your EC2
  4. git pull + docker compose up -d (uses pre-built images)
```

---

## Step 1 — Create a Docker Hub account & Access Token

1. Sign up at **https://hub.docker.com** (free)
2. Go to **Account Settings → Security → New Access Token**
3. Name it `github-actions`, set permission to **Read & Write**
4. Copy the token — you'll only see it once

---

## Step 2 — Add GitHub Secrets

In your GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret**.

Add these 4 secrets:

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The access token from Step 1 |
| `EC2_HOST` | Your EC2 Elastic IP address |
| `EC2_SSH_PRIVATE_KEY` | Full contents of your `.pem` key file |

### How to get `EC2_SSH_PRIVATE_KEY`:
```bash
# On your local machine:
cat ~/Downloads/7hive-key.pem
# Copy the ENTIRE output including -----BEGIN RSA PRIVATE KEY----- lines
```

---

## Step 3 — Add `DOCKERHUB_USERNAME` to the EC2 `.env`

SSH into your EC2 and add this line to `~/7hive/.env`:

```env
DOCKERHUB_USERNAME=your_dockerhub_username
```

This lets `docker-compose.prod.yml` pull the correct pre-built images.

---

## Step 4 — First manual deployment (one-time)

Do this once to set up the EC2 before CI/CD takes over:

```bash
# On EC2
cd ~/7hive
docker compose -f docker-compose.prod.yml up --build -d
```

After this, every `git push` to `main` will auto-deploy.

---

## Step 5 — Push to trigger the pipeline

```bash
# On your local machine
git add .
git commit -m "Setup CI/CD"
git push origin main
```

Watch the pipeline at: `https://github.com/YOUR_USERNAME/7hive/actions`

---

## Pipeline file location

```
.github/workflows/deploy.yml
```

---

## Triggering a manual deploy

Go to **GitHub → Actions → Build & Deploy 7hive → Run workflow → Run workflow**

---

## Rollback to a previous version

Each deploy is tagged with the git commit SHA. To rollback:

```bash
# On EC2
docker pull your_dockerhub_username/7hive-frontend:<previous-sha>
docker pull your_dockerhub_username/7hive-backend:<previous-sha>

# Update .env temporarily
FRONTEND_TAG=<previous-sha>
BACKEND_TAG=<previous-sha>

docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

**Pipeline fails at SSH step:**
- Check `EC2_HOST` is the correct public IP
- Ensure Security Group allows port 22 from GitHub's IP ranges
- Verify the `.pem` key was copied completely into the secret

**Images not updating on EC2:**
- Confirm `DOCKERHUB_USERNAME` is in the EC2 `.env` file
- Run `docker compose -f docker-compose.prod.yml pull` manually on EC2

**Build fails (npm / Angular):**
- Check the GitHub Actions logs under the "Build & push frontend image" step
- Angular 21 build needs ~1.5 GB RAM; if builds fail, the GitHub-hosted runner
  should have enough (7 GB), but EC2 builds on `t3.micro` may OOM
