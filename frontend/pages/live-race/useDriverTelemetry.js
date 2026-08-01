import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'

// Builds an SVG polyline `points` string from a value array, scaled into a
// w×h viewBox with the given min/max value range — same technique the
// mock's toPolyline used.
function toPolyline(values, w, h, min, max) {
    if (values.length === 0) return ''
    const range = max - min || 1
    return values
        .map((v, i) => {
            const x = (i / Math.max(1, values.length - 1)) * w
            const y = h - ((v - min) / range) * h
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
}

// Fetches a driver's fastest-lap telemetry trace for the given session.
// Only refetches when the driver changes, not on every playback tick — the
// backend's /api/telemetry endpoint always returns the fastest lap
// regardless of race progress, so there is nothing lap-dependent to refetch.
export function useDriverTelemetry(year, round, driverCode) {
    const [telemetry, setTelemetry] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!year || !round || !driverCode) return
        let cancelled = false
        setLoading(true)
        setError(null)

        fetchJSON(`/telemetry/${year}/${round}/R/${driverCode}`)
            .then(body => {
                if (cancelled) return
                const points = body.telemetry
                const speeds = points.map(p => p.speed).filter(v => v != null)
                const topSpeed = speeds.length ? Math.round(Math.max(...speeds)) : 0
                const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0
                const drsCount = points.filter(p => p.drs > 0).length
                const lastPoint = points.length ? points[points.length - 1] : null

                setTelemetry({
                    points,
                    topSpeed,
                    avgSpeed,
                    drsCount,
                    speedPoly: toPolyline(points.map(p => p.speed ?? 0), 300, 90, 0, Math.max(1, topSpeed)),
                    speedPolyBig: toPolyline(points.map(p => p.speed ?? 0), 600, 110, 0, Math.max(1, topSpeed)),
                    throttlePolyBig: toPolyline(points.map(p => p.throttle ?? 0), 600, 70, 0, 100),
                    brakePolyBig: toPolyline(points.map(p => (p.brake ? 100 : 0)), 600, 70, 0, 100),
                    lastPoint,
                })
                setLoading(false)
            })
            .catch(err => {
                if (cancelled) return
                setError(err.message)
                setTelemetry(null)
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [year, round, driverCode])

    return { telemetry, loading, error }
}
