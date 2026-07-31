# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack F1 race analytics dashboard. Flask backend powered by FastF1 serves race data; React frontend is a single "Race Center" page (Overview / Timing / Strategy / Telemetry tabs).

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

### Frontend (Vite + React, single page)
Fully bundled SPA — no router, no other pages. `frontend/` is the Vite root. Entry: `main.jsx` → `App.jsx` → `pages/LiveRace.jsx`. Dependencies are plain `react`/`react-dom` only — Three.js, chart.js, and react-router-dom were all removed along with the pages/components that used them (see below).

**Key files:**
- `frontend/App.jsx` — renders `<LiveRace />` directly, nothing else
- `frontend/pages/LiveRace.jsx` — the entire app: page-level state (active tab, selected driver, session clock) and composition of the sections below
- `frontend/pages/live-race/mockData.js` — placeholder driver/pit-stop data plus `genTrace`/`toPolyline`/`fmtClock` helpers
- `frontend/pages/live-race/useRaceCenterData.js` — derives display-ready driver rows, selected-driver telemetry traces, and strategy bar geometry
- `frontend/pages/live-race/{TopBar,TabNav,OverviewTab,TimingTab,StrategyTab,TelemetryTab}.jsx` — one component per section; each tab is plain HTML/SVG with inline styles (no Canvas, no Three.js)

**All data is currently placeholder/generated, not wired to the backend yet.** Next step: wire `useRaceCenterData` to real `/api` endpoints (standings, session, telemetry, pitstops) in place of `mockData.js`.

**Removed (no longer part of the app):** the Dashboard/Standings/Teams pages, `TopNav`/`Sidebar` navigation, `Background3D`/`Hero3D` (Three.js decorative backgrounds), `Charts.jsx` (chart.js wrapper), and the pre-Vite legacy HTML files (`live.html`, `standings.html`, `teams.html`, `debug.html`, `test.html`). The backend's other endpoints (`/api/races`, `/api/standings`, `/api/teams`, etc.) still exist and work — they just have no frontend consumer at the moment.

### Design System
- Colors: `#faf9f6` background, `#191b1e` text, oklch-based accents (blue ~230 hue, green ~155 hue, red ~25 hue, purple ~300 hue); tire compound colors S/M/H = `#c23b3b`/`#d9a300`/`#6b6862`
- Fonts: Inter (UI text), JetBrains Mono (session clock, timing figures) — loaded dynamically only while the page is mounted (see `useRaceCenterFonts` in `LiveRace.jsx`)
- All corner radii (buttons, badges, tiles, chart panels) are a consistent `10px`

### Key Gotchas
- **FastF1 first load**: The first time a session loads, FastF1 fetches from the F1 data API — can take 30–60 seconds. Subsequent loads read from `backend/cache/`.
- **Track coordinates**: `/api/track` returns FastF1 GPS-derived `{x, y}` coordinates in meters (values can reach ±5000) — relevant if/when the Overview tab's track map is wired to real data instead of the mockup's fixed SVG path.
