# Repository Guidelines

## Project Structure & Module Organization
- backend/: Flask service. Entry at backend/run.py; blueprints live in app/api/v1, config and DB wiring in app/core, models in app/models, schemas in app/schemas, business logic in app/services, helpers in app/utils. Database and recipe utilities sit in backend/scripts.
- frontend/: React + TypeScript via Vite. Pages in src/pages, shared UI in src/components, API clients in src/api, state in src/stores, shared contracts in src/types, styles in src/styles, assets in src/assets and public/.
- Env: copy backend/.env.example to .env for MySQL/Redis/secret keys; front end reads Vite defaults (dev server 5173).

## Build, Test, and Development Commands
- cd backend && pip install -r requirements.txt - install Flask, SQLAlchemy, pytest.
- cd backend && python scripts/setup_database.py - initialize or reset schema/data.
- cd backend && python run.py - start API on :8000 with debug reload.
- cd frontend && npm install - install UI dependencies.
- cd frontend && npm run dev - Vite dev server (defaults 5173) for local work.
- cd frontend && npm run build - type-check then build production bundle.
- cd frontend && npm run lint - ESLint (React hooks + TS) consistency check.

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indent, snake_case for functions/vars, PascalCase for SQLAlchemy models. Keep routing in api/v1, business logic in services, DB access through core/database helpers.
- TypeScript/React: follow ESLint config; functional components with hooks; PascalCase components, camelCase props/state; co-locate shared styles under src/styles; keep axios wrappers in src/api and reusable types in src/types.

## Testing Guidelines
- Backend: pytest available; place new tests under backend/tests/ mirroring app/ modules; use Flask test client for blueprints and seed data via scripts/setup_database.py; run with cd backend && python -m pytest.
- Frontend: no harness committed; add Vitest/RTL when needed. Lint before push and cover stores/hooks plus page-level flows when added.
- Target coverage for new game flow logic, DB migrations, and pricing/round calculations.

## Commit & Pull Request Guidelines
- Commits: short, present tense. Prefer <type>: <summary> when scoped (feat: add market actions, fix: adjust round submission timing). Group related schema/data changes with code.
- PRs: include overview, testing commands run, rollout/migration steps (DB scripts to apply), and UI screenshots/GIFs when user-facing. Link related issues/requirements and ensure lint/build/tests pass before review.

## Security & Configuration Tips
- Never commit real credentials; keep .env local and refresh .env.example when variables change.
- Run database scripts in backend/scripts on a copy before production; back up data before recipe updates or schema tweaks.
