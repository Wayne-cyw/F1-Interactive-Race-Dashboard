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
