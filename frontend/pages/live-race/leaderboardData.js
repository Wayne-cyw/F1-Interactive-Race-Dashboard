import { isRevealed } from './dnf'

const TIRE_COLOR = { S: '#c23b3b', M: '#d9a300', H: '#6b6862', I: '#3ecf6e', W: '#3671c6' }
const COMPOUND_CODES = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }
export const BEST_SECTOR_COLOR = 'oklch(52% .18 300)'
const NORMAL_SECTOR_COLOR = '#d9a300'

export function formatLapTime(seconds) {
    if (seconds == null) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds - m * 60
    return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

export function formatSectorTime(seconds) {
    return seconds == null ? '—' : seconds.toFixed(1)
}

export function formatGap(position, gapToLeader) {
    if (position === 1) return 'LEAD'
    if (gapToLeader == null) return '—'
    return `+${gapToLeader.toFixed(3)}`
}

export function compoundToTireCode(compound) {
    return COMPOUND_CODES[compound] || '?'
}

export function formatDriverName(fullName) {
    if (!fullName) return '—'
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0]
    return `${parts[0][0]}. ${parts[parts.length - 1]}`
}

// Turns raw session laps/results/pitstops into the exact presentational
// shape Leaderboard/TimingTab/TelemetryTab already render, scoped to laps
// actually completed by `elapsedSeconds` — a lap's `session_time` marks
// when it STARTED, so completion is `session_time + lap_time`. Filtering
// on `lap_number <= currentLap` instead (as this used to) leaks a lap's
// full result the moment it *starts* rather than when it finishes, since
// `currentLap` itself flips to N as soon as any driver starts lap N —
// e.g. showing everyone's complete lap 1 (sector times included) at
// elapsedSeconds 0, before the race has even started.
export function buildLeaderboardRows({ laps, results, pitstops, currentLap, selectedDriverId, dnfInfo, elapsedSeconds }) {
    const completedLaps = laps.filter(l =>
        l.lap_number != null && l.session_time != null && l.lap_time != null &&
        l.session_time + l.lap_time <= elapsedSeconds
    )

    const lapsByDriver = new Map()
    for (const lap of completedLaps) {
        if (!lap.driver) continue
        const existing = lapsByDriver.get(lap.driver) ?? []
        existing.push(lap)
        lapsByDriver.set(lap.driver, existing)
    }

    // Every classified driver gets a row, even ones with zero completed
    // laps so far — e.g. retired in a lap-1 incident before crossing the
    // line for the first time. Iterating lapsByDriver alone silently drops
    // those drivers from the leaderboard entirely, for the whole replay.
    const driverCodes = new Set([...lapsByDriver.keys(), ...results.map(r => r.driver).filter(Boolean)])

    const rows = []
    for (const driverCode of driverCodes) {
        const driverLaps = (lapsByDriver.get(driverCode) ?? []).slice().sort((a, b) => a.lap_number - b.lap_number)
        const latestLap = driverLaps[driverLaps.length - 1] ?? null
        const lapTimes = driverLaps.map(l => l.lap_time).filter(t => t != null)
        const bestTime = lapTimes.length ? Math.min(...lapTimes) : null

        const driverPitstops = pitstops.filter(p => p.driver === driverCode && p.lap <= currentLap)
        const lastPitLap = driverPitstops.length ? Math.max(...driverPitstops.map(p => p.lap)) : 0
        const inPit = pitstops.filter(p => p.driver === driverCode).some(p =>
            p.pit_in_time != null &&
            elapsedSeconds >= p.pit_in_time &&
            (p.pit_out_time == null || elapsedSeconds < p.pit_out_time)
        )

        const result = results.find(r => r.driver === driverCode)
        const dnfEntry = dnfInfo?.get(driverCode)
        const dnf = dnfInfo ? isRevealed(dnfInfo, driverCode, elapsedSeconds) : false

        const bestSector1SoFar = Math.min(...driverLaps.map(l => l.sector_1_time).filter(v => v != null), Infinity)
        const bestSector2SoFar = Math.min(...driverLaps.map(l => l.sector_2_time).filter(v => v != null), Infinity)
        const bestSector3SoFar = Math.min(...driverLaps.map(l => l.sector_3_time).filter(v => v != null), Infinity)

        rows.push({
            id: driverCode,
            pos: dnf || !latestLap ? null : latestLap.position,
            color: result?.team_color ?? '#8b8880',
            name: formatDriverName(result?.driver_name),
            team: result?.team ?? '',
            gap: dnf ? 'DNF' : formatGap(latestLap?.position, latestLap?.gap_to_leader),
            best: formatLapTime(bestTime),
            last: formatLapTime(latestLap?.lap_time ?? null),
            s1: formatSectorTime(latestLap?.sector_1_time ?? null),
            s2: formatSectorTime(latestLap?.sector_2_time ?? null),
            s3: formatSectorTime(latestLap?.sector_3_time ?? null),
            s1Best: formatSectorTime(bestSector1SoFar === Infinity ? null : bestSector1SoFar),
            s2Best: formatSectorTime(bestSector2SoFar === Infinity ? null : bestSector2SoFar),
            s3Best: formatSectorTime(bestSector3SoFar === Infinity ? null : bestSector3SoFar),
            tire: compoundToTireCode(latestLap?.compound),
            age: latestLap ? latestLap.lap_number - lastPitLap : 0,
            pits: driverPitstops.length,
            inPit,
            top5: !dnf && latestLap?.position != null && latestLap.position <= 3,
            dnf,
            _revealAtSeconds: dnfEntry?.revealAtSeconds ?? null,
            _lastLapEndSeconds: dnfEntry?.lastLapEndSeconds ?? null,
            _sector1: bestSector1SoFar === Infinity ? null : bestSector1SoFar,
            _sector2: bestSector2SoFar === Infinity ? null : bestSector2SoFar,
            _sector3: bestSector3SoFar === Infinity ? null : bestSector3SoFar,
        })
    }

    rows.sort((a, b) => {
        if (a.dnf !== b.dnf) return a.dnf ? 1 : -1
        if (a.dnf) {
            const revealDiff = (b._revealAtSeconds ?? 0) - (a._revealAtSeconds ?? 0)
            if (revealDiff !== 0) return revealDiff
            return (b._lastLapEndSeconds ?? 0) - (a._lastLapEndSeconds ?? 0)
        }
        return (a.pos ?? Infinity) - (b.pos ?? Infinity)
    })

    const activeRows = rows.filter(r => !r.dnf)
    const bestSector1 = Math.min(...activeRows.map(r => r._sector1).filter(v => v != null), Infinity)
    const bestSector2 = Math.min(...activeRows.map(r => r._sector2).filter(v => v != null), Infinity)
    const bestSector3 = Math.min(...activeRows.map(r => r._sector3).filter(v => v != null), Infinity)

    return rows.map(r => {
        const selected = r.id === selectedDriverId
        const { _sector1, _sector2, _sector3, _revealAtSeconds, _lastLapEndSeconds, ...row } = r
        return {
            ...row,
            selected,
            rowBg: selected ? '#f2f8f4' : 'transparent',
            rowAccent: selected ? 'oklch(48% .13 155)' : 'transparent',
            posColor: r.pos === 1 ? 'oklch(48% .13 155)' : '#a8a49b',
            tireColor: TIRE_COLOR[r.tire] || '#8b8880',
            dotR: selected ? 8 : 6,
            s1c: _sector1 != null && _sector1 === bestSector1 ? BEST_SECTOR_COLOR : NORMAL_SECTOR_COLOR,
            s2c: _sector2 != null && _sector2 === bestSector2 ? BEST_SECTOR_COLOR : NORMAL_SECTOR_COLOR,
            s3c: _sector3 != null && _sector3 === bestSector3 ? BEST_SECTOR_COLOR : NORMAL_SECTOR_COLOR,
        }
    })
}

// Finds, per sector, which driver currently holds the fastest time and
// what it is — reuses the s{1,2,3}c coloring buildLeaderboardRows already
// computes (set to BEST_SECTOR_COLOR exactly on the row holding that
// sector's best time) rather than recomputing raw sector times again.
// Returns null for a sector nobody has posted a time in yet (early race).
export function deriveBestSectors(rows) {
    const s1Row = rows.find(r => !r.dnf && r.s1c === BEST_SECTOR_COLOR)
    const s2Row = rows.find(r => !r.dnf && r.s2c === BEST_SECTOR_COLOR)
    const s3Row = rows.find(r => !r.dnf && r.s3c === BEST_SECTOR_COLOR)
    return {
        s1: s1Row ? { name: s1Row.name, time: s1Row.s1Best } : null,
        s2: s2Row ? { name: s2Row.name, time: s2Row.s2Best } : null,
        s3: s3Row ? { name: s3Row.name, time: s3Row.s3Best } : null,
    }
}
