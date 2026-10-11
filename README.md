# APEX — F1 Interactive Race Dashboard

A full-stack race analytics dashboard that replays real Formula 1 sessions second-by-second — real GPS car positions on a 3D track, live telemetry, tire strategy, and track status, all derived from historical race data via [FastF1](https://github.com/theOehrly/Fast-F1).

**Stack:** React 19 + Vite + Three.js, a hand-built dark design system (frontend) · Flask + FastF1 + pandas, Clean Architecture (backend).

[![Live demo](https://img.shields.io/badge/demo-watch_below-e4254a)](#demo) [![Tests](https://img.shields.io/badge/backend_tests-71_passing-2e7d32)](#getting-started) [![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev) [![Three.js](https://img.shields.io/badge/Three.js-0.185-049ef4)](https://threejs.org)

---

## Demo

![APEX Race Center replaying the 2025 Abu Dhabi Grand Prix — 3D track map, live leaderboard, and real-time telemetry](.github/readme/race-center-demo.gif)

*2025 Abu Dhabi Grand Prix at 8x replay speed: leaderboard, 3D track map, and telemetry all driven by one shared clock.*

<details>
<summary>Landing page</summary>

![APEX landing page — dark hero with an animated circuit map and overlaid speed traces](.github/readme/landing-page.jpg)

</details>

## Why this project

Most "F1 dashboard" tutorials stop at a table of lap times. This one reconstructs an actual race as a real-time replay: a 90-minute race plays back in 90 minutes (or faster, with variable playback speed), with every car's position on a 3D track model driven by real GPS telemetry rather than a schematic approximation. That constraint — keeping dozens of derived views (leaderboard order, tire stints, DNF reveals, sector deltas, rolling telemetry windows) perfectly in sync with a single scrubbable clock — is what most of the engineering here is about. On top of that sits a from-scratch dark UI system (**APEX**) with its own landing page, loading sequence, and component library, built the same way a product team would: tokens first, components second.

## Features

- **Landing page → loading sequence → replay.** A marketing-style landing page (`pages/landing/Landing.jsx`) hands off to a start-light-themed loading screen that reports real progress across each in-flight API request, not a fake spinner — then drops you into the Race Center.
- **Real-time race replay** — play, pause, scrub, and change playback speed (1x–8x) against a single `elapsedSeconds` clock that every visualization derives from.
- **3D track map** — a Three.js scene (`@react-three/fiber` + `@react-three/drei`) rendering the circuit as a textured ribbon with real elevation, a rotate/zoom/pan camera (`OrbitControls`), and a real, per-team-recolored F1 car model (decimated GLTF) at each driver's live GPS position, pitched to match the track's slope under it — click a car to select that driver.
- **Live telemetry panel** — speed, throttle, brake, gear, RPM, and DRS for the selected driver, interpolated between FastF1's ~2Hz samples for smooth 30Hz rendering, with paired throttle/brake charts that auto-follow the live edge and pause the moment you scroll back to inspect an earlier lap.
- **Dynamic leaderboard** — position, gaps, tire compound & age, computed live from lap and pit data, with animated reordering and correct DNF handling (including lap-1 retirements).
- **Strategy tab** — pit stop log and tire stint history per driver.
- **Track status awareness** — safety car, VSC, yellow/red flag periods surfaced from FastF1's timeline.
- **Resizable layout** — drag-to-resize panels across every tab, built on a shared resize primitive rather than one-off implementations.
- **Season/race picker** — every F1 season from 2018 to present.

## Architecture

### Backend — Clean Architecture (`backend/`)

The API is deliberately layered so that business logic has zero dependency on Flask or FastF1:

```
entities/              Plain dataclasses (Driver, Session, Standing, Team, Weather, PitStop, Track, RaceEvent)
use_cases/              One class per operation (GetTelemetryUseCase, GetStandingsUseCase, ...)
interface_adapters/
  gateways/               Repository interfaces (ABCs) — the only contract use cases depend on
  controllers/            Thin HTTP-facing controllers, one per use case
  presenters/             Entity → JSON shaping (incl. team color lookup)
frameworks_drivers/
  web/app.py              Flask app factory + dependency injection + error handlers
  fastf1_gateway/         The only module that imports fastf1; implements every gateway interface,
                          with session-level LRU caching plus FastF1's own disk cache
```

This means the entire domain (`entities/` + `use_cases/`) is tested with hand-written fakes — no FastF1, no Flask, no network calls (71 tests total). Swapping FastF1 for a different data source would touch exactly one directory.

```bash
backend/tests/unit/         # use cases vs. fakes
backend/tests/integration/  # Flask test client vs. the real app factory, fake repos injected
```

### Frontend — single-page React app (`frontend/`)

No router library — a ~30-line custom path hook (`utils/navigation.js`) switches between two screens: the landing page at `/` and the Race Center at `/race`. The Race Center itself has no further navigation: one page with four tabs (Overview / Timing / Strategy / Telemetry), because the whole point is one continuously-running replay, not navigation between static views.

```
pages/landing/Landing.jsx          Marketing landing page — hero, feature cards, CTA
pages/live-race/LoadingScreen.jsx  Start-light-themed loading screen, driven by real request progress
pages/LiveRace.jsx                 Page-level state: active tab, selected driver, session clock
pages/live-race/
  useRaceReplay.js                 Season/race selection, session data fetching, playback state machine
  loadProgress.js                   Weighted progress model across the 7 requests a session load waits on
  useDriverTelemetry.js            Raw per-driver telemetry fetch (once per driver selection)
  interpolation.js                  Shared lerp + binary-search bracket lookup used by telemetry and car position
  telemetrySlice.js                Derives current-instant stats + rolling 15s traces from raw samples
  leaderboardData.js               Session/pit data → display-ready, DNF-aware leaderboard rows
  dnf.js                           Retirement detection + reveal timing from session results
  stints.js                        Tire stint + pit log derivation
  raceClock.js                     Bridges the real-time clock to lap-based derivations
  trackGeometry3d.js               GPS → Three.js scene-space (centering, scaling, elevation zeroing/clamping)
  trackStatus.js                   Track-status timeline lookups (green/yellow/VSC/SC/red)
  TrackMap3D.jsx                   The Overview tab's Three.js <Canvas> — ribbon geometry, camera, car layer
  F1Car3D.jsx                      Per-driver GLTF car model, team-color tinting, eased heading + slope-pitch rotation
  useFollowScroll.js               Auto-follow-the-live-edge scrolling for paired telemetry charts
  {Overview,Timing,Strategy,Telemetry}Tab.jsx   One component per tab
  PlaybackBar.jsx, Leaderboard.jsx, ResizeHandle.jsx, useResizableWidth.js, ui.js
```

Every derived view — leaderboard order, DNF visibility, current lap, telemetry window, track status — is a pure function of `elapsedSeconds`. Scrubbing the playback bar backward doesn't just move a video frame; it correctly un-reveals DNFs, recomputes standings, and re-slices telemetry for that point in time.

### Design system (`design_system/`)

The UI runs on **APEX**, a small dark design system built for this project rather than an off-the-shelf component kit: design tokens (`tokens.css`/`tokens.json`), content and visual-language rules (`README.md`), a motion spec (`motion.md`), and per-component docs under `components/`. Carbon-black surfaces, one signal-red accent used only as a fill, three typefaces with fixed jobs (Unbounded for display, Instrument Sans for body text, JetBrains Mono for every label and readout), and a `prefers-reduced-motion`-aware motion layer. The frontend never hardcodes a color, radius, or font — everything resolves through CSS custom properties (`var(--brand)`, `var(--radius-md)`, …), with the one exception being Three.js materials, which can't consume `var()` and so resolve tokens at runtime via `getComputedStyle`.

### Data flow

```
FastF1 (F1's timing API, cached to disk)
   → fastf1_gateway (the only fastf1-aware code)
   → use_cases (pure business logic)
   → controllers/presenters (JSON shaping)
   → Flask routes (gzip-compressed)
   → useRaceReplay / useDriverTelemetry (fetch once per race/driver)
   → telemetrySlice / leaderboardData / dnf / stints / trackStatus (derive per-instant view state)
   → Overview / Timing / Strategy / Telemetry tabs (render)
```

## API

All responses are JSON, gzip-compressed. Base URL: `http://localhost:5000/api` (proxied to `/api` by Vite in dev).

| Endpoint | Returns |
|---|---|
| `GET /api/seasons` | Available seasons (2018–present) |
| `GET /api/races/<year>` | Race schedule for a season |
| `GET /api/session/<year>/<round>/<type>` | Full session data — laps, results, pit stops |
| `GET /api/session-types/<year>/<round>` | Which sessions exist (R / Q / S / FP1-3) |
| `GET /api/telemetry/<year>/<round>/<type>/<driver>` | Full-session speed/throttle/brake/gear/RPM/DRS, each sample timestamped relative to green flag |
| `GET /api/positions/<year>/<round>` | Per-driver `{t, x, y, z}` GPS position timeline, 2Hz (`z` is real elevation, absolute altitude) |
| `GET /api/track-status/<year>/<round>` | Green/yellow/VSC/safety car/red flag timeline |
| `GET /api/track/<year>/<round>` | Track outline as `{x, y, z}` coordinates |
| `GET /api/standings/<year>` | Driver & constructor championship standings |
| `GET /api/teams/<year>` | Team rosters with driver codes |
| `GET /api/weather/<year>/<round>` | Air/track temperature, humidity, rainfall |
| `GET /api/pitstops/<year>/<round>` | Pit stop history |

The Race Center UI currently drives the session/telemetry/positions/track/pit-stop/weather/track-status endpoints; standings/teams/drivers/session-types are implemented and tested but not yet wired into a view.

## Getting started

**Prerequisites:** Python 3.11, Node.js, and a virtualenv tool.

```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/run.py              # → http://localhost:5000

# Frontend (separate terminal)
npm install
npm run dev                         # → http://localhost:3000 (proxies /api to Flask)
```

Open `http://localhost:3000`, click **Enter the pit wall**, pick a season and race, and hit play.

> **First load of any session takes 30–60 seconds** — FastF1 is fetching from the official F1 timing API, and the loading screen's progress bar tracks that fetch in real time. Every subsequent load of that session reads from `backend/cache/` and is near-instant.

### Other commands

```bash
npm run build          # Production build → dist/
npm run lint            # ESLint

cd backend && python -m pytest -q    # 71 unit + integration tests, fakes only — no live FastF1 calls
```

## Notable engineering decisions

- **Real telemetry over schematics.** The first version of the replay moved cars lap-by-lap with approximated positions. It was rebuilt to use FastF1's raw ~2Hz GPS samples (`/api/positions`) with binary-search interpolation, because lap-level progression didn't actually answer "where is this car right now."
- **One clock, many pure derivations.** Rather than each tab tracking its own playback state, every visual is a function of a single `elapsedSeconds` value. This makes scrubbing, speed changes, and race switching consistent by construction instead of by careful synchronization.
- **Correcting FastF1's data for 3D.** FastF1's `Z` field is absolute altitude (meters above sea level), not track-relative height — using it directly would place the 3D track geometry far outside any sane camera bounds. `trackGeometry3d.js` zeroes it against the track's own minimum before mapping to scene space.
- **Composing rotations in a fixed order.** Each car needs to yaw toward its direction of travel *and* pitch to match the track's local slope, independently. `F1Car3D.jsx` keeps these as separate quaternions and always composes `yaw * pitch`, so pitch is applied in the car's own local frame before yaw rotates it — reversing the order would make the car tilt toward world-space up/down instead of nose-up/down along its own heading.
- **A real progress bar, not a fake one.** The loading screen's progress is driven by `loadProgress.js`, which weights each of the 7 requests a session load waits on by how long it actually takes (the full FastF1 session fetch dominates), rather than animating a spinner for an arbitrary duration.
- **Layered backend for testability.** Because `use_cases/` never imports `fastf1` or `flask`, the entire business-logic layer is tested against hand-written fakes — fast, deterministic tests with no network dependency, while integration tests still exercise the real Flask app factory end-to-end.

## Project structure

```
backend/          Flask API — entities / use_cases / interface_adapters / frameworks_drivers (see Architecture above)
frontend/         Vite + React SPA — landing page + "Race Center" (see Architecture above)
design_system/    APEX design system — tokens, content rules, motion spec, per-component docs
docs/             Design specs and plans for each feature, written before implementation
```

## Roadmap

- Wire up the standings/teams endpoints to a view (currently backend-only)
- Qualifying and sprint session replay (endpoints already support any session type)
- Driver-to-driver telemetry comparison overlay

## Tech stack

**Frontend:** React 19, Vite 7, Three.js, @react-three/fiber, @react-three/drei
**Backend:** Flask 3, FastF1 3.7, pandas, flask-compress, flask-cors
**Tooling:** ESLint, pytest

---

Built by [Wayne Chiu](https://github.com/Wayne-cyw). Unofficial fan project — not affiliated with Formula 1 or any team.
