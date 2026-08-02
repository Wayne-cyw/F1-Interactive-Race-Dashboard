// Determines which drivers have DNF'd (Did Not Finish) using the session's
// results status, backed by a last-lap fallback for drivers whose status
// doesn't clearly say so: if a driver's laps stop well before the race
// ends, they've retired regardless of what status says. Only reasons about
// data timestamped at-or-before whatever `elapsedSeconds` it's evaluated
// against via isRevealed() below — never about the full race's future
// outcome — so this keeps working if it's ever driven by a genuinely
// partial/live feed instead of a fully-preloaded completed session.

const FINISHED_STATUS_RE = /^(finished|\+\d+\s*laps?)$/i
const RETIREMENT_LAP_MULTIPLIER = 3
const FALLBACK_LAP_TIME_SECONDS = 90

function classifyStatus(status) {
    const trimmed = (status ?? '').trim()
    if (!trimmed || trimmed.toLowerCase() === 'unknown') return 'ambiguous'
    if (FINISHED_STATUS_RE.test(trimmed)) return 'finished'
    return 'dnf'
}

function averageLapTime(laps) {
    const times = laps.map(l => l.lap_time).filter(t => t != null)
    if (times.length === 0) return null
    return times.reduce((sum, t) => sum + t, 0) / times.length
}

function lastLapSessionTime(driverLaps) {
    const times = driverLaps.map(l => l.session_time).filter(t => t != null)
    return times.length ? Math.max(...times) : 0
}

// Builds a per-driver DNF picture from a session's results and laps.
// `revealAtSeconds` is the elapsedSeconds threshold at which a DNF'd
// driver should actually disappear from the map / drop to the bottom of
// the leaderboard: the real moment they stopped lapping, plus a 3-lap
// confirmation window — not from the start of replay.
export function computeDnfInfo({ results, laps, totalDurationSeconds }) {
    const fieldAvgLapTime = averageLapTime(laps ?? []) || FALLBACK_LAP_TIME_SECONDS
    const info = new Map()

    for (const result of results ?? []) {
        const driverId = result.driver
        if (!driverId) continue

        const classification = classifyStatus(result.status)
        if (classification === 'finished') {
            info.set(driverId, { isDnf: false, lastLapTime: null, revealAtSeconds: null })
            continue
        }

        const driverLaps = (laps ?? []).filter(l => l.driver === driverId)
        const lastLapTime = lastLapSessionTime(driverLaps)
        const avgLapTime = averageLapTime(driverLaps) || fieldAvgLapTime
        const revealAtSeconds = lastLapTime + RETIREMENT_LAP_MULTIPLIER * avgLapTime

        if (classification === 'dnf') {
            // Confirmed by status: always reveal, even if the 3-lap
            // confirmation window would otherwise run past the checkered
            // flag (e.g. a late-race crash) — clamp so it always surfaces
            // by the end of the race instead of never.
            info.set(driverId, { isDnf: true, lastLapTime, revealAtSeconds: Math.min(revealAtSeconds, totalDurationSeconds) })
        } else {
            // Ambiguous status: only counts as DNF if the driver's laps
            // stopped well enough before the race ended to be confident
            // — otherwise this is very likely just a finisher.
            const confirmedByGap = revealAtSeconds < totalDurationSeconds
            info.set(driverId, {
                isDnf: confirmedByGap,
                lastLapTime,
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
