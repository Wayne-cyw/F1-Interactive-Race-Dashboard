# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack F1 race analytics dashboard. Flask backend powered by FastF1 serves race data; React frontend visualizes it across 4 pages (Race Analysis, Standings, Teams, Live Race).

## Commands

**Backend:**
```bash
# Activate venv first (Python 3.11)
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start Flask API (runs on http://localhost:5000)
python3 backend/app.py
```

**Frontend:**
```bash
npm install
npm run dev      # Vite dev server → http://localhost:3000 (proxies /api to Flask)
npm run build    # Static output → dist/
npm run lint
```

## Development Workflow

- **Branching**: Before starting any feature or change, create a new branch off `main`. Name it `{type}/{content}`, where `{content}` is a short kebab-case description of the work and `{type}` is one of:
  - `feature` — new functionality or behavior changes (e.g. `feature/live-race-alerts`)
  - `restructure` — architecture/refactor work with no intended behavior change (e.g. `restructure/backend-clean-architecture`)
  - `fix` — bug fixes (e.g. `fix/standings-cache-stale-year`)
  - `chore` — tooling, deps, docs, config (e.g. `chore/update-eslint-config`)
- **Committing**: Break work into sub-tasks. Commit and push after each sub-task is finished — don't batch unrelated changes into one commit, and don't leave finished sub-tasks unpushed. Keep commit messages concise (a single summary line is usually enough); do not add a Co-Authored-By trailer.
- **Pull requests**: When the overall feature/change is complete, open a PR on GitHub targeting `main`. Do not merge it — the user reviews and merges PRs themselves.

## Architecture

### Backend (`backend/app.py`)
Single Flask file. Uses **FastF1** (Python library) to load F1 session data and caches sessions with both `fastf1.Cache` (disk, at `backend/cache/`) and `@lru_cache` (in-memory, up to 200 sessions). First load of a session is slow (FastF1 downloads from the F1 data API); subsequent loads are near-instant from cache.

All API responses include gzip compression via `flask-compress`. CORS is enabled globally.

API base URL: `http://localhost:5000/api` (or `/api` after Vite proxy is configured)

Key endpoints:
| Endpoint | Returns |
|---|---|
| `GET /api/seasons` | Available years (2018–current) |
| `GET /api/races/<year>` | Race schedule for a season |
| `GET /api/session/<year>/<round>/<type>` | Full session data (laps, results, pit stops) |
| `GET /api/session-types/<year>/<round>` | Which sessions exist (R/Q/S/FP1-3) |
| `GET /api/telemetry/<year>/<round>/<type>/<driver>` | Speed, throttle, distance arrays |
| `GET /api/track/<year>/<race>` | Track outline as `{x, y}` coordinate array |
| `GET /api/standings/<year>` | Driver + constructor championship tables |
| `GET /api/teams/<year>` | Team rosters with driver codes |
| `GET /api/weather/<year>/<race>` | Air temp, track temp, humidity, rainfall |
| `GET /api/pitstops/<year>/<race>` | Pit stop history |

### Frontend (Vite + Three.js)
Fully bundled SPA. `frontend/` is the Vite root. Entry: `main.jsx` → `App.jsx` → React Router.

**Key files:**
- `frontend/App.jsx` — Router shell. `Background3D` always mounts on every route (including `/live`)
- `frontend/three/` — `Background3D.jsx` (persistent star field + floating ember particles across all pages) and `Hero3D.jsx` (decorative 3D strip on Dashboard/Standings/Teams). The live-race-specific components (`Track3DCanvas`, `Track3D`, `Cars3D`, `CameraController`, `TrackContext`) were removed when `/live` was redesigned — see Race Center below.
- `frontend/utils/helpers.js` — ES module exports; `API_URL = '/api'` (Vite dev proxy routes to Flask)

### Live Race → Race Center (`frontend/pages/LiveRace.jsx`)
`/live` is a 2D, tab-based "Race Center" (Overview / Timing / Strategy / Telemetry), not a 3D visualization — the old Three.js live-race view was replaced entirely. Layout and interaction were ported from a design mockup; **all data is currently placeholder/generated** (`frontend/pages/live-race/mockData.js`), not wired to the backend yet.

- `frontend/pages/live-race/mockData.js` — placeholder driver/pit-stop data plus `genTrace`/`toPolyline`/`fmtClock` helpers
- `frontend/pages/live-race/useRaceCenterData.js` — derives display-ready driver rows, selected-driver telemetry traces, and strategy bar geometry
- `frontend/pages/live-race/{TopBar,TabNav,OverviewTab,TimingTab,StrategyTab,TelemetryTab}.jsx` — one component per section; each tab is plain HTML/SVG with inline styles (no Canvas, no Three.js)
- The page uses its own light theme (`#faf9f6` background, oklch accent colors, Inter + JetBrains Mono fonts loaded only while this page is mounted) — deliberately scoped to this page only; the rest of the app keeps its existing dark theme
- Next step (not yet done): wire `useRaceCenterData` to real `/api` endpoints (standings, session, telemetry, pitstops) in place of `mockData.js`

### Design System
- Colors: `#000000` base, `#DC0000` red, `#FFBA08` yellow, `#FF6600` orange
- Fonts: Orbitron (headers), Rajdhani (body) — loaded via Google Fonts CDN
- Theme: Black/red F1 aesthetic; target adds glassmorphism (`.glass-panel` with `backdrop-filter: blur(12px)`) over the Three.js background canvas

### Key Gotchas
- **R3F version**: `@react-three/fiber` 9.5.0 is installed, which requires React `>=19 <19.3`. Currently on React 19.2.0 — compatible.
- **FastF1 first load**: The first time a session loads, FastF1 fetches from the F1 data API — can take 30–60 seconds. Subsequent loads read from `backend/cache/`.
- **Track coordinates**: `/api/track` returns FastF1 GPS-derived `{x, y}` coordinates in meters (values can reach ±5000). Must normalize to scene space before passing to `TubeGeometry`.
- **WebGL contexts**: Only one `<Canvas>` element exists — `Background3D`, mounted on every route. Never create per-chart WebGL canvases.
