// Maps FastF1's track-status codes to a display label/color, and derives
// which one is "current" for a given point in the replay — the same
// latest-event-at-or-before pattern raceClock.js's deriveCurrentLap uses
// for laps, applied to /api/track-status's event timeline instead.
export const STATUS_META = {
    '1': { label: 'TRACK CLEAR', color: 'oklch(48% .13 155)' },
    '2': { label: 'YELLOW FLAG', color: 'oklch(75% .18 95)' },
    '4': { label: 'SAFETY CAR', color: 'oklch(60% .18 50)' },
    '5': { label: 'RED FLAG', color: 'oklch(55% .18 25)' },
    '6': { label: 'VSC DEPLOYED', color: 'oklch(60% .18 50)' },
    '7': { label: 'VSC ENDING', color: 'oklch(75% .18 95)' },
}

const DEFAULT_STATUS = { status: '1', message: 'AllClear' }

// Finds the latest track-status event at or before `elapsedSeconds`
// (events are sorted ascending by `t`, guaranteed by the backend).
// Defaults to "track clear" if no event has happened yet, or if the race
// has no status data at all.
export function deriveCurrentTrackStatus(elapsedSeconds, events) {
    if (!events || events.length === 0) return DEFAULT_STATUS
    let current = null
    for (const event of events) {
        if (event.t > elapsedSeconds) break
        current = event
    }
    return current ?? DEFAULT_STATUS
}
