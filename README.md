# 🔔 ReminderCal

A full-stack reminder and birthday notification platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Python FastAPI (async) |
| Database | PostgreSQL 16 |
| Reverse Proxy | Nginx |
| Containers | Docker + Docker Compose |
| CI/CD | GitLab CI/CD |
| Monitoring | Prometheus + Grafana + Node Exporter + cAdvisor |
| Alerting | Alertmanager |

---

## Project Structure

```
remindercal/
├── frontEnd/
│   ├── css/
│   │   ├── main.css
│   │   ├── navbar.css
│   │   ├── sidebar.css
│   │   ├── calendar.css
│   │   └── modal.css
│   ├── js/
│   │   ├── api.js          ← API client + token interceptor
│   │   ├── calendar.js     ← Calendar rendering & navigation
│   │   ├── reminders.js    ← Reminder CRUD + UI
│   │   ├── birthdays.js    ← Birthday CRUD + UI
│   │   └── app.js          ← Navigation, modals, init
│   ├── Dockerfile
│   └── index.html
│
├── backend/
│   ├── database/
│   │   └── db.py           ← SQLAlchemy async engine + session
│   ├── models/
│   │   ├── models.py       ← ORM models (User, Reminder, Birthday, NotificationLog)
│   │   └── schemas.py      ← Pydantic validation schemas
│   ├── routes/
│   │   ├── auth.py         ← JWT authentication & SMTP user settings
│   │   ├── reminders.py    ← CRUD endpoints
│   │   ├── birthdays.py    ← CRUD endpoints
│   │   └── health.py       ← /health checks
│   ├── services/
│   │   ├── email_service.py  ← SMTP email dispatcher
│   │   └── scheduler.py      ← APScheduler automated jobs
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── k8s/                      ← Modular Kubernetes Manifests
│   ├── database.yaml       ← PostgreSQL Deployment, PVC, & Service
│   ├── backend.yaml        ← FastAPI Backend Deployment, InitContainer, & Service
│   ├── frontend.yaml       ← Nginx Frontend Deployment, ConfigMap, & NodePort
│   └── monitoring.yaml     ← Prometheus, Grafana, Node Exporter, Alertmanager
│
├── nginx/
│   └── default.conf        ← Local Docker Compose reverse proxy config
├── monitoring/             ← Prom/Grafana provisioning assets
├── Jenkinsfile             ← Production Jenkins Multi-Agent CI/CD Pipeline
├── docker-compose.yml      ← Local full-stack development compose file
├── .env.example            ← Environment variable template
└── README.md
```

---

## Quick Start

### 1. Clone & configure

```bash
git clone <your-repo-url> remindercal
cd remindercal
cp .env.example .env
# Edit .env with your SMTP credentials
```

### 2. Start the full stack

```bash
docker compose up -d
```

### 3. Access services

| Service | URL |
|---------|-----|
| App | http://localhost |
| API Docs | http://localhost/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin / admin123) |
| Alertmanager | http://localhost:9093 |

---

## API Endpoints

### Reminders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/reminders` | Create a reminder |
| `GET` | `/reminders` | List all reminders |
| `GET` | `/reminders/{id}` | Get one reminder |
| `PUT` | `/reminders/{id}` | Update a reminder |
| `DELETE` | `/reminders/{id}` | Delete a reminder |

### Birthdays

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/birthdays` | Add a birthday |
| `GET` | `/birthdays` | List all birthdays |
| `DELETE` | `/birthdays/{id}` | Remove a birthday |

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |

---

## Reminder Categories

- **Work** — Blue
- **Personal** — Purple
- **Birthday** — Pink
- **Finance** — Amber
- **Health** — Green

---

## Email Notifications

Configure SMTP in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password   # Use Gmail App Password
FROM_EMAIL=you@gmail.com
```

The scheduler sends:
- **08:00 daily** — Reminder emails for reminders due today
- **09:00 daily** — Birthday wishes for today's birthdays

---

## Monitoring

### Grafana Dashboards (import by ID)

| Dashboard | Grafana ID |
|-----------|-----------|
| Node Exporter Full | 1860 |
| Docker Containers | 893 |
| FastAPI Observability | 16110 |

### Alert Rules

| Alert | Condition |
|-------|-----------|
| BackendDown | Backend unreachable for 1 min |
| HighCPUUsage | CPU > 80% for 5 min |
| HighMemoryUsage | Memory > 80% for 5 min |
| HighDiskUsage | Disk > 90% for 5 min |
| SlowAPIResponse | p95 latency > 2s for 5 min |

---

## CI/CD (GitLab)

Pipeline stages:
1. **lint** — `ruff` linting on backend
2. **test** — `pytest` against a test Postgres service
3. **build** — Docker build + push to GitLab Registry
4. **deploy** — SSH deploy to production (manual gate)

Required GitLab CI variables:
- `SSH_PRIVATE_KEY` — Deploy server SSH key
- `DEPLOY_HOST` — Server IP/hostname
- `DEPLOY_USER` — SSH username
- `CI_REGISTRY_*` — Auto-provided by GitLab

---

## Database Schema

```sql
reminders (id, title, description, category, date, time, created_at)
birthdays (id, name, email, date_of_birth, created_at)
notification_logs (id, reminder_id, birthday_id, email, sent_at, status, message)
```

Tables are auto-created on backend startup via SQLAlchemy.

---

## Development (without Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://rcal:rcalpass@localhost:5432/remindercal uvicorn main:app --reload

# Frontend — just open in browser
open frontend/index.html
```

The frontend uses `localStorage` as a fallback when the backend is unavailable, so it works standalone too.
