// Shared by trackMap.js (car position) and telemetrySlice.js (driver telemetry):
// both resample ~2Hz backend points so a 30Hz render loop moves smoothly.

// `a` and `b` blended by `frac` (0..1). If only one side has a value, that
// value wins — a missing sample shouldn't null out its neighbour.
export function lerp(a, b, frac) {
    return a != null && b != null ? a + (b - a) * frac : (a ?? b)
}

// Finds the two samples bracketing time `t` in a non-empty array sorted by
// `.t`, plus how far between them `t` lies. Outside the recorded range both
// are the nearest end sample (`before === after`, `frac === 0`).
export function findBracket(points, t) {
    const first = points[0]
    const last = points[points.length - 1]
    if (t <= first.t) return { before: first, after: first, frac: 0 }
    if (t >= last.t) return { before: last, after: last, frac: 0 }

    let lo = 0
    let hi = points.length - 1
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (points[mid].t <= t) lo = mid + 1
        else hi = mid
    }
    const before = points[lo - 1]
    const after = points[lo]
    return { before, after, frac: (t - before.t) / (after.t - before.t || 1) }
}
