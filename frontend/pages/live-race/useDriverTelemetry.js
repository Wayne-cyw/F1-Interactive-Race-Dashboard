import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'

// Fetches a driver's full-session telemetry once per driver selection —
// not on every playback tick. The returned points are sliced live by the
// caller (see telemetrySlice.js) as elapsedSeconds advances. The previous
// driver's points stay until the new ones arrive, so the panel never blanks
// mid-switch; a failed fetch clears them.
export function useDriverTelemetry(year, round, driverCode) {
    const [points, setPoints] = useState(null)

    useEffect(() => {
        if (!year || !round || !driverCode) return
        let cancelled = false

        fetchJSON(`/telemetry/${year}/${round}/R/${driverCode}`)
            .then(body => { if (!cancelled) setPoints(body.telemetry) })
            .catch(() => { if (!cancelled) setPoints(null) })

        return () => { cancelled = true }
    }, [year, round, driverCode])

    return points
}
