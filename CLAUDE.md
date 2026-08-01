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
python3 backend/run.py

# Run backend tests
cd backend && python -m pytest -q
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

### Backend (`backend/`)
Clean Architecture layering — see `docs/superpowers/specs/2026-07-31-backend-clean-architecture-design.md` for the full design rationale:
- `entities/` — plain dataclasses (Driver, Session, Standing, Team, Weather, PitStop, Track, RaceEvent) + domain errors. No external dependencies.
- `use_cases/` — one class per operation (`GetStandingsUseCase`, `GetTelemetryUseCase`, ...), depends only on entities and gateway interfaces.
- `interface_adapters/` — `gateways/` (repository interface ABCs), `controllers/` (one per use case, thin), `presenters/` (entity → JSON shape, including team color lookup).
- `frameworks_drivers/` — `web/app.py` (Flask app factory + DI wiring + error handlers), `fastf1_gateway/` (the only place `fastf1` is imported; implements all repository interfaces; caches loaded sessions via `@lru_cache(maxsize=200)` plus `fastf1.Cache` disk cache at `backend/cache/`), `logging_config.py`.
- `run.py` — entry point (`python3 backend/run.py`).
- `tests/unit/` — use cases tested against hand-written fakes, no FastF1/Flask involved. `tests/integration/` — Flask test client against the real app factory with fake repositories injected via `create_app(...)` overrides.

All API responses include gzip compression via `flask-compress`. CORS is enabled globally. HTTP contract (routes, JSON shapes, status codes) is unchanged from the pre-restructure monolith.

**Frontend endpoint usage (checked after connecting Race Center to the backend, 2026-08-01):** the Race Center (`frontend/pages/LiveRace.jsx` and everything under `frontend/pages/live-race/`) now actively calls `/api/seasons`, `/api/races/<year>`, `/api/session/<year>/<round>/R`, `/api/pitstops/<year>/<round>`, `/api/weather/<year>/<round>`, `/api/track/<year>/<round>`, `/api/positions/<year>/<round>`, and `/api/telemetry/<year>/<round>/R/<driver>` — all via `useRaceReplay.js` and `useDriverTelemetry.js`. `/api/session-types`, `/api/standings`, `/api/teams`, and `/api/drivers` currently have no frontend consumer (Race Center always requests session type `R`, and has no standings/teams/roster views).

API base URL: `http://localhost:5000/api` (or `/api` after Vite proxy is configured)

