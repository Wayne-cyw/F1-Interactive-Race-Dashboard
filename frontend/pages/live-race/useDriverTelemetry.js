import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'

// Fetches a driver's full-session telemetry once per driver selection —
// not on every playback tick. The returned points are sliced live by the
// caller (see telemetrySlice.js) as elapsedSeconds advances.
export function useDriverTelemetry(year, round, driverCode) {
    const [points, setPoints] = useState(null)
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
                setPoints(body.telemetry)
                setLoading(false)
            })
            .catch(err => {
                if (cancelled) return
                setError(err.message)
                setPoints(null)
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [year, round, driverCode])

    return { points, loading, error }
}
