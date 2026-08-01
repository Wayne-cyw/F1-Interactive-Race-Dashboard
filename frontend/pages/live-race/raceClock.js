// The highest lap number, across every driver's laps, that has genuinely
// started by `elapsedSeconds` — used as the single integer "current lap"
// fed into the existing lap-based leaderboard/strategy pipeline, and for
// the header's "Lap N of Total" display (matches the race leader's lap in
// practice, since they're usually the first to start each new lap).
export function deriveCurrentLap(elapsedSeconds, laps) {
    let maxLap = 0
    for (const lap of laps) {
        if (lap.session_time != null && lap.session_time <= elapsedSeconds && lap.lap_number > maxLap) {
            maxLap = lap.lap_number
        }
    }
    return maxLap || 1
}

// A specific driver's own most recently started lap's start time, at or
// before `elapsedSeconds` — used to slice that driver's telemetry trace to
// "this lap only, so far" rather than their whole session.
export function deriveLapStartTime(elapsedSeconds, driverLaps) {
    let latestStart = 0
    for (const lap of driverLaps) {
        if (lap.session_time != null && lap.session_time <= elapsedSeconds && lap.session_time > latestStart) {
            latestStart = lap.session_time
        }
    }
    return latestStart
}
