// Normalizes /api/track's GPS-derived {x, y} meter coordinates (can reach
// ±5000) into an SVG path filling a width×height viewBox with fixed
// padding, plus a t -> {x, y} lookup for placing cars along the outline.
export function buildTrackPath(coordinates, { width = 560, height = 320, padding = 30 } = {}) {
    if (!coordinates || coordinates.length === 0) {
        return { pathD: '', pointAt: () => ({ x: width / 2, y: height / 2 }) }
    }

    const xs = coordinates.map(p => p.x)
    const ys = coordinates.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = maxX - minX || 1
    const spanY = maxY - minY || 1

    const drawableWidth = width - padding * 2
    const drawableHeight = height - padding * 2
    const scale = Math.min(drawableWidth / spanX, drawableHeight / spanY)
    const offsetX = padding + (drawableWidth - spanX * scale) / 2
    const offsetY = padding + (drawableHeight - spanY * scale) / 2

    const points = coordinates.map(p => ({
        x: offsetX + (p.x - minX) * scale,
        // SVG y grows downward; flip so the track isn't mirrored vertically.
        y: offsetY + (spanY - (p.y - minY)) * scale,
    }))

    const pathD = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ') + ' Z'

    function pointAt(t) {
        const clamped = ((t % 1) + 1) % 1
        const index = Math.floor(clamped * points.length) % points.length
        return points[index]
    }

    return { pathD, pointAt }
}

const POSITION_SPACING = 0.015

// Schematic running-order spacing along the track curve — the same formula
// and constant the old Three.js live-race engine used — not GPS-accurate
// telemetry-driven car position (per-lap intra-lap distance isn't available
// from the session endpoint).
export function carPositionT({ currentLap, progress, totalLaps, position }) {
    if (!totalLaps) return 0
    const raw = (currentLap - 1 + progress) / totalLaps + (position - 1) * POSITION_SPACING
    return ((raw % 1) + 1) % 1
}
