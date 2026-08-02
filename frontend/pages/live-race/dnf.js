// Determines which drivers have DNF'd (Did Not Finish) using the session's
// results status, backed by a last-lap fallback for drivers whose status
// doesn't clearly say so: if a driver's laps stop well before the race
// ends, they've retired regardless of what status says. Detection itself
// (computeDnfInfo) legitimately uses full-session data, since it only ever
// runs against a fully-preloaded completed session — `results[].status` IS
// the final classification and `totalDurationSeconds` IS the final race
// duration. What's actually restricted to data at-or-before "now" is the
// *reveal timing*: isRevealed() below only surfaces a DNF once
// `elapsedSeconds` has reached `revealAtSeconds`, so the UI never shows a
// driver as retired before that moment arrives during replay.

const FINISHED_STATUS_RE = /^(finished|\+\d+\s*laps?)$/i
const RETIREMENT_LAP_MULTIPLIER = 3
const FALLBACK_LAP_TIME_SECONDS = 90

function classifyStatus(status) {
    const trimmed = String(status ?? '').trim()
    if (!trimmed || trimmed.toLowerCase() === 'unknown') return 'ambiguous'
    if (FINISHED_STATUS_RE.test(trimmed)) return 'finished'
    return 'dnf'
}

function averageLapTime(laps) {
    const times = laps.map(l => l.lap_time).filter(t => t != null)
    if (times.length === 0) return null
    return times.reduce((sum, t) => sum + t, 0) / times.length
}

// `session_time` on a lap is when the lap STARTED, not when it ended (see
// backend/frameworks_drivers/fastf1_gateway/gateway.py and
// raceClock.js) — so the end of a driver's last completed lap is
// `session_time + lap_time`. Every lap in `laps` is, by construction, one
// with a valid completed `lap_time` (filtered server-side).
function lastLapEndTime(driverLaps) {
    const times = driverLaps
        .filter(l => l.session_time != null && l.lap_time != null)
        .map(l => l.session_time + l.lap_time)
    return times.length ? Math.max(...times) : 0
}

// Builds a per-driver DNF picture from a session's results and laps.
// `revealAtSeconds` is the elapsedSeconds threshold at which a DNF'd
// driver should actually disappear from the map / drop to the bottom of
// the leaderboard: the real moment they finished their last lap, plus a
// 3-lap confirmation window — not from the start of replay.
export function computeDnfInfo({ results, laps, totalDurationSeconds }) {
    const fieldAvgLapTime = averageLapTime(laps ?? []) || FALLBACK_LAP_TIME_SECONDS
    const info = new Map()

    for (const result of results ?? []) {
        const driverId = result.driver
        if (!driverId) continue

        const classification = classifyStatus(result.status)
        if (classification === 'finished') {
            info.set(driverId, { isDnf: false, lastLapEndSeconds: null, revealAtSeconds: null })
            continue
        }

        const driverLaps = (laps ?? []).filter(l => l.driver === driverId)
        const lastLapEndSeconds = lastLapEndTime(driverLaps)
        const avgLapTime = averageLapTime(driverLaps) || fieldAvgLapTime
        const revealAtSeconds = lastLapEndSeconds + RETIREMENT_LAP_MULTIPLIER * avgLapTime

        if (classification === 'dnf') {
            // Confirmed by status: always reveal, even if the 3-lap
            // confirmation window would otherwise run past the checkered
            // flag (e.g. a late-race crash) — clamp so it always surfaces
            // by the end of the race instead of never.
            info.set(driverId, { isDnf: true, lastLapEndSeconds, revealAtSeconds: Math.min(revealAtSeconds, totalDurationSeconds) })
        } else {
            // Ambiguous status: only counts as DNF if the driver's laps
            // stopped well enough before the race ended to be confident
            // — otherwise this is very likely just a finisher.
            const confirmedByGap = revealAtSeconds < totalDurationSeconds
            info.set(driverId, {
                isDnf: confirmedByGap,
                lastLapEndSeconds,
                revealAtSeconds: confirmedByGap ? revealAtSeconds : null,
            })
        }
    }

    return info
}

// True once `elapsedSeconds` has reached the moment a DNF'd driver should
// be treated as retired in the UI. False for classified drivers and for
// DNF drivers whose reveal moment hasn't arrived yet.
export function isRevealed(dnfInfo, driverId, elapsedSeconds) {
    const entry = dnfInfo.get(driverId)
    if (!entry || !entry.isDnf) return false
    return elapsedSeconds >= entry.revealAtSeconds
}
