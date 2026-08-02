// Determines which drivers have DNF'd (Did Not Finish) using the session's
// results status, backed by a position-freeze fallback for drivers whose
// status doesn't clearly say so. Only reasons about data timestamped
// at-or-before whatever `elapsedSeconds` it's evaluated against via
// isRevealed() below — never about the full race's future outcome — so
// this keeps working if it's ever driven by a genuinely partial/live feed
// instead of a fully-preloaded completed session.

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

// Builds a per-driver DNF picture from a session's results, laps, and
// position samples. `revealAtSeconds` is the elapsedSeconds threshold at
// which a DNF'd driver should actually disappear from the map / drop to
// the bottom of the leaderboard: the real moment their position data went
// quiet, plus a 3-lap confirmation window — not from the start of replay.
export function computeDnfInfo({ results, positions, laps, totalDurationSeconds }) {
    const fieldAvgLapTime = averageLapTime(laps ?? []) || FALLBACK_LAP_TIME_SECONDS
    const info = new Map()

    for (const result of results ?? []) {
        const driverId = result.driver
        if (!driverId) continue

        const classification = classifyStatus(result.status)
        if (classification === 'finished') {
            info.set(driverId, { isDnf: false, lastSampleTime: null, revealAtSeconds: null })
            continue
        }

        const driverPoints = positions?.[driverId]
        const lastSampleTime = driverPoints && driverPoints.length ? driverPoints[driverPoints.length - 1].t : null

        if (lastSampleTime == null) {
            // No position data to time a reveal against: confirmed DNFs
            // reveal immediately, ambiguous ones stay unflagged (no signal
            // to confirm them at all).
            info.set(driverId, {
                isDnf: classification === 'dnf',
                lastSampleTime: null,
                revealAtSeconds: classification === 'dnf' ? 0 : null,
            })
            continue
        }

        const driverLapTimes = (laps ?? []).filter(l => l.driver === driverId)
        const avgLapTime = averageLapTime(driverLapTimes) || fieldAvgLapTime
        const revealAtSeconds = lastSampleTime + RETIREMENT_LAP_MULTIPLIER * avgLapTime

        if (classification === 'dnf') {
            // Confirmed by status: always reveal, even if the 3-lap
            // confirmation window would otherwise run past the checkered
            // flag (e.g. a late-race crash) — clamp so it always surfaces
            // by the end of the race instead of never.
            info.set(driverId, { isDnf: true, lastSampleTime, revealAtSeconds: Math.min(revealAtSeconds, totalDurationSeconds) })
        } else {
            // Ambiguous status: only counts as DNF if the freeze window
            // actually completes before the race ends — otherwise this is
            // very likely just a finisher whose telemetry trailed off.
            const confirmedByFreeze = revealAtSeconds < totalDurationSeconds
            info.set(driverId, {
                isDnf: confirmedByFreeze,
                lastSampleTime,
                revealAtSeconds: confirmedByFreeze ? revealAtSeconds : null,
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
