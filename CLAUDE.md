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
- **Committing**: Break work into sub-tasks. Commit and push after each sub-task is finished — don't batch unrelated changes into one commit, and don't leave finished sub-tasks unpushed.
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
- `frontend/App.jsx` — Router shell. `Background3D` always mounts except on `/live` (which has its own Canvas)
- `frontend/three/` — All Three.js / `@react-three/fiber` components:
  - `Background3D.jsx` — persistent star field + floating ember particles across all pages
  - `Track3DCanvas.jsx` — Canvas wrapper for the live race (contains Bloom + Vignette post-processing)
  - `Track3D.jsx` — builds `CatmullRomCurve3` from API coordinates, renders `TubeGeometry` track, 8 spotlights, provides `TrackContext`
  - `Cars3D.jsx` — 20 emissive car meshes; positions mutated directly in `useFrame` via mesh refs (no React state — maintains 60fps)
  - `CameraController.jsx` — Overview (`OrbitControls`), Follow (lerp behind selected car), Cinematic (auto-cycle 5 predefined angles)
  - `TrackContext.js` — React context exposing the `CatmullRomCurve3` to children of `Track3D`
- `frontend/components/live/` — Individual panel components (AlertsBox, LiveStandings, PitStopTracker, WeatherWidget, TrackStatus)
- `frontend/utils/helpers.js` — ES module exports; `API_URL = '/api'` (Vite dev proxy routes to Flask)

### Live Race Animation Engine
The core animation in `frontend/pages/live.js` (migrating to `LiveRace.jsx`) uses `requestAnimationFrame` to simulate lap-by-lap progression at 0.6 laps/second. Car track position is computed as:

```js
t = ((currentLap - 1 + progress) / totalLaps + (racePosition - 1) * 0.015) % 1
```

Where `t ∈ [0,1]` is the parameter along the track curve. In the 3D version, `trackCurve.getPoint(t)` returns the `Vector3` position and `trackCurve.getTangent(t)` orients the car mesh. Car mesh refs are mutated directly in `useFrame` — never via React state — to maintain 60fps.

### Design System
- Colors: `#000000` base, `#DC0000` red, `#FFBA08` yellow, `#FF6600` orange
- Fonts: Orbitron (headers), Rajdhani (body) — loaded via Google Fonts CDN
- Theme: Black/red F1 aesthetic; target adds glassmorphism (`.glass-panel` with `backdrop-filter: blur(12px)`) over the Three.js background canvas

### Key Gotchas
- **R3F version**: `@react-three/fiber` 9.5.0 is installed, which requires React `>=19 <19.3`. Currently on React 19.2.0 — compatible.
- **FastF1 first load**: The first time a session loads, FastF1 fetches from the F1 data API — can take 30–60 seconds. Subsequent loads read from `backend/cache/`.
- **Track coordinates**: `/api/track` returns FastF1 GPS-derived `{x, y}` coordinates in meters (values can reach ±5000). Must normalize to scene space before passing to `TubeGeometry`.
- **WebGL contexts**: Only two `<Canvas>` elements exist simultaneously — `Background3D` (hidden on `/live`) and `Track3DCanvas` (only on `/live`). Never create per-chart WebGL canvases.
