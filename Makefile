.PHONY: up down build logs shell-backend shell-db migrate test lint

# ── Docker ───────────────────────────────────────────────────
up:
	docker compose up -d

up-build:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose restart backend celery_worker

logs:
	docker compose logs -f backend celery_worker

logs-all:
	docker compose logs -f

build:
	docker compose build

# ── Database ─────────────────────────────────────────────────
migrate:
	docker compose exec backend alembic upgrade head

migrate-create:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

migrate-down:
	docker compose exec backend alembic downgrade -1

# ── Shells ───────────────────────────────────────────────────
shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U repurposeai -d repurposeai

shell-redis:
	docker compose exec redis redis-cli

# ── Dev ──────────────────────────────────────────────────────
dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-worker:
	cd backend && celery -A app.core.celery_app worker --loglevel=debug

install-frontend:
	cd frontend && npm install

# ── Quality ──────────────────────────────────────────────────
test:
	docker compose exec backend pytest -v

lint-backend:
	cd backend && ruff check app/

lint-frontend:
	cd frontend && npm run lint

# ── Production ───────────────────────────────────────────────
prod-up:
	APP_ENV=production docker compose up -d

ssl-init:
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=CA/L=SF/O=RepurposeAI/CN=localhost"