Key endpoints:
| Endpoint | Returns |
|---|---|
| `GET /api/seasons` | Available years (2018–current) |
| `GET /api/races/<year>` | Race schedule for a season |
| `GET /api/session/<year>/<round>/<type>` | Full session data (laps, results, pit stops) |
| `GET /api/session-types/<year>/<round>` | Which sessions exist (R/Q/S/FP1-3) |
| `GET /api/telemetry/<year>/<round>/<type>/<driver>` | Full-session speed/throttle/brake/gear/rpm/DRS points, each with `t` (seconds since green flag) |
| `GET /api/positions/<year>/<round>` | Per-driver `{t, x, y}` GPS position timeline, 2Hz, relative to green flag |
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
- `frontend/pages/live-race/useRaceReplay.js` — season/race selection, session bundle fetching (`/session`, `/pitstops`, `/weather`, `/track`, `/positions`), and real-time playback state (`elapsedSeconds`, `totalDurationSeconds`, `isPlaying`, `play`/`pause`/`seekToLap`); a `clockEpoch` counter forces the animation-loop effect to restart on every external write to `elapsedSeconds` (race switch, seek, restart-from-end), since `isPlaying`/`totalDurationSeconds` alone don't reliably change on those events
- `frontend/pages/live-race/useDriverTelemetry.js` — fetches the selected driver's raw full-session telemetry points from `/api/telemetry` once per driver selection (no derivation — see `telemetrySlice.js`)
- `frontend/pages/live-race/telemetrySlice.js` — `sliceTelemetry` derives what the UI needs at the current `elapsedSeconds` from those raw points: whole-race-so-far stats (top/avg speed, DRS activation count) and a current-lap-so-far polyline trace
- `frontend/pages/live-race/leaderboardData.js` — derives display-ready driver rows from real session/pitstop data, scoped to laps completed so far
- `frontend/pages/live-race/stints.js` — tire stint + pit log derivation from pit stops and lap compounds
- `frontend/pages/live-race/raceClock.js` — `deriveCurrentLap`/`deriveLapStartTime` bridge the real-time `elapsedSeconds` clock to the lap-based leaderboard/strategy pipeline and to per-driver lap-scoped telemetry slicing
- `frontend/pages/live-race/trackMap.js` — normalizes `/api/track` GPS coordinates into scene-space SVG path data; also exposes `toSvgPoint` (reused to place live car positions in the same SVG space) and `interpolatePosition` (binary-search + linear interpolation over a driver's real `/api/positions` GPS samples to get their position at any `t`)
- `frontend/utils/api.js` — shared `fetchJSON` wrapper (base URL, error handling)
- `frontend/pages/live-race/{TopBar,TabNav,OverviewTab,TimingTab,StrategyTab,TelemetryTab}.jsx` — one component per section; each tab is plain HTML/SVG with inline styles (no Canvas, no Three.js)
- `frontend/pages/live-race/Leaderboard.jsx` — used by OverviewTab; below `COMPACT_WIDTH_THRESHOLD` (380px) it drops the position, last-lap, and tire+age columns, showing only driver name + gap. Driven by the same width state as its resize handle, so it responds live while dragging.
- `frontend/pages/live-race/useResizableWidth.js` / `useResizableHeight.js` + `ResizeHandle.jsx` (`orientation="vertical"|"horizontal"`) — shared drag-to-resize primitives. Overview (leaderboard + telemetry columns, plus the Sector Deltas panel's height), Strategy (pit log column), and Telemetry (driver list column) all use them; resize state is local to each tab and resets when you navigate away and back (tabs unmount on switch). Timing has no resizable panels.

The Race Center now replays real historical race data via `useRaceReplay` as a real-time, second-by-second playback (1 played second = 1 real race second) — car positions come from real GPS telemetry (`/api/positions`), not a schematic approximation, and the selected driver's telemetry panel updates continuously. Still not true live data, since FastF1 only serves completed sessions.

**Removed (no longer part of the app):** the Dashboard/Standings/Teams pages, `TopNav`/`Sidebar` navigation, `Background3D`/`Hero3D` (Three.js decorative backgrounds), `Charts.jsx` (chart.js wrapper), and the pre-Vite legacy HTML files (`live.html`, `standings.html`, `teams.html`, `debug.html`, `test.html`). The backend's other endpoints (`/api/races`, `/api/standings`, `/api/teams`, etc.) still exist and work — they just have no frontend consumer at the moment.

### Design System
- Colors: `#faf9f6` background, `#191b1e` text, oklch-based accents (blue ~230 hue, green ~155 hue, red ~25 hue, purple ~300 hue); tire compound colors S/M/H = `#c23b3b`/`#d9a300`/`#6b6862`
- Fonts: Inter (UI text), JetBrains Mono (session clock, timing figures) — loaded dynamically only while the page is mounted (see `useRaceCenterFonts` in `LiveRace.jsx`)
- All corner radii (buttons, badges, tiles, chart panels) are a consistent `10px`

### Key Gotchas
- **Case-insensitive filename collisions break the build silently**: `frontend/pages/live-race/leaderboardData.js` is named that way, not `leaderboard.js`, specifically because `Leaderboard.jsx` already exists in the same directory. On a case-insensitive filesystem (macOS default), an extensionless import like `import Leaderboard from './Leaderboard'` gets resolved by Vite/Rollup trying the `.js` extension before `.jsx` — so it silently binds to the wrong file if a same-named `.js` module exists, producing a "default is not exported" build error that has nothing to do with the actual bug. Avoid creating a `.js` file with the same base name (case-insensitively) as an existing `.jsx` component.
- **FastF1 first load**: The first time a session loads, FastF1 fetches from the F1 data API — can take 30–60 seconds. Subsequent loads read from `backend/cache/`.
- **Track coordinates**: `/api/track` returns FastF1 GPS-derived `{x, y}` coordinates in meters (values can reach ±5000) — relevant if/when the Overview tab's track map is wired to real data instead of the mockup's fixed SVG path.
- **`<body>` margin reset**: `frontend/index.html` has an inline `<style>` resetting `html, body` margin to 0. Deleting `styles.css` (see above) removed the app's only CSS reset — without it the browser's default 8px body margin adds 16px of phantom scroll height, which is exactly what made the single-viewport layout overflow until this was found. Don't remove this reset without re-checking that every tab still fits one viewport.
- **The dashboard is a fixed-size layout, not a scrolling page**: `LiveRace.jsx`'s root uses `height: '100vh'` + `overflow: 'hidden'` (not `minHeight`, which only sets a floor and lets content grow past the viewport — that was tried and didn't work). Every tab's outer container is `flex: 1` with explicit `minHeight: 0` (flex items default to `min-height: auto`, which refuses to shrink below content size and silently inflates ancestors otherwise), and any column-level grid uses `gridTemplateRows: 'minmax(0, 1fr)'` instead of implicit `auto` so the row is sized to available space, not content. Columns whose content can exceed that space (Leaderboard, the Timing sheet, Strategy's two lists, Telemetry's driver list) get `overflowY: 'auto'` + `minHeight: 0` so *they* scroll internally — the page itself never does. This also means dragging a resize handle (e.g. widening Leaderboard, or growing Sector Deltas) reallocates space among siblings within the fixed total; it never changes the overall dashboard size. If you add a new panel or tab, follow this same pattern rather than reintroducing page-level scrolling.
