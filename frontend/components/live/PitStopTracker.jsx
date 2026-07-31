import { useState, useEffect, useRef } from 'react'
import { API_URL } from '../../utils/helpers'

export default function PitStopTracker({ year, race, currentLap, onAlert }) {
    const [pitStops, setPitStops] = useState([])
    const [displayedStops, setDisplayedStops] = useState([])
    const prevLapRef = useRef(0)

    useEffect(() => {
        if (!year || !race) return
        fetch(`${API_URL}/pitstops/${year}/${race}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setPitStops(data.pit_stops))
            .catch(console.error)
    }, [year, race])

    useEffect(() => {
        if (!pitStops.length || !currentLap) return
        setDisplayedStops(pitStops.filter(stop => stop.lap <= currentLap))
        if (currentLap !== prevLapRef.current) {
            pitStops.filter(stop => stop.lap === currentLap).forEach(stop => {
                onAlert?.(`${stop.driver} pits — ${stop.from_compound} → ${stop.to_compound}`, 'pitstop')
            })
            prevLapRef.current = currentLap
        }
    }, [currentLap, pitStops, onAlert])

    return (
        <div className="surface">
            <h3 className="panel-title">Pit Stops ({displayedStops.length})</h3>
            <div>
                {displayedStops.slice(-10).reverse().map((stop, index) => (
                    <div key={index} className="pitstop-compact">
                        <span style={{
                            minWidth: '36px',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: stop.lap === currentLap ? 'var(--green)' : 'var(--text-secondary)',
                        }}>
                            L{stop.lap}
                        </span>
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{stop.driver}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {stop.from_compound} → {stop.to_compound}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
