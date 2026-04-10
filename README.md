# 🚀 RepurposeAI — 1 Asset → 10 Platform-Ready Pieces

> AI-powered content repurposing micro-SaaS for creators & marketers.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│   React 18 + Vite  |  TailwindCSS  |  React Query          │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                     NGINX REVERSE PROXY                      │
│         Rate limiting | SSL termination | Static serve       │
└─────────────┬───────────────────────────┬───────────────────┘
              │ /api/*                    │ /*
┌─────────────▼────────────┐  ┌───────────▼──────────────────┐
│   FastAPI Backend        │  │   React Frontend (Static)    │
│   Python 3.12            │  │   Served by Nginx            │
│   Uvicorn + Gunicorn     │  └──────────────────────────────┘
└─────────────┬────────────┘
      ┌───────┼────────┬──────────────┐
      │       │        │              │
┌─────▼──┐ ┌──▼───┐ ┌──▼──────┐ ┌───▼──────────┐
│Postgres│ │Redis │ │Celery   │ │  Anthropic   │
│  DB    │ │Cache │ │Workers  │ │  Claude API  │
│        │ │+Queue│ │(async)  │ │              │
└────────┘ └──────┘ └─────────┘ └──────────────┘
                                        │
                              ┌─────────▼────────┐
                              │  External APIs   │
                              │  - AssemblyAI    │
                              │  - Whisper API   │
                              │  - YouTube DL    │
                              └──────────────────┘
```

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite, TailwindCSS | SPA UI |
| State | React Query, Zustand | Server + client state |
| Backend | FastAPI, Python 3.12 | REST API |
| AI | Anthropic Claude API | Content generation |
| Transcription | AssemblyAI / Whisper | Audio/video → text |
| Task Queue | Celery + Redis | Async job processing |
| Database | PostgreSQL 16 | Primary data store |
| Cache | Redis 7 | Cache + queue |
| Auth | JWT + bcrypt | Authentication |
| Payments | Stripe | Subscription billing |
| Containerization | Docker + Docker Compose | Deployment |
| Reverse Proxy | Nginx | Routing + SSL |

## 💡 Platform Output Targets

1. **Blog Post** — Long-form SEO article with H1/H2/H3
2. **Twitter/X Thread** — Hook + 10-tweet thread
3. **LinkedIn Post** — Professional thought leadership
4. **Instagram Caption** — Short + hashtags
5. **YouTube Description** — Timestamps + keywords
6. **Newsletter** — Email-ready HTML section
7. **TikTok Script** — Hook + punchy script
8. **Reddit Post** — Community-adapted format
9. **Podcast Show Notes** — Summary + chapters
10. **Short-form Reel Script** — 30-60 second script

## 💰 Pricing Tiers

| Plan | Price | Credits/mo | Features |
|------|-------|-----------|---------|
| Free | $0 | 3 | 3 outputs per repurpose |
| Starter | $19/mo | 30 | All 10 platforms |
| Pro | $49/mo | 100 | Custom tone, SEO, priority |
| Agency | $149/mo | Unlimited | Team seats, white-label |

---

## 🚀 Quick Start

### Prerequisites
- Docker 24+ & Docker Compose v2
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)
- Anthropic API key
- Stripe account (for payments)
- AssemblyAI API key (for transcription)

### 1. Clone & Configure
```bash
git clone https://github.com/yourname/repurpose-ai.git
cd repurpose-ai
cp .env.example .env
# Edit .env with your API keys
```

### 2. Launch with Docker
```bash
docker compose up --build
```

### 3. Run Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 4. Access
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Admin: http://localhost:8000/admin

---

## 📁 Project Structure

```
repurpose-ai/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Helpers & API client
│   │   └── types/         # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Config, security, DB
│   │   ├── services/      # Business logic
│   │   ├── models/        # SQLAlchemy models
│   │   └── schemas/       # Pydantic schemas
│   ├── alembic/           # DB migrations
│   ├── Dockerfile
│   └── requirements.txt
├── nginx/                  # Reverse proxy config
├── docker-compose.yml
├── .env.example
└── README.md
```
