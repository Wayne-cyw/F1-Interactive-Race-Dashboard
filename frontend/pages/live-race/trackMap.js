// Normalizes /api/track's GPS-derived {x, y} meter coordinates (can reach
// ±5000) into an SVG path filling a width×height viewBox with fixed
// padding. Exposes the same normalization as `toSvgPoint` so real-time car
// positions (from /api/positions, not part of the fixed outline) can be
// placed in the exact same SVG space.
export function buildTrackPath(coordinates, { width = 560, height = 320, padding = 30 } = {}) {
    if (!coordinates || coordinates.length === 0) {
        return { pathD: '', toSvgPoint: () => ({ x: width / 2, y: height / 2 }) }
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

    function toSvgPoint(p) {
        return {
            x: offsetX + (p.x - minX) * scale,
            // SVG y grows downward; flip so the track isn't mirrored vertically.
            y: offsetY + (spanY - (p.y - minY)) * scale,
        }
    }

    const points = coordinates.map(toSvgPoint)
    const pathD = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ') + ' Z'

    return { pathD, toSvgPoint }
}

// Linearly interpolates a driver's real-world {x, y} position at time `t`
// (seconds since green flag) from their sorted position sample array
// (each {t, x, y}, ~2Hz from the backend). Returns null if there is no
// data at all. Clamps to the first/last sample outside the recorded range
// (e.g. before the driver's first sample or after their last).
export function interpolatePosition(points, t) {
    if (!points || points.length === 0) return null
    if (t <= points[0].t) return { x: points[0].x, y: points[0].y }
    const last = points[points.length - 1]
    if (t >= last.t) return { x: last.x, y: last.y }

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
        x: before.x + (after.x - before.x) * frac,
        y: before.y + (after.y - before.y) * frac,
    }
}
