// Builds an SVG polyline `points` string from a value array, scaled into a
// w×h viewBox with the given min/max value range.
function toPolyline(values, w, h, min, max) {
    if (values.length === 0) return ''
    const range = max - min || 1
    return values
        .map((v, i) => {
            const x = (i / Math.max(1, values.length - 1)) * w
            const y = h - ((v - min) / range) * h
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
}

// Counts DRS open->closed->open transitions (activation events), not raw
// samples where DRS happens to be open — a sample-count would overcount an
// activation that spans many samples as if it were many activations.
function countDrsActivations(points) {
    let count = 0
    let wasOn = false
    for (const p of points) {
        const on = p.drs > 0
        if (on && !wasOn) count++
        wasOn = on
    }
    return count
}

// Slices a driver's full-session telemetry into what the UI needs "right
// now" at elapsedSeconds: whole-race-so-far running stats (top speed, avg
// speed, DRS activation count) and a current-lap-so-far trace (for the
// live-redrawing "LAP TRACE" chart), using lapStartTime (from
// raceClock.deriveLapStartTime) as the trace's left edge. Returns null if
// there's no data yet (e.g. before the driver's first sample).
export function sliceTelemetry(points, elapsedSeconds, lapStartTime) {
    if (!points || points.length === 0) return null
    const soFar = points.filter(p => p.t <= elapsedSeconds)
    if (soFar.length === 0) return null

    const lapSoFar = soFar.filter(p => p.t >= (lapStartTime ?? 0))
    const speeds = soFar.map(p => p.speed).filter(v => v != null)
    const topSpeed = speeds.length ? Math.round(Math.max(...speeds)) : 0
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0
    const current = soFar[soFar.length - 1]

    return {
        current,
        topSpeed,
        avgSpeed,
        drsCount: countDrsActivations(soFar),
        speedPoly: toPolyline(lapSoFar.map(p => p.speed ?? 0), 300, 90, 0, Math.max(1, topSpeed)),
        speedPolyBig: toPolyline(lapSoFar.map(p => p.speed ?? 0), 600, 110, 0, Math.max(1, topSpeed)),
        throttlePolyBig: toPolyline(lapSoFar.map(p => p.throttle ?? 0), 600, 70, 0, 100),
        brakePolyBig: toPolyline(lapSoFar.map(p => (p.brake ? 100 : 0)), 600, 70, 0, 100),
    }
}
