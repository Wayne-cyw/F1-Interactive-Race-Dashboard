import { findBracket, lerp } from './interpolation'

// Linearly interpolates a driver's real-world {x, y, z} position at time
// `t` (seconds since green flag) from their sorted position sample array
// (each {t, x, y, z}, ~2Hz from the backend). Returns null if there is no
// data at all. Clamps to the first/last sample outside the recorded range
// (e.g. before the driver's first sample or after their last).
export function interpolatePosition(points, t) {
    if (!points || points.length === 0) return null
    const { before, after, frac } = findBracket(points, t)
    return {
        x: lerp(before.x, after.x, frac),
        y: lerp(before.y, after.y, frac),
        z: lerp(before.z ?? 0, after.z ?? 0, frac),
    }
}
