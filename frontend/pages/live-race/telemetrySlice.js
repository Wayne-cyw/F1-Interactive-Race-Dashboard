const ROLLING_WINDOW_SECONDS = 15

// Builds a time-scaled SVG polyline: x is mapped by real elapsed-time
// offset from `windowStart` over a `windowSeconds`-wide span (not sample
// index, which is what made the old Overview speed graph "compress" a
// variable-length lap into a fixed width) — so a given moment in time
// always lands at the same x position and never rescales as more data
// arrives. Before the window is full, the trace simply occupies less than
// the full width instead of stretching to fill it.
function toTimeScaledPolyline(points, valueFn, w, h, min, max, windowStart, windowSeconds) {
    if (points.length === 0) return ''
    const range = max - min || 1
    return points
        .map(p => {
            const x = ((p.t - windowStart) / windowSeconds) * w
            const y = h - ((valueFn(p) - min) / range) * h
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
}

// Pixels-per-second scale for the Telemetry tab's scrollable throttle/brake
// charts — chosen so a typical ~90-second lap spans roughly one panel width,
// giving "scroll back to see the previous lap" a natural feel.
export const SCROLL_PIXELS_PER_SECOND = 14

// Builds a fixed-scale SVG polyline: x = t * SCROLL_PIXELS_PER_SECOND, not
// normalized to a viewBox width — so a second of race time always occupies
// the same number of pixels regardless of how much data exists. The caller
// renders an SVG exactly as wide as the data (see scrollContentWidthPx)
// inside a horizontally-scrolling container, rather than squeezing all of
// it into a fixed box.
function toPixelScaledPolyline(points, valueFn, h, min, max) {
    if (points.length === 0) return ''
    const range = max - min || 1
    return points
        .map(p => {
            const x = p.t * SCROLL_PIXELS_PER_SECOND
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
// speed, DRS activation count), fixed-scale speed/throttle/brake traces for
// the Telemetry tab's scrollable rolling window (see
// SCROLL_PIXELS_PER_SECOND — a second of race time always occupies the same
// number of pixels, so the caller can let the user scroll back through them
// to compare previous laps), and three rolling 15-second-window traces for
// the Overview tab (speed/throttle/brake), which scroll in real time rather
// than compressing a variable-length span into a fixed width. Returns null
// if there's no data yet (e.g. before the driver's first sample).
export function sliceTelemetry(points, elapsedSeconds) {
    if (!points || points.length === 0) return null
    const soFar = points.filter(p => p.t <= elapsedSeconds)
    if (soFar.length === 0) return null

    const speeds = soFar.map(p => p.speed).filter(v => v != null)
    const topSpeed = speeds.length ? Math.round(Math.max(...speeds)) : 0
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0
    const current = interpolateTelemetryPoint(points, elapsedSeconds)

    const windowStart = elapsedSeconds - ROLLING_WINDOW_SECONDS
    const rollingPoints = points.filter(p => p.t >= windowStart && p.t <= elapsedSeconds)
    const rollingWithCurrent = current ? [...rollingPoints, current] : rollingPoints

    return {
        current,
        topSpeed,
        avgSpeed,
        drsCount: countDrsActivations(soFar),
        scrollContentWidthPx: Math.max(1, elapsedSeconds) * SCROLL_PIXELS_PER_SECOND,
        speedScrollPoly: toPixelScaledPolyline(soFar, p => p.speed ?? 0, 100, 0, Math.max(1, topSpeed)),
        throttleScrollPoly: toPixelScaledPolyline(soFar, p => p.throttle ?? 0, 100, 0, 100),
        brakeScrollPoly: toPixelScaledPolyline(soFar, p => (p.brake ? 100 : 0), 100, 0, 100),
        speedRollingPoly: toTimeScaledPolyline(rollingWithCurrent, p => p.speed ?? 0, 300, 90, 0, Math.max(1, topSpeed), windowStart, ROLLING_WINDOW_SECONDS),
        throttleRollingPoly: toTimeScaledPolyline(rollingWithCurrent, p => p.throttle ?? 0, 300, 60, 0, 100, windowStart, ROLLING_WINDOW_SECONDS),
        brakeRollingPoly: toTimeScaledPolyline(rollingWithCurrent, p => (p.brake ? 100 : 0), 300, 60, 0, 100, windowStart, ROLLING_WINDOW_SECONDS),
    }
}
