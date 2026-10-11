import { findBracket, lerp } from './interpolation'

const ROLLING_WINDOW_SECONDS = 15

// Overview rolling traces are drawn into a fixed 300-unit-wide SVG viewBox
// (see OverviewTab.jsx); heights differ per chart.
const ROLLING_VIEWBOX_WIDTH = 300
const ROLLING_SPEED_HEIGHT = 90
const ROLLING_PEDAL_HEIGHT = 60

// Pixels-per-second scale for the Telemetry tab's scrollable throttle/brake
// charts — chosen so a typical ~90-second lap spans roughly one panel width,
// giving "scroll back to see the previous lap" a natural feel.
export const SCROLL_PIXELS_PER_SECOND = 14
const SCROLL_CHART_HEIGHT = 100

const speedOf = p => p.speed ?? 0
const throttleOf = p => p.throttle ?? 0
const brakeOf = p => (p.brake ? 100 : 0)

// SVG polyline "x,y x,y …" from per-point x and y mappers.
function toPolyline(points, toX, toY) {
    return points.map(p => `${toX(p).toFixed(1)},${toY(p).toFixed(1)}`).join(' ')
}

// Maps a channel value in [min, max] onto an SVG y (0 = top) for `height`.
function toScaledY(valueOf, height, min, max) {
    const range = max - min || 1
    return p => height - ((valueOf(p) - min) / range) * height
}

// Fixed-scale x: a second of race time always occupies the same number of
// pixels regardless of how much data exists. The caller renders an SVG
// exactly as wide as the data (see scrollContentWidthPx) inside a
// horizontally-scrolling container rather than squeezing it into a fixed box.
function scrollPolyline(points, valueOf, max) {
    return toPolyline(points, p => p.t * SCROLL_PIXELS_PER_SECOND, toScaledY(valueOf, SCROLL_CHART_HEIGHT, 0, max))
}

// Time-scaled x: position is the real offset from `windowStart` over the
// 15-second window (not sample index), so a given moment always lands at the
// same x and never rescales as data arrives. Before the window is full the
// trace simply occupies less than the full width.
function rollingPolyline(points, windowStart, valueOf, height, max) {
    const toX = p => ((p.t - windowStart) / ROLLING_WINDOW_SECONDS) * ROLLING_VIEWBOX_WIDTH
    return toPolyline(points, toX, toScaledY(valueOf, height, 0, max))
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
    const { before, after, frac } = findBracket(points, t)
    if (before === after) return before

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

// FastF1 DRS codes: 0-1 off, 8 = eligible (detected, not yet open), 10/12/14 = flap open.
export const DRS_OPEN_MIN = 10

// Counts DRS open->closed->open transitions (activation events), not raw
// samples where DRS happens to be open — a sample-count would overcount an
// activation that spans many samples as if it were many activations.
function countDrsActivations(points) {
    let count = 0
    let wasOn = false
    for (const p of points) {
        const on = p.drs >= DRS_OPEN_MIN
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

    const speedAxisMax = Math.max(1, topSpeed)
    const windowStart = elapsedSeconds - ROLLING_WINDOW_SECONDS
    const rollingPoints = points.filter(p => p.t >= windowStart && p.t <= elapsedSeconds)
    const rollingWithCurrent = current ? [...rollingPoints, current] : rollingPoints

    return {
        current,
        topSpeed,
        avgSpeed,
        drsCount: countDrsActivations(soFar),
        scrollContentWidthPx: Math.max(1, elapsedSeconds) * SCROLL_PIXELS_PER_SECOND,
        speedScrollPoly: scrollPolyline(soFar, speedOf, speedAxisMax),
        throttleScrollPoly: scrollPolyline(soFar, throttleOf, 100),
        brakeScrollPoly: scrollPolyline(soFar, brakeOf, 100),
        speedRollingPoly: rollingPolyline(rollingWithCurrent, windowStart, speedOf, ROLLING_SPEED_HEIGHT, speedAxisMax),
        throttleRollingPoly: rollingPolyline(rollingWithCurrent, windowStart, throttleOf, ROLLING_PEDAL_HEIGHT, 100),
        brakeRollingPoly: rollingPolyline(rollingWithCurrent, windowStart, brakeOf, ROLLING_PEDAL_HEIGHT, 100),
    }
}
