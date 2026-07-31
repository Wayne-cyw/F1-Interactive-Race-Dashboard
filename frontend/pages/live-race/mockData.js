// Placeholder race data for the Race Center redesign, ported from the design mockup.
// Replace with real API-backed data (drivers/standings/telemetry/pitstops) in a later pass.

// Placeholder race list for the header selector — selecting a different race
// only changes the header's name/year for now; DRIVERS_RAW/PIT_LOG below stay
// fixed until real /api/races + /api/session wiring lands.
export const RACES = [
    { id: 'bahrain-2026', year: 2026, name: 'Bahrain Grand Prix' },
    { id: 'silverstone-2026', year: 2026, name: 'Silverstone Grand Prix' },
    { id: 'monza-2026', year: 2026, name: 'Monza Grand Prix' },
    { id: 'silverstone-2025', year: 2025, name: 'Silverstone Grand Prix' },
]

export const DEFAULT_RACE_ID = 'silverstone-2026'

export const TIRE_COLOR = { S: '#c23b3b', M: '#d9a300', H: '#6b6862' }

export const DRIVERS_RAW = [
    { id: 1, pos: 1, name: 'N. Voss', team: 'Meridian', color: 'oklch(55% .15 250)', gap: 'LEAD', best: '1:28.301', last: '1:28.412', s1: '28.4', s2: '31.1', s3: '29.0', tire: 'M', age: 12, pits: 1, topSpeed: 312, throttle: 94, brake: 0, gear: 7, drs: true, mx: 118, my: 122, stints: [{ c: 'S', from: 0, to: 30 }, { c: 'M', from: 30, to: 58 }] },
    { id: 2, pos: 2, name: 'R. Diaz', team: 'Solace', color: 'oklch(55% .18 25)', gap: '+1.204', best: '1:28.550', last: '1:28.688', s1: '28.6', s2: '31.0', s3: '29.1', tire: 'M', age: 12, pits: 1, topSpeed: 308, throttle: 88, brake: 4, gear: 6, drs: false, mx: 170, my: 90, stints: [{ c: 'S', from: 0, to: 30 }, { c: 'M', from: 30, to: 58 }] },
    { id: 3, pos: 3, name: 'K. Lindqvist', team: 'Vantage', color: 'oklch(55% .15 145)', gap: '+4.881', best: '1:28.902', last: '1:29.015', s1: '28.9', s2: '31.3', s3: '28.9', tire: 'H', age: 5, pits: 2, topSpeed: 305, throttle: 100, brake: 0, gear: 8, drs: true, mx: 240, my: 56, stints: [{ c: 'S', from: 0, to: 18 }, { c: 'M', from: 18, to: 37 }, { c: 'H', from: 37, to: 58 }] },
    { id: 4, pos: 4, name: 'T. Okafor', team: 'Meridian', color: 'oklch(55% .15 250)', gap: '+9.204', best: '1:29.150', last: '1:29.301', s1: '29.0', s2: '31.4', s3: '28.9', tire: 'M', age: 9, pits: 1, topSpeed: 302, throttle: 76, brake: 12, gear: 5, drs: false, mx: 310, my: 68, stints: [{ c: 'S', from: 0, to: 33 }, { c: 'M', from: 33, to: 58 }] },
    { id: 5, pos: 5, name: 'A. Serrano', team: 'Solace', color: 'oklch(55% .18 25)', gap: '+13.702', best: '1:29.400', last: '1:29.520', s1: '29.1', s2: '31.5', s3: '28.9', tire: 'H', age: 5, pits: 2, topSpeed: 300, throttle: 60, brake: 20, gear: 4, drs: false, mx: 380, my: 86, stints: [{ c: 'S', from: 0, to: 20 }, { c: 'M', from: 20, to: 37 }, { c: 'H', from: 37, to: 58 }] },
    { id: 6, pos: 6, name: 'J. Whitfield', team: 'Vantage', color: 'oklch(55% .15 145)', gap: '+18.114', best: '1:29.601', last: '1:29.780', s1: '29.3', s2: '31.6', s3: '28.9', tire: 'M', age: 18, pits: 1, topSpeed: 298, throttle: 82, brake: 6, gear: 6, drs: false, mx: 440, my: 78, stints: [{ c: 'S', from: 0, to: 24 }, { c: 'M', from: 24, to: 58 }] },
    { id: 7, pos: 7, name: 'H. Nakada', team: 'Kestrel', color: 'oklch(55% .15 300)', gap: '+24.330', best: '1:29.850', last: '1:30.011', s1: '29.4', s2: '31.7', s3: '28.9', tire: 'S', age: 3, pits: 2, topSpeed: 310, throttle: 90, brake: 2, gear: 7, drs: true, mx: 470, my: 150, stints: [{ c: 'M', from: 0, to: 15 }, { c: 'H', from: 15, to: 39 }, { c: 'S', from: 39, to: 58 }] },
    { id: 8, pos: 8, name: 'E. Dubois', team: 'Orion', color: 'oklch(60% .15 60)', gap: '+29.887', best: '1:30.050', last: '1:30.203', s1: '29.5', s2: '31.8', s3: '28.9', tire: 'M', age: 14, pits: 1, topSpeed: 296, throttle: 70, brake: 15, gear: 5, drs: false, mx: 430, my: 195, stints: [{ c: 'S', from: 0, to: 28 }, { c: 'M', from: 28, to: 58 }] },
    { id: 9, pos: 9, name: 'S. Halvorsen', team: 'Kestrel', color: 'oklch(55% .15 300)', gap: '+36.442', best: '1:30.301', last: '1:30.512', s1: '29.6', s2: '31.9', s3: '29.0', tire: 'H', age: 7, pits: 2, topSpeed: 294, throttle: 65, brake: 18, gear: 4, drs: false, mx: 390, my: 228, stints: [{ c: 'M', from: 0, to: 12 }, { c: 'S', from: 12, to: 35 }, { c: 'H', from: 35, to: 58 }] },
    { id: 10, pos: 10, name: 'F. Marchetti', team: 'Orion', color: 'oklch(60% .15 60)', gap: '+41.005', best: '1:30.601', last: '1:30.780', s1: '29.7', s2: '32.0', s3: '29.1', tire: 'M', age: 16, pits: 1, topSpeed: 291, throttle: 55, brake: 25, gear: 3, drs: false, mx: 320, my: 238, stints: [{ c: 'S', from: 0, to: 26 }, { c: 'M', from: 26, to: 58 }] },
]

