# BookEase 📅

A Booksy-style appointment booking platform built as a DevOps portfolio project.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React + Nginx (Docker) |
| API Gateway | Nginx reverse proxy |
| Auth Service | Python FastAPI + JWT |
| Booking Service | Python FastAPI + PostgreSQL |
| Notification Service | Python + Redis queue + SMTP |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 |
| CI/CD | GitHub Actions |
| Infrastructure | Terraform (AWS) |
| Monitoring | Prometheus + Grafana |

## Quick start (local dev)

### Prerequisites
- Docker Desktop installed and running
- Git

### 1. Clone & configure
```bash
git clone https://github.com/YOUR_USERNAME/bookease.git
cd bookease
cp .env.example .env
# Edit .env with your values (JWT secret, SMTP credentials)
```

### 2. Start everything
```bash
docker compose up --build
```

### 3. Open in browser
| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Auth API docs | http://localhost:8001/docs |
| Booking API docs | http://localhost:8002/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

## Running tests locally

```bash
# Booking service tests
cd backend/booking_service
pip install -r requirements.txt
pytest tests/ -v

# Auth service tests
cd backend/auth_service
pip install -r requirements.txt
pytest tests/ -v
```

## CI/CD Pipeline

Every push to `main` automatically:
1. Runs all tests (Python + React)
2. Builds Docker images and pushes to GitHub Container Registry
3. Deploys to your server via SSH

See `.github/workflows/ci-cd.yml` for the full pipeline config.

### Required GitHub Secrets
Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `JWT_SECRET` | Random string (use `openssl rand -hex 32`) |
| `DEPLOY_HOST` | Your server's IP address |
| `DEPLOY_USER` | SSH username (usually `ubuntu`) |
| `DEPLOY_SSH_KEY` | Your private SSH key |
| `SMTP_USER` | SMTP username (use Mailtrap for testing) |
| `SMTP_PASS` | SMTP password |

## Deploy to AWS

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

The output will print your server's public IP. It takes ~2 minutes for Docker to start on the instance.

## API Reference

### Auth endpoints
```
POST /auth/register   Register a new user
POST /auth/login      Login and receive JWT token
GET  /auth/verify     Verify a JWT token
```

### Booking endpoints
```
GET  /bookings                    List all bookings
GET  /bookings/{id}               Get a booking
POST /bookings                    Create a booking
PATCH /bookings/{id}/cancel       Cancel a booking
GET  /availability?business_id=1&date=2025-06-01   Check available slots
```

## Project structure
```
bookease/
├── .github/workflows/ci-cd.yml   # CI/CD pipeline
├── docker-compose.yml            # Local orchestration
├── frontend/                     # React app
├── backend/
│   ├── auth_service/             # JWT auth (port 8001)
│   ├── booking_service/          # Appointments (port 8002)
│   └── notification_service/     # Email queue (port 8003)
├── infra/
│   ├── nginx.conf                # API gateway config
│   ├── init.sql                  # DB schema
│   └── terraform/                # AWS infrastructure as code
└── monitoring/
    └── prometheus.yml            # Metrics scraping config
```

## What this demonstrates (for your resume)

- **Microservices architecture** — 3 independent Python services with clear boundaries
- **Containerisation** — every service has a production-ready Dockerfile with multi-stage builds
- **Container orchestration** — Docker Compose coordinates 8 services with health checks and dependency ordering
- **CI/CD** — GitHub Actions pipeline: test → build → push → deploy on every commit
- **Infrastructure as Code** — Terraform provisions VPC, subnets, security groups, EC2 in ~2 minutes
- **Observability** — Prometheus scrapes metrics from all services; Grafana dashboard visualises them
- **Async messaging** — Redis queue decouples booking events from email delivery
- **API design** — RESTful endpoints with proper status codes, conflict detection, validation
