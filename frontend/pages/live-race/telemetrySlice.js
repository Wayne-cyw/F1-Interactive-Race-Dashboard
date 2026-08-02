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

const ROLLING_WINDOW_SECONDS = 15

// Builds a rolling-window SVG polyline: x is mapped by real elapsed-time
// offset from `windowStart` (not sample index, which is what made the old
// Overview speed graph "compress" a variable-length lap into a fixed
// width) — so the right edge (x=w) is always "now" and old samples slide
// off the left edge once they're more than ROLLING_WINDOW_SECONDS old.
// Early in the race, before a full window's worth of data exists, the
// trace simply occupies less than the full width instead of stretching to
// fill it.
function toRollingPolyline(points, valueFn, w, h, min, max, windowStart) {
    if (points.length === 0) return ''
    const range = max - min || 1
    return points
        .map(p => {
            const x = ((p.t - windowStart) / ROLLING_WINDOW_SECONDS) * w
            const y = h - ((valueFn(p) - min) / range) * h
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
}

function lerp(a, b, frac) {
    return a != null && b != null ? a + (b - a) * frac : (a ?? b)
}

// Linearly interpolates a driver's telemetry sample at time `t` (seconds
// since green flag) from their sorted full-session point array (~2Hz from
// the backend) — the same technique trackMap.js's interpolatePosition uses
// for car position — so a 30Hz render loop shows smoothly-changing values
// instead of repeating the same 2Hz sample ~15 times in a row. Continuous
// fields (speed/throttle/rpm) interpolate; discrete fields (gear/brake/drs)
// can't mean anything "halfway", so they step-hold the earlier bracketing
// sample. Returns null if there is no data at all. Clamps to the
// first/last sample outside the recorded range.
export function interpolateTelemetryPoint(points, t) {
    if (!points || points.length === 0) return null
    if (t <= points[0].t) return points[0]
    const last = points[points.length - 1]
    if (t >= last.t) return last

    let lo = 0
    let hi = points.length - 1
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (points[mid].t <= t) lo = mid + 1
        else hi = mid
    }
    const after = points[lo]
    const before = points[lo - 1]
    const span = after.t - before.t || 1
    const frac = (t - before.t) / span

    return {
        t,
        speed: lerp(before.speed, after.speed, frac),
        throttle: lerp(before.throttle, after.throttle, frac),
        rpm: lerp(before.rpm, after.rpm, frac),
        gear: before.gear,
        brake: before.brake,
        drs: before.drs,
    }
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
// speed, DRS activation count), a current-lap-so-far trace (for the
// Telemetry tab's "LAP TRACE" chart, using lapStartTime as the trace's
// left edge), and three rolling 15-second-window traces for the Overview
// tab (speed/throttle/brake), which scroll in real time rather than
// compressing a variable-length span into a fixed width. Returns null if
// there's no data yet (e.g. before the driver's first sample).
export function sliceTelemetry(points, elapsedSeconds, lapStartTime) {
    if (!points || points.length === 0) return null
    const soFar = points.filter(p => p.t <= elapsedSeconds)
    if (soFar.length === 0) return null

    const lapSoFar = soFar.filter(p => p.t >= (lapStartTime ?? 0))
    const speeds = soFar.map(p => p.speed).filter(v => v != null)
    const topSpeed = speeds.length ? Math.round(Math.max(...speeds)) : 0
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0
    const current = interpolateTelemetryPoint(points, elapsedSeconds)

    const windowStart = elapsedSeconds - ROLLING_WINDOW_SECONDS
    const rollingPoints = points.filter(p => p.t >= windowStart && p.t <= elapsedSeconds)
    const rollingWithCurrent = current ? [...rollingPoints, current] : rollingPoints
    const rollingSpeeds = rollingWithCurrent.map(p => p.speed).filter(v => v != null)
    const rollingMaxSpeed = rollingSpeeds.length ? Math.max(...rollingSpeeds) : 1

    return {
        current,
        topSpeed,
        avgSpeed,
        drsCount: countDrsActivations(soFar),
        speedPolyBig: toPolyline(lapSoFar.map(p => p.speed ?? 0), 600, 110, 0, Math.max(1, topSpeed)),
        throttlePolyBig: toPolyline(lapSoFar.map(p => p.throttle ?? 0), 600, 70, 0, 100),
        brakePolyBig: toPolyline(lapSoFar.map(p => (p.brake ? 100 : 0)), 600, 70, 0, 100),
        speedRollingPoly: toRollingPolyline(rollingWithCurrent, p => p.speed ?? 0, 300, 90, 0, Math.max(1, rollingMaxSpeed), windowStart),
        throttleRollingPoly: toRollingPolyline(rollingWithCurrent, p => p.throttle ?? 0, 300, 60, 0, 100, windowStart),
        brakeRollingPoly: toRollingPolyline(rollingWithCurrent, p => (p.brake ? 100 : 0), 300, 60, 0, 100, windowStart),
    }
}
