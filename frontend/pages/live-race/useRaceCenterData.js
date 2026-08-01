import { DRIVERS_RAW, PIT_LOG, TIRE_COLOR, genTrace, toPolyline } from './mockData'

const TOTAL_LAPS = 58

// Derives display-ready driver rows, the selected driver's telemetry traces,
// and strategy bar geometry from the raw placeholder data — mirrors the
// computed-values step the original design mockup did inline per render.
export function useRaceCenterData(selectedDriverId) {
    const drivers = DRIVERS_RAW.map(d => ({
        ...d,
        selected: d.id === selectedDriverId,
        rowBg: d.id === selectedDriverId ? '#f2f8f4' : 'transparent',
        rowAccent: d.id === selectedDriverId ? 'oklch(48% .13 155)' : 'transparent',
        posColor: d.pos === 1 ? 'oklch(48% .13 155)' : '#a8a49b',
        tireColor: TIRE_COLOR[d.tire],
        drsOff: !d.drs,
        top5: d.pos <= 3,
        s1c: d.pos === 1 ? 'oklch(52% .18 300)' : '#d9a300',
        s2c: 'oklch(48% .13 155)',
        s3c: d.pos <= 2 ? 'oklch(48% .13 155)' : '#d9a300',
        dotR: d.id === selectedDriverId ? 8 : 6,
        stints: d.stints.map(s => ({
            ...s,
            clr: TIRE_COLOR[s.c],
            pct: (s.to - s.from) / TOTAL_LAPS * 100,
            left: s.from / TOTAL_LAPS * 100,
        })),
    }))

    const selected = drivers.find(d => d.id === selectedDriverId) || drivers[0]

    const speed = genTrace(selected.id * 3)
    const throttleArr = speed.map(v => (v > 250 ? 92 : v > 150 ? 55 : 20))
    const brakeArr = speed.map((v, i, arr) => (i > 0 && arr[i] < arr[i - 1] - 15 ? 70 : 5))
    const topSpeed = Math.max(...speed)
    const avgSpeed = Math.round(speed.reduce((a, b) => a + b, 0) / speed.length)
    const drsSamples = speed.filter(v => v > 290).length
    const drsCount = drsSamples > 0 ? Math.max(1, Math.round(drsSamples / 3)) : 0

    return {
        drivers,
        selected,
        pitLog: PIT_LOG,
        totalLaps: TOTAL_LAPS,
        speedPoly: toPolyline(speed, 300, 90, 50, 340),
        speedPolyBig: toPolyline(speed, 600, 110, 50, 340),
        throttlePolyBig: toPolyline(throttleArr, 600, 70, 0, 100),
        brakePolyBig: toPolyline(brakeArr, 600, 70, 0, 100),
        topSpeed,
        avgSpeed,
        drsCount,
    }
}
