import { useState, useEffect, useCallback, useRef } from 'react'
import { API_URL, formatLapTime } from '../utils/helpers'
import { TelemetryChart } from '../components/Charts'
import AlertsBox from '../components/live/AlertsBox'
import LiveStandings from '../components/live/LiveStandings'
import PitStopTracker from '../components/live/PitStopTracker'
import WeatherWidget from '../components/live/WeatherWidget'
import TrackStatus from '../components/live/TrackStatus'
import Track3DCanvas from '../three/Track3DCanvas'

function CameraControls({ cameraMode, onCameraMode }) {
    const modes = [
        { key: 'OVERVIEW',  label: '🌍 Overview'  },
        { key: 'FOLLOW',    label: '🏎 Follow'     },
        { key: 'CINEMATIC', label: '🎬 Cinematic'  },
    ]
    return (
        <div className="cam-controls">
            {modes.map(({ key, label }) => (
                <button
                    key={key}
                    className={`cam-btn${cameraMode === key ? ' active' : ''}`}
                    onClick={() => onCameraMode(key)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

export default function LiveRace() {
    const [seasons, setSeasons] = useState([])
    const [year, setYear] = useState(2024)
    const [races, setRaces] = useState([])
    const [selectedRace, setSelectedRace] = useState(null)
    const [sessionData, setSessionData] = useState(null)
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [telemetryData, setTelemetryData] = useState(null)
    const [loadingTelemetry, setLoadingTelemetry] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [alerts, setAlerts] = useState([])
    const [currentLap, setCurrentLap] = useState(1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [vscActive, setVscActive] = useState(false)
    const [cameraMode, setCameraMode] = useState('OVERVIEW')
    const prevPositions = useRef({})
    const animationFrame = useRef(null)

    useEffect(() => {
        fetch(`${API_URL}/seasons`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setSeasons(data.seasons))
            .catch(console.error)
    }, [])

    useEffect(() => {
        if (!year) return
        fetch(`${API_URL}/races/${year}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setRaces(data.races))
            .catch(console.error)
    }, [year])

    const addAlert = useCallback((message, type) => {
        const colorMap = {
            overtake: 'var(--yellow)',
            pitstop:  'var(--accent)',
            vsc:      'var(--yellow)',
            success:  'var(--green)',
        }
        const newAlert = {
            id: Date.now() + Math.random(),
            message,
            type,
            color: colorMap[type] || 'var(--green)',
        }
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)])
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 5000)
    }, [])

    const loadRaceData = useCallback(() => {
        if (!year || !selectedRace) return
        setLoading(true)
        setError(null)
        setTelemetryData(null)
        setSelectedDriver(null)
        setAlerts([])
        setCurrentLap(1)
        setProgress(0)
        setIsPlaying(false)
        fetch(`${API_URL}/session/${year}/${selectedRace}/R`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setSessionData(data)
                else setError(data.message)
                setLoading(false)
            })
            .catch(() => { setError('Failed to load race data.'); setLoading(false) })
    }, [year, selectedRace])

    const loadTelemetry = useCallback((driverCode) => {
        if (!year || !selectedRace || !driverCode) return
        setSelectedDriver(driverCode)
        setTelemetryData(null)
        setLoadingTelemetry(true)
        fetch(`${API_URL}/telemetry/${year}/${selectedRace}/R/${driverCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setTelemetryData(data)
                setLoadingTelemetry(false)
            })
            .catch(err => { console.error('Telemetry error:', err); setLoadingTelemetry(false) })
    }, [year, selectedRace])

    // Animation loop — 0.6 laps/second
    useEffect(() => {
        if (!isPlaying || !sessionData) return
        const maxLaps = sessionData.total_laps || 50
        let lastTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const delta = (now - lastTime) / 1000
            lastTime = now
            setProgress(prev => {
                const next = prev + delta * 0.6
                if (next >= 1) {
                    setCurrentLap(lap => {
                        if (lap >= maxLaps) { setIsPlaying(false); return lap }
                        return lap + 1
                    })
                    return 0
                }
                return next
            })
            animationFrame.current = requestAnimationFrame(animate)
        }

        animationFrame.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame.current)
    }, [isPlaying, sessionData])

    // VSC simulation
    useEffect(() => {
        if (!isPlaying || currentLap < 10) return
        if (currentLap === 12 && Math.random() > 0.5) {
            setVscActive(true)
            addAlert('Virtual Safety Car deployed!', 'vsc')
            setTimeout(() => {
                setVscActive(false)
                addAlert('Track clear — Racing resumed', 'success')
            }, 5000)
        }
    }, [currentLap, isPlaying, addAlert])

    const handleDriverSelect = useCallback((driverCode) => {
        setSelectedDriver(driverCode)
        setCameraMode('FOLLOW')
        loadTelemetry(driverCode)
    }, [loadTelemetry])

    const fastestLap = sessionData?.laps?.filter(l => l.lap_time !== null).reduce(
        (min, lap) => lap.lap_time < min.lap_time ? lap : min,
        { lap_time: Infinity }
    )

    return (
        <div className="fade-in">
            {/* Header + controls row */}
            <div className="section-header">
                <div>
                    <h1 className="section-title">Live Race Monitor</h1>
                    <div className="section-breadcrumb">
                        3D circuit · all 20 drivers · real-time standings
                    </div>
                </div>
                <div className="section-controls">
                    <div className="field">
                        <label>Season</label>
                        <select onChange={(e) => setYear(parseInt(e.target.value))} value={year}>
                            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Race</label>
                        <select onChange={(e) => setSelectedRace(parseInt(e.target.value))} value={selectedRace || ''}>
                            <option value="">Choose a race…</option>
                            {races.map(r => (
                                <option key={r.round} value={r.round}>R{r.round} — {r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>&nbsp;</label>
                        <button className="btn btn-primary" onClick={loadRaceData} disabled={!selectedRace || loading}>
                            Load Race
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="error-message"><strong>Error:</strong> {error}</div>}

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    Loading race data…
                    <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                        First load may take 30–60 seconds
                    </div>
                </div>
            )}

            {sessionData && !loading && (
                <>
                    {/* Stat tiles row */}
                    <div className="stats-row">
                        <div className="stat-tile">
                            <div className="stat-label">Race</div>
                            <div className="stat-value large">{sessionData.session.location}</div>
                            <div className="stat-sub">{sessionData.session.name}</div>
                        </div>
                        <div className="stat-tile">
                            <div className="stat-label">Winner</div>
                            <div className="stat-value large">{sessionData.results[0]?.driver || 'N/A'}</div>
                            <div className="stat-sub">{sessionData.results[0]?.driver_name}</div>
                        </div>
                        <div className="stat-tile">
                            <div className="stat-label">Total Laps</div>
                            <div className="stat-value">{sessionData.total_laps}</div>
                            <div className="stat-sub">Completed</div>
                        </div>
                        <div className="stat-tile">
                            <div className="stat-label">Fastest Lap</div>
                            <div className="stat-value">
                                {fastestLap?.lap_time < Infinity ? formatLapTime(fastestLap.lap_time) : '--:--.---'}
                            </div>
                            <div className="stat-sub">{fastestLap?.driver || ''}</div>
                        </div>
                    </div>

                    {/* 3D canvas + overlay */}
                    <div className="surface" style={{ padding: 0 }}>
                        {/* Lap counter + playback controls */}
                        <div className="live-controls-bar">
                            <div className="live-lap-counter">
                                Lap {currentLap}
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {sessionData.total_laps}</span>
                                <span className="live-lap-progress">{Math.round(progress * 100)}%</span>
                            </div>
                            <div className="live-playback-btns">
                                <button
                                    className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={() => {
                                        if (currentLap >= sessionData.total_laps) { setCurrentLap(1); setProgress(0) }
                                        setIsPlaying(p => !p)
                                    }}
                                >
                                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => { setIsPlaying(false); setCurrentLap(1); setProgress(0); setVscActive(false) }}
                                >
                                    ↺ Reset
                                </button>
                            </div>
                        </div>

                        {/* 3D canvas + floating panels */}
                        <div className="track-canvas-wrap" style={{ borderRadius: 0, border: 'none' }}>
                            <Track3DCanvas
                                year={year}
                                race={selectedRace}
                                sessionData={sessionData}
                                currentLap={currentLap}
                                progress={progress}
                                selectedDriver={selectedDriver}
                                onDriverSelect={handleDriverSelect}
                                cameraMode={cameraMode}
                                prevPositions={prevPositions}
                                onAlert={addAlert}
                            />
                            <CameraControls cameraMode={cameraMode} onCameraMode={setCameraMode} />
                            <div className="live-overlay-panels">
                                <TrackStatus vscActive={vscActive} />
                                <WeatherWidget year={year} race={selectedRace} />
                                <AlertsBox alerts={alerts} />
                                <LiveStandings sessionData={sessionData} currentLap={currentLap} progress={progress} />
                                <PitStopTracker year={year} race={selectedRace} currentLap={currentLap} onAlert={addAlert} />
                            </div>
                        </div>
                    </div>

                    {/* Driver selector */}
                    <div className="surface">
                        <h3 className="panel-title">Select driver for telemetry — or click a car in the 3D view</h3>
                        <div className="driver-pills-row">
                            {sessionData.results.map(driver => (
                                <div
                                    key={driver.driver}
                                    className={`driver-pill${selectedDriver === driver.driver ? ' selected' : ''}`}
                                    onClick={() => handleDriverSelect(driver.driver)}
                                >
                                    <span
                                        className="driver-pill-dot"
                                        style={{ backgroundColor: driver.team_color || 'var(--text-secondary)' }}
                                    />
                                    <span className="driver-pill-code">{driver.driver}</span>
                                    <span className="driver-pill-team">{driver.team}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Telemetry */}
                    {loadingTelemetry && (
                        <div className="surface" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loading-spinner"></div>
                            <div style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>
                                Loading telemetry for {selectedDriver}…
                            </div>
                        </div>
                    )}

                    {telemetryData && !loadingTelemetry && (
                        <div className="surface">
                            <h3 className="panel-title">
                                Telemetry — {selectedDriver}
                                <span style={{ color: 'var(--text-accent)', fontFamily: 'Space Mono, monospace' }}>
                                    &nbsp;Lap {telemetryData.lap_number} ({formatLapTime(telemetryData.lap_time)})
                                </span>
                            </h3>
                            <TelemetryChart telemetryData={telemetryData.telemetry} driverCode={selectedDriver} />
                        </div>
                    )}
                </>
            )}

            {!sessionData && !loading && !error && (
                <div className="surface">
                    <div className="empty-state">
                        <div className="empty-state-icon">◈</div>
                        <h3>No Race Loaded</h3>
                        <p>Select a season and race above, then click Load Race to view the 3D visualization.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
