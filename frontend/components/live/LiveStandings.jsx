import { useState, useEffect } from 'react'

export default function LiveStandings({ sessionData, currentLap, progress }) {
    const [standings, setStandings] = useState([])

    useEffect(() => {
        if (!sessionData?.results || !sessionData?.laps) return

        const sorted = sessionData.results
            .map(driver => {
                const driverLaps = sessionData.laps.filter(l => l.driver === driver.driver && l.lap_number <= currentLap)
                const totalTime = driverLaps.reduce((sum, lap) => sum + (lap.lap_time || 0), 0)
                const currentLapTime = driverLaps[driverLaps.length - 1]?.lap_time || 60
                return {
                    ...driver,
                    totalTime: totalTime + currentLapTime * progress,
                    completedLaps: driverLaps.length,
                }
            })
            .filter(d => d.completedLaps > 0)
            .sort((a, b) => a.totalTime - b.totalTime)

        const leaderTime = sorted[0]?.totalTime || 0
        setStandings(sorted.map((driver, index) => ({
            ...driver,
            livePosition: index + 1,
            timeGap: index === 0 ? null : driver.totalTime - leaderTime,
        })))
    }, [sessionData, currentLap, progress])

    if (!standings.length) return null

    return (
        <div className="surface">
            <h3 className="panel-title">Live Standings</h3>
            <div>
                {standings.map((driver) => (
                    <div key={driver.driver} className="standings-compact-row">
                        <span style={{
                            minWidth: '22px',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: driver.livePosition <= 3 ? 'var(--text-accent)' : 'var(--text-secondary)',
                        }}>
                            {driver.livePosition}
                        </span>
                        <span
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: driver.team_color || 'var(--text-secondary)',
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{driver.driver}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{driver.team}</div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '60px' }}>
                            {driver.timeGap !== null ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace' }}>
                                    +{driver.timeGap.toFixed(3)}s
                                </span>
                            ) : (
                                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold', fontFamily: 'Space Mono, monospace' }}>
                                    LEAD
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
