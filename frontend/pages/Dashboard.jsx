import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { API_URL, formatLapTime, getDriverStatus, getStatusLabel } from '../utils/helpers'
import { PositionChart, LapTimeChart, TelemetryChart } from '../components/Charts'

const Hero3D = lazy(() => import('../three/Hero3D'))

export default function Dashboard() {
    const [seasons, setSeasons] = useState([])
    const [year, setYear] = useState(2024)
    const [races, setRaces] = useState([])
    const [selectedRace, setSelectedRace] = useState(null)
    const [sessionType, setSessionType] = useState('R')
    const [availableSessions, setAvailableSessions] = useState([])
    const [sessionData, setSessionData] = useState(null)
    const [selectedDrivers, setSelectedDrivers] = useState([])
    const [selectedDriverTelemetry, setSelectedDriverTelemetry] = useState(null)
    const [telemetryDriver, setTelemetryDriver] = useState(null)
    const [loading, setLoading] = useState(false)
    const [drivers, setDrivers] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch(`${API_URL}/seasons`)
            .then(res => res.json())
            .then(data => { if (data.status === 'success') setSeasons(data.seasons) })
            .catch(err => console.error('Error:', err))
    }, [])

    useEffect(() => {
        setLoading(true)
        setError(null)
        fetch(`${API_URL}/races/${year}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setRaces(data.races)
                else setError(data.message)
                setLoading(false)
            })
            .catch(() => {
                setError('Cannot connect to backend. Make sure Flask is running on port 5000.')
                setLoading(false)
            })
    }, [year])

    useEffect(() => {
        if (!selectedRace) return
        fetch(`${API_URL}/session-types/${year}/${selectedRace}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setAvailableSessions(data.sessions)
                    const hasRace = data.sessions.find(s => s.code === 'R')
                    setSessionType(hasRace ? 'R' : data.sessions[0]?.code || 'R')
                }
            })
            .catch(err => console.error('Error fetching sessions:', err))
    }, [year, selectedRace])

    const fetchSessionData = useCallback((raceRound, session) => {
        setLoading(true)
        setError(null)
        setSelectedDriverTelemetry(null)
        setTelemetryDriver(null)
        Promise.all([
            fetch(`${API_URL}/session/${year}/${raceRound}/${session}`).then(res => res.json()),
            fetch(`${API_URL}/drivers/${year}/${raceRound}`).then(res => res.json()),
        ])
        .then(([sessionResponse, driversResponse]) => {
            if (sessionResponse.status === 'success') {
                setSessionData(sessionResponse)
                if (sessionResponse.results?.length > 0) {
                    setSelectedDrivers(sessionResponse.results.slice(0, 3).map(d => d.driver))
                }
            } else {
                setError(sessionResponse.message)
            }
            if (driversResponse.status === 'success') setDrivers(driversResponse.drivers)
            setLoading(false)
        })
        .catch(() => {
            setError('Failed to load session data. First load may take 30-60 seconds.')
            setLoading(false)
        })
    }, [year])

    const fetchTelemetry = useCallback((driverCode) => {
        if (!selectedRace || !driverCode) return
        setTelemetryDriver(driverCode)
        fetch(`${API_URL}/telemetry/${year}/${selectedRace}/${sessionType}/${driverCode}`)
            .then(res => res.json())
            .then(data => { if (data.status === 'success') setSelectedDriverTelemetry(data) })
            .catch(err => console.error('Error fetching telemetry:', err))
    }, [year, selectedRace, sessionType])

    const handleRaceSelect = useCallback((e) => {
        const raceRound = parseInt(e.target.value)
        setSelectedRace(raceRound)
        if (raceRound) fetchSessionData(raceRound, sessionType)
    }, [fetchSessionData, sessionType])

    const handleSessionChange = useCallback((session) => {
        setSessionType(session)
        if (selectedRace) fetchSessionData(selectedRace, session)
    }, [selectedRace, fetchSessionData])

    const toggleDriver = useCallback((driverCode) => {
        setSelectedDrivers(prev =>
            prev.includes(driverCode)
                ? prev.filter(d => d !== driverCode)
                : [...prev, driverCode]
        )
    }, [])

    const handleDriverClick = useCallback((driverCode) => {
        toggleDriver(driverCode)
        fetchTelemetry(driverCode)
    }, [toggleDriver, fetchTelemetry])

    return (
        <div className="fade-in">
            {/* Decorative 3D header strip */}
            <Suspense fallback={null}>
                <Hero3D />
            </Suspense>

            {/* Section header + controls */}
            <div className="section-header">
                <div>
                    <h1 className="section-title">Race Analysis</h1>
                    <div className="section-breadcrumb">
                        <span>{year}</span> / Lap times, positions &amp; telemetry
                    </div>
                </div>
                <div className="section-controls">
                    <div className="field">
                        <label>Season</label>
                        <select onChange={(e) => setYear(parseInt(e.target.value))} value={year}>
                            {seasons.map(season => (
                                <option key={season} value={season}>{season}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Race</label>
                        <select onChange={handleRaceSelect} value={selectedRace || ''}>
                            <option value="">Choose a race…</option>
                            {races.map(race => (
                                <option key={race.round} value={race.round}>
                                    R{race.round} — {race.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {availableSessions.length > 0 && (
                        <div className="field">
                            <label>Session</label>
                            <div className="toggle-group">
                                {availableSessions.map(session => (
                                    <button
                                        key={session.code}
                                        className={`toggle-btn${sessionType === session.code ? ' active' : ''}`}
                                        onClick={() => handleSessionChange(session.code)}
                                    >
                                        {session.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="error-message"><strong>Error:</strong> {error}</div>}

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    Loading session data…
                    <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                        First load may take 30–60 seconds
                    </div>
                </div>
            )}

            {drivers.length > 0 && (
                <div className="surface">
                    <h3 className="panel-title">Drivers — click to compare / view telemetry</h3>
                    <div className="driver-pills-row">
                        {drivers.map(driver => {
                            const driverResult = sessionData?.results.find(r => r.driver === driver.code)
                            const status = driverResult ? getDriverStatus(driverResult.status) : 'unknown'
                            const statusLabel = driverResult ? getStatusLabel(driverResult.status) : ''
                            const isSelected = selectedDrivers.includes(driver.code)
                            return (
                                <div
                                    key={driver.code}
                                    className={`driver-pill${isSelected ? ' selected' : ''}`}
                                    onClick={() => handleDriverClick(driver.code)}
                                    title={statusLabel || driver.team}
                                >
                                    <span
                                        className="driver-pill-dot"
                                        style={{ backgroundColor: driver.team_color || 'var(--text-secondary)' }}
                                    />
                                    <span className="driver-pill-code">{driver.code}</span>
                                    <span className="driver-pill-team">{driver.team}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {sessionData && !loading && (
                <>
                    <StatsRow sessionData={sessionData} sessionType={sessionType} />

                    {selectedDriverTelemetry && (
                        <div className="surface">
                            <h3 className="panel-title">
                                Telemetry — {telemetryDriver}
                                <span style={{ color: 'var(--text-accent)', fontFamily: 'Space Mono, monospace' }}>
                                    {formatLapTime(selectedDriverTelemetry.lap_time)}
                                </span>
                            </h3>
                            <TelemetryChart
                                telemetryData={selectedDriverTelemetry.telemetry}
                                driverCode={telemetryDriver}
                            />
                        </div>
                    )}

                    <div className="charts-grid">
                        <div className="surface">
                            <h3 className="panel-title">Position Throughout Session</h3>
                            <PositionChart raceData={sessionData} selectedDrivers={selectedDrivers} />
                        </div>
                        <div className="surface">
                            <h3 className="panel-title">Lap Time Progression</h3>
                            <LapTimeChart raceData={sessionData} selectedDrivers={selectedDrivers} />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function StatsRow({ sessionData, sessionType }) {
    const stats = useMemo(() => {
        const validLaps = sessionData.laps.filter(lap => lap.lap_time !== null)
        if (validLaps.length === 0) return null
        const fastestLap = validLaps.reduce((min, lap) => lap.lap_time < min.lap_time ? lap : min)
        const winner = sessionData.results.find(r => r.position === 1) || sessionData.results[0]
        const sessionNames = {
            R: 'Race', Q: 'Qualifying', S: 'Sprint', SQ: 'Sprint Qualifying',
            FP1: 'Practice 1', FP2: 'Practice 2', FP3: 'Practice 3',
        }
        return { fastestLap, winner, sessionName: sessionNames[sessionType] || 'Session' }
    }, [sessionData, sessionType])

    if (!stats) return null

    return (
        <div className="stats-row">
            <div className="stat-tile">
                <div className="stat-label">{stats.sessionName} Winner</div>
                <div className="stat-value large">{stats.winner.driver}</div>
                <div className="stat-sub">{stats.winner.driver_name}</div>
            </div>
            <div className="stat-tile">
                <div className="stat-label">Fastest Lap</div>
                <div className="stat-value">{formatLapTime(stats.fastestLap.lap_time)}</div>
                <div className="stat-sub">{stats.fastestLap.driver}</div>
            </div>
            <div className="stat-tile">
                <div className="stat-label">Total Laps</div>
                <div className="stat-value">{sessionData.total_laps}</div>
                <div className="stat-sub">{sessionData.session.name}</div>
            </div>
            <div className="stat-tile">
                <div className="stat-label">Location</div>
                <div className="stat-value large">{sessionData.session.location}</div>
                <div className="stat-sub">{sessionData.session.country}</div>
            </div>
        </div>
    )
}
