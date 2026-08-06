# Diya (formerly Wajha Scarves) — System Architecture Overview

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, React Router DOM v6
- **Backend**: Python 3.13, Flask, SQLAlchemy, Alembic (Flask-Migrate), Flask-Limiter
- **Database**: Neon Postgres (production) / SQLite `app.db` (local fallback)

## Directory Structure
- `app/` — Application shell, router setup, and top-level provider orchestration.
- `features/` — Isolated domain feature modules (`products`, `cart`, `categories`, `auth`, `admin`, `landing`, `vouchers`, `loyalty`).
- `shared/` — Common components, utilities, and API wrappers.
- `api/` — Flask backend application logic (`api/core` for shared infrastructure & models; `api/features` for feature controllers & services).
- `migrations/` — Database schema migrations managed by Alembic / Flask-Migrate.

## Core Architectural Boundaries
1. **Feature Independence**: Features inside `features/` (client) or `api/features/` (server) must not import directly from sibling feature internals.
2. **Centralized Models**: All SQLAlchemy database models reside in `api/core/models.py` to prevent circular dependencies.
3. **Admin Exemption**: The `admin` feature is permitted to orchestrate services from other features.