export const PIT_LOG = [
    { lap: 15, driver: 'N. Voss', from: 'S', to: 'M', dur: 2.3 },
    { lap: 18, driver: 'K. Lindqvist', from: 'S', to: 'M', dur: 2.6 },
    { lap: 20, driver: 'A. Serrano', from: 'S', to: 'M', dur: 2.4 },
    { lap: 24, driver: 'J. Whitfield', from: 'S', to: 'M', dur: 2.5 },
    { lap: 28, driver: 'E. Dubois', from: 'S', to: 'M', dur: 2.7 },
    { lap: 30, driver: 'N. Voss', from: 'M', to: 'M', dur: 2.2 },
    { lap: 33, driver: 'T. Okafor', from: 'S', to: 'M', dur: 2.4 },
]

export function fmtClock(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

export function genTrace(seed) {
    const n = 24
    const pts = []
    for (let i = 0; i < n; i++) {
        const v = 195 + 120 * Math.sin((i + seed) * 0.55) + 40 * Math.sin((i + seed * 1.7) * 0.31)
        pts.push(Math.max(60, Math.min(335, Math.round(v))))
    }
    return pts
}

export function toPolyline(vals, w, h, min, max) {
    return vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * w
        const y = h - ((v - min) / (max - min)) * h
        return x.toFixed(1) + ',' + y.toFixed(1)
    }).join(' ')
}
