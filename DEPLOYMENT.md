# 🚀 Deployment Guide — RepurposeAI

## Local Development

### Prerequisites
| Tool | Version | Install |
|------|---------|---------|
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Docker Compose | v2+ | Included with Docker Desktop |
| Node.js | 20+ | https://nodejs.org (for local frontend dev only) |
| Python | 3.12+ | https://python.org (for local backend dev only) |

### Required API Keys
| Service | Purpose | Get it at |
|---------|---------|-----------|
| Anthropic | AI content generation | https://console.anthropic.com |
| AssemblyAI | Audio/video transcription | https://assemblyai.com |
| Stripe | Payment processing | https://stripe.com |

### Start in 3 commands
```bash
# 1. Configure
cp .env.example .env
# Edit .env — add your API keys

# 2. Launch
docker compose up --build

# 3. Migrate DB
docker compose exec backend alembic upgrade head
```

### Access points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Celery Flower | http://localhost:5555 |
| Nginx proxy | http://localhost:80 |

---

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create 3 products in Stripe Dashboard:
   - "RepurposeAI Starter" — $19/month recurring
   - "RepurposeAI Pro" — $49/month recurring
   - "RepurposeAI Agency" — $149/month recurring
3. Copy each Price ID into your `.env`:
   ```
   STRIPE_STARTER_PRICE_ID=price_xxx
   STRIPE_PRO_PRICE_ID=price_xxx
   STRIPE_AGENCY_PRICE_ID=price_xxx
   ```
4. Set up webhook in Stripe Dashboard → Developers → Webhooks:
   - URL: `https://yourdomain.com/api/v1/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local testing:
```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

---

## Production Deployment (VPS / Cloud)

### Option A: Single VPS (DigitalOcean / Hetzner / Linode)

Recommended: **2 vCPU, 4GB RAM** droplet (~$24/month)

```bash
# On your server
git clone https://github.com/yourname/repurpose-ai.git
cd repurpose-ai
cp .env.example .env
# Fill in .env with production values
# Set APP_ENV=production

# Generate SSL cert (or use Certbot)
make ssl-init

# Launch production stack
make prod-up

# Run migrations
make migrate
```

### Option B: AWS / GCP / Azure

Use managed services for better reliability:
- **Database**: AWS RDS (PostgreSQL) or Supabase
- **Redis**: AWS ElastiCache or Upstash
- **Storage**: AWS S3 (set `STORAGE_TYPE=s3` in `.env`)
- **App**: EC2 / ECS / Cloud Run
- **CDN**: CloudFront for static frontend assets

### Environment differences (production .env)
```bash
APP_ENV=production
STORAGE_TYPE=s3              # Use S3 instead of local disk
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Architecture Decision Notes

### Why Celery for AI tasks?
Claude API calls take 10-60 seconds. Celery lets the API return `202 Accepted` immediately while the heavy processing happens in the background. The frontend polls `/api/v1/jobs/{id}` every 2-3 seconds until status changes to `completed`.

### Why Redis for both cache AND queue?
Simplicity. Redis is already needed for Celery. Using it for cache too avoids another service. In high-scale production, you'd split these.

### Why PostgreSQL over SQLite?
Concurrent writes from multiple Celery workers. SQLite locks the file on write — this would cause failures under load.

### Scaling Celery workers
```bash
# Add more workers by scaling the service
docker compose up --scale celery_worker=4
```

---

## Monitoring

- **Flower** (Celery monitor): http://localhost:5555
- **API health**: GET http://localhost:8000/health
- Add **Sentry** by setting `SENTRY_DSN` in `.env` (already wired in)

---

## Common Issues

### Job stuck in "processing"
```bash
# Check worker logs
docker compose logs celery_worker

# Check if Redis is running
docker compose exec redis redis-cli ping
```

### Database migration errors
```bash
# Reset migrations (dev only!)
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

### Port conflicts
Edit `docker-compose.yml` to change host ports:
```yaml
ports:
  - "8001:8000"  # Backend on 8001 instead
```
