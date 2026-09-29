// Linearly interpolates a driver's real-world {x, y, z} position at time
// `t` (seconds since green flag) from their sorted position sample array
// (each {t, x, y, z}, ~2Hz from the backend). Returns null if there is no
// data at all. Clamps to the first/last sample outside the recorded range
// (e.g. before the driver's first sample or after their last).
export function interpolatePosition(points, t) {
    if (!points || points.length === 0) return null
    if (t <= points[0].t) return { x: points[0].x, y: points[0].y, z: points[0].z ?? 0 }
    const last = points[points.length - 1]
    if (t >= last.t) return { x: last.x, y: last.y, z: last.z ?? 0 }

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
        z: (before.z ?? 0) + ((after.z ?? 0) - (before.z ?? 0)) * frac,
    }
}
