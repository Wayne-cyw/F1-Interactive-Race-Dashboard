const TIRE_COLOR = { S: '#c23b3b', M: '#d9a300', H: '#6b6862', I: '#3ecf6e', W: '#3671c6' }
const COMPOUND_CODES = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }

function toTireCode(compound) {
    return COMPOUND_CODES[compound] || '?'
}

// Pit stops that have happened so far in the replay, most recent first —
// matches StrategyTab's existing {driver, lap, from, to, dur} shape.
export function buildPitLog(pitstops, currentLap) {
    return pitstops
        .filter(p => p.lap <= currentLap)
        .sort((a, b) => b.lap - a.lap)
        .map(p => ({
            driver: p.driver,
            lap: p.lap,
            from: toTireCode(p.from_compound),
            to: toTireCode(p.to_compound),
            dur: p.pit_duration != null ? p.pit_duration.toFixed(1) : '—',
        }))
}

// Reconstructs each driver's tire stints from consecutive pit-stop compound
// changes, clipped to currentLap so a stint still in progress ends at
// currentLap rather than revealing a pit stop that hasn't happened yet in
// the replay — consistent with buildPitLog only showing completed stops.
export function buildTireStints({ pitstops, results, laps, currentLap, totalLaps }) {
    const stintsByDriver = {}

    for (const result of results) {
        const driverCode = result.driver
        const driverPitstops = pitstops
            .filter(p => p.driver === driverCode && p.lap <= currentLap)
            .sort((a, b) => a.lap - b.lap)

        const driverLaps = (laps ?? []).filter(l => l.driver === driverCode && l.lap_number != null).sort((a, b) => a.lap_number - b.lap_number)
        const openingCompound = driverLaps.length ? driverLaps[0].compound : null

        const rawStints = []
        let from = 0
        let compound = openingCompound ?? (driverPitstops.length ? driverPitstops[0].from_compound : null)
        for (const stop of driverPitstops) {
            rawStints.push({ compound, from, to: stop.lap })
            from = stop.lap
            compound = stop.to_compound
        }
        rawStints.push({ compound, from, to: currentLap })

        stintsByDriver[driverCode] = rawStints
            .filter(s => s.to > s.from)
            .map(s => ({
                c: toTireCode(s.compound),
                from: s.from,
                to: s.to,
                clr: TIRE_COLOR[toTireCode(s.compound)] || '#8b8880',
                pct: ((s.to - s.from) / totalLaps) * 100,
                left: (s.from / totalLaps) * 100,
            }))
    }

    return stintsByDriver
}
