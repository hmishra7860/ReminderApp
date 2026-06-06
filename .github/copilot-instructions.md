Purpose
=======

This file gives focused, codebase-specific instructions for an AI coding agent working on ReminderCal. It highlights architecture, important patterns, run/debug notes, and actionable edit examples so you can be productive immediately.

**Architecture Overview**
- **Backend**: FastAPI app defined in [backend/main.py](backend/main.py#L1-L40). Async SQLAlchemy + Pydantic are used for models and responses. Metrics are enabled via `Instrumentator().instrument(app).expose(app)`.
- **Database**: Async engine and session factory live in [backend/database/db.py](backend/database/db.py#L1-L40). The default `DATABASE_URL` targets a Postgres service in compose.
- **Scheduler**: APScheduler-based background checks are implemented in [backend/services/scheduler.py](backend/services/scheduler.py#L1-L120). Note: the scheduler is defined but not started by default — it must be invoked (see "Enable scheduler" below).
- **Email**: SMTP helper functions and templates are in [backend/services/email_service.py](backend/services/email_service.py#L1-L120). Configured via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` environment variables.
- **Frontend**: Static UI and JS client live in `frontEnd/`. The API client is at [frontEnd/js/api.js](frontEnd/js/api.js#L1-L60) — it chooses `API_BASE` based on `window.location.hostname` and falls back to `localStorage` when the backend is unavailable.
- **Observability & infra**: `docker-compose.yml` wires up Postgres, backend, frontend, Prometheus, Grafana and exporters.

**Run & Debug Notes (practical)**
- Quick backend dev: from the `backend` directory run `uvicorn main:app --reload --host 0.0.0.0 --port 8000` to start the FastAPI app used by the frontend during development.
- Docker: run `docker-compose up --build` at repository root to bring up the stack. Important caveats below before using compose.
- Health check: the app exposes a health route (used by compose) at `/health` and exposes metrics via Instrumentator (check `/metrics`).

Project-specific caveats (must-read)
- Dockerfile / folder mismatch: the repository's `backend/Dockerfile` contains an nginx/static image and `frontEnd/Dockerfile` contains a Python/uvicorn build — they appear swapped. Also `docker-compose.yml` references `./frontend` (lowercase) while the repo folder is `frontEnd` (capital E). Verify and correct these before relying on `docker-compose`.
- Scheduler is not auto-started: the scheduler is implemented but not registered with the app lifecycle. To enable scheduled jobs, add a `start_scheduler()` call from `backend/services/scheduler.py` inside the app `lifespan` or a startup event in [backend/main.py](backend/main.py#L1-L40).
- Emails are guarded: `email_service._send()` returns early if `SMTP_USER`/`SMTP_PASS` are not set. Tests or local dev can mock `send_*` helpers or set SMTP vars.

Key patterns & conventions
- Async DB sessions: use `AsyncSessionLocal` + dependency `get_db()` in [backend/database/db.py](backend/database/db.py#L1-L80). Handlers accept `db: AsyncSession = Depends(get_db)`.
- Pydantic responses: response models use `model_config = {"from_attributes": True}` so route handlers commonly return ORM objects directly (see [backend/models/schemas.py](backend/models/schemas.py#L1-L120)).
- Notification logging: sent emails are recorded in `NotificationLog` (`backend/models/models.py`) — preferred place to persist email outcomes.
- Frontend fallback: The JS client (`frontEnd/js/api.js`) attempts the backend then uses `localStorage` as a fallback. Keep this in mind when modifying API surface — the UI tolerates missing backend responses.

Actionable edit examples
- Start scheduler on app startup: in `backend/main.py` add `from services.scheduler import start_scheduler` and call `start_scheduler()` inside `lifespan` (after DB init).
- Add per-user email: scheduler currently has `# TODO: get user email from authenticated session` in [backend/services/scheduler.py](backend/services/scheduler.py#L1-L120). Implement user/email lookups and write `NotificationLog` entries.
- Fix compose Docker paths: update `docker-compose.yml` to reference `./frontEnd` (or rename folder to `frontend`) and verify the Dockerfiles are in the expected service contexts.

Files to inspect first (quick links)
- [backend/main.py](backend/main.py#L1-L40)
- [backend/database/db.py](backend/database/db.py#L1-L80)
- [backend/services/scheduler.py](backend/services/scheduler.py#L1-L120)
- [backend/services/email_service.py](backend/services/email_service.py#L1-L120)
- [backend/models/models.py](backend/models/models.py#L1-L140)
- [frontEnd/js/api.js](frontEnd/js/api.js#L1-L80)
- [docker-compose.yml](docker-compose.yml#L1-L200)

When you're unsure
- Prefer small, reversible changes. Run the backend locally with `uvicorn` and use the frontend's localStorage fallback to validate UI behavior without rebuilding images.
- For infra changes (compose, Dockerfiles), ask before applying large refactors — this repo has non-obvious naming and Dockerfile swaps that affect CI and deployment.

Next steps
- I added these instructions based on the repo snapshot. Tell me if you want me to (a) insert the `start_scheduler()` call in `backend/main.py`, (b) fix docker-compose / Dockerfile mismatches, or (c) add small runnable dev scripts (`Makefile` or `scripts/`) to simplify local runs.
