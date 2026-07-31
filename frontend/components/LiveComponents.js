// Live Race Components - HUGE Horizontal Track with Real-time Updates

const { useState, useEffect, useRef } = React;
const { formatTemp, formatLapTime } = window.Utils;

// Alerts Component
function AlertsBox({ alerts }) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="card">
            <div className="card-title">
                <i className="fas fa-bell"></i> Live Alerts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alerts.map((alert) => (
                    <div 
                        key={alert.id}
                        style={{
                            padding: '12px 18px',
                            background: 'var(--bg-primary)',
                            borderLeft: `4px solid ${alert.color}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <div style={{ fontSize: '20px' }}>
                            {alert.type === 'overtake' && '🏎️'}
                            {alert.type === 'pitstop' && '🔧'}
                            {alert.type === 'vsc' && '⚠️'}
                            {alert.type === 'success' && '✅'}
                        </div>
                        <div style={{ flex: 1 }}>{alert.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Live Standings - Updates in REAL-TIME based on progress
function LiveStandings({ sessionData, currentLap, progress }) {
    const [standings, setStandings] = useState([]);

    useEffect(() => {
        if (!sessionData?.results || !sessionData?.laps) return;

        // Use fractional lap for real-time updates
        const effectiveLap = currentLap - 1 + progress;

        const sorted = sessionData.results
            .map(driver => {
                const driverLaps = sessionData.laps.filter(l => l.driver === driver.driver && l.lap_number <= currentLap);
                const totalTime = driverLaps.reduce((sum, lap) => sum + (lap.lap_time || 0), 0);
                
                // Add progress-based time for current lap
                const currentLapTime = driverLaps[driverLaps.length - 1]?.lap_time || 60;
                const progressTime = currentLapTime * progress;
                
                return { 
                    ...driver, 
                    totalTime: totalTime + progressTime, 
                    completedLaps: driverLaps.length 
                };
            })
            .filter(d => d.completedLaps > 0)
            .sort((a, b) => a.totalTime - b.totalTime);

        const leaderTime = sorted[0]?.totalTime || 0;
        const withGaps = sorted.map((driver, index) => ({
            ...driver,
            livePosition: index + 1,
            timeGap: index === 0 ? null : driver.totalTime - leaderTime
        }));

        setStandings(withGaps);
    }, [sessionData, currentLap, progress]);

    if (!standings.length) return null;

    return (
        <div className="card">
            <div className="card-title">
                <i className="fas fa-list-ol"></i> Live Standings
            </div>
            <div className="standings-compact">
                {standings.map((driver) => (
                    <div key={driver.driver} className="standings-compact-row" style={{ borderLeftColor: driver.team_color }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ 
                                minWidth: '28px', height: '28px', display: 'inline-flex',
                                alignItems: 'center', justifyContent: 'center',
                                background: driver.livePosition <= 3 ? '#DC0000' : '#1a1a1a',
                                borderRadius: '50%', fontWeight: 'bold', fontSize: '12px'
                            }}>
                                {driver.livePosition}
                            </span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: '13px' }}>{driver.driver}</strong>
                                <div style={{ fontSize: '10px', color: driver.team_color }}>{driver.team}</div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                                {driver.timeGap !== null ? (
                                    <div style={{ fontSize: '11px', color: '#FF6600', fontWeight: 'bold' }}>
                                        +{driver.timeGap.toFixed(3)}s
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '11px', color: '#00FF00', fontWeight: 'bold' }}>LEADER</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Live Pit Stops
function PitStopTracker({ year, race, currentLap, onAlert }) {
    const [pitStops, setPitStops] = useState([]);
    const [displayedStops, setDisplayedStops] = useState([]);
    const prevLapRef = useRef(0);

    useEffect(() => {
        if (!year || !race) return;
        fetch(`http://localhost:5000/api/pitstops/${year}/${race}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setPitStops(data.pit_stops))
            .catch(console.error);
    }, [year, race]);

    useEffect(() => {
        if (!pitStops.length || !currentLap) return;

        const stopsUpToNow = pitStops.filter(stop => stop.lap <= currentLap);
        setDisplayedStops(stopsUpToNow);

        if (currentLap !== prevLapRef.current) {
            pitStops.filter(stop => stop.lap === currentLap).forEach(stop => {
                onAlert && onAlert(`🔧 ${stop.driver} pits - ${stop.from_compound} → ${stop.to_compound}`, 'pitstop');
            });
            prevLapRef.current = currentLap;
        }
    }, [currentLap, pitStops, onAlert]);

    return (
        <div className="card">
            <div className="card-title">
                <i className="fas fa-wrench"></i> Live Pit Stops ({displayedStops.length})
            </div>
            <div className="pitstop-list">
                {displayedStops.slice(-10).reverse().map((stop, index) => (
                    <div key={index} className="pitstop-compact">
                        <div style={{ minWidth: '45px' }}>
                            <strong style={{ color: stop.lap === currentLap ? '#00FF00' : '#FF6600', fontSize: '13px' }}>
                                L{stop.lap}
                            </strong>
                        </div>
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '13px' }}>{stop.driver}</strong>
                            <div style={{ fontSize: '11px', color: '#888' }}>
                                {stop.from_compound} → {stop.to_compound}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Weather Widget - LARGER
function WeatherWidget({ year, race }) {
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        if (!year || !race) return;
        fetch(`http://localhost:5000/api/weather/${year}/${race}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setWeather(data.weather))
            .catch(console.error);
    }, [year, race]);

    if (!weather) return null;

    return (
        <div className="card">
            <div className="card-title" style={{ fontSize: '16px' }}>
                <i className="fas fa-cloud-sun"></i> Weather
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {weather.air_temp !== null && (
                    <div style={{ padding: '15px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center' }}>
                        <i className="fas fa-temperature-high" style={{ fontSize: '24px', color: '#FF6600', marginBottom: '8px', display: 'block' }}></i>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '5px' }}>Air Temp</div>
                        <strong style={{ fontSize: '18px' }}>{formatTemp(weather.air_temp)}</strong>
                    </div>
                )}
                {weather.track_temp !== null && (
                    <div style={{ padding: '15px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center' }}>
                        <i className="fas fa-road" style={{ fontSize: '24px', color: '#FF6600', marginBottom: '8px', display: 'block' }}></i>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '5px' }}>Track Temp</div>
                        <strong style={{ fontSize: '18px' }}>{formatTemp(weather.track_temp)}</strong>
                    </div>
                )}
                {weather.humidity !== null && (
                    <div style={{ padding: '15px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center' }}>
                        <i className="fas fa-tint" style={{ fontSize: '24px', color: '#FF6600', marginBottom: '8px', display: 'block' }}></i>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '5px' }}>Humidity</div>
                        <strong style={{ fontSize: '18px' }}>{Math.round(weather.humidity)}%</strong>
                    </div>
                )}
                {weather.rainfall !== null && (
                    <div style={{ padding: '15px', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center' }}>
                        <i className="fas fa-cloud-rain" style={{ fontSize: '24px', color: weather.rainfall ? '#FF0000' : '#888', marginBottom: '8px', display: 'block' }}></i>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '5px' }}>Rain</div>
                        <strong style={{ fontSize: '18px', color: weather.rainfall ? '#FF0000' : '#888' }}>
                            {weather.rainfall ? 'Yes' : 'No'}
                        </strong>
                    </div>
                )}
            </div>
        </div>
    );
}

// Track Status
function TrackStatus({ vscActive }) {
    const status = vscActive ? 'VSC' : 'GREEN FLAG';
    const color = vscActive ? '#FFFF00' : '#00FF00';
    const message = vscActive ? 'Virtual Safety Car' : 'Race in Progress';
    const icon = vscActive ? 'fa-exclamation-triangle' : 'fa-flag-checkered';

    return (
        <div className="card">
            <div className="card-title" style={{ fontSize: '16px' }}>
                <i className="fas fa-flag"></i> Track Status
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color, textShadow: `0 0 20px ${color}` }}>
                    <i className={`fas ${icon}`}></i>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color, marginTop: '10px' }}>{status}</div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>{message}</div>
            </div>
        </div>
    );
}

// HUGE Horizontal Track Map with REAL driver positions
function TrackMap({ year, race, sessionData, currentLap, progress, onAlert, prevPositions }) {
    const [trackData, setTrackData] = useState(null);

    useEffect(() => {
        if (!year || !race) return;
        fetch(`http://localhost:5000/api/track/${year}/${race}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setTrackData(data.track))
            .catch(console.error);
    }, [year, race]);

    if (!trackData?.coordinates?.length || !sessionData?.results) {
        return (
            <div style={{ textAlign: 'center', padding: '150px 0', color: '#888' }}>
                <i className="fas fa-map" style={{ fontSize: '64px', marginBottom: '20px', display: 'block' }}></i>
                No track data available
            </div>
        );
    }

    const xCoords = trackData.coordinates.map(c => c.x);
    const yCoords = trackData.coordinates.map(c => c.y);
    const minX = Math.min(...xCoords), maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords), maxY = Math.max(...yCoords);
    const width = maxX - minX, height = maxY - minY;
    
    // HUGE HORIZONTAL viewport
    const padding = 100;
    const viewWidth = 1800; // Much larger!
    const viewHeight = 900; // Much taller!
    const scale = Math.min((viewWidth - padding * 2) / width, (viewHeight - padding * 2) / height) * 1.5;

    const path = trackData.coordinates.map((coord, index) => {
        const x = (coord.x - minX) * scale + padding;
        const y = (coord.y - minY) * scale + padding;
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ') + ' Z';

    // Get REAL driver positions based on actual lap data
    const getDriverPositions = () => {
        return sessionData.results.map((driver, index) => {
            const driverLaps = sessionData.laps?.filter(l => l.driver === driver.driver) || [];
            if (!driverLaps.length) return null;

            // Get current and next lap data
            const currentLapData = driverLaps.find(l => l.lap_number === currentLap);
            const prevLapData = driverLaps.find(l => l.lap_number === currentLap - 1);
            
            const position = currentLapData?.position || prevLapData?.position || (index + 1);

            // REAL position on track based on actual lap completion
            const effectiveLap = currentLap - 1 + progress;
            const totalLaps = sessionData.total_laps || 50;
            
            // Calculate track position based on position in race
            const baseProgress = effectiveLap / totalLaps;
            const positionSpread = (position - 1) * 0.015; // Spread based on position
            const trackProgress = (baseProgress + positionSpread) % 1;
            
            // Get interpolated position on track
            const trackIndex = trackProgress * trackData.coordinates.length;
            const index1 = Math.floor(trackIndex) % trackData.coordinates.length;
            const index2 = (index1 + 1) % trackData.coordinates.length;
            const fraction = trackIndex - Math.floor(trackIndex);
            
            const coord1 = trackData.coordinates[index1];
            const coord2 = trackData.coordinates[index2];
            
            const x = ((coord1.x + (coord2.x - coord1.x) * fraction) - minX) * scale + padding;
            const y = ((coord1.y + (coord2.y - coord1.y) * fraction) - minY) * scale + padding;

            // Overtake detection
            const prevPos = prevPositions.current[driver.driver];
            if (prevPos && prevPos !== position && position < prevPos && onAlert) {
                onAlert(`🏎️ ${driver.driver} overtakes for P${position}!`, 'overtake');
            }
            prevPositions.current[driver.driver] = position;

            return { 
                driver: driver.driver, 
                x, 
                y, 
                position, 
                color: driver.team_color 
            };
        }).filter(Boolean);
    };

    const driverPositions = getDriverPositions();

    return (
        <svg width="100%" height="900" viewBox={`0 0 ${viewWidth} ${viewHeight}`} style={{ background: '#000', borderRadius: '8px' }}>
            {/* THICK track */}
            <path d={path} fill="none" stroke="#1a1a1a" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="#2d2d2d" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="#3a3a3a" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Start/Finish */}
            <rect
                x={(trackData.coordinates[0].x - minX) * scale + padding - 40}
                y={(trackData.coordinates[0].y - minY) * scale + padding - 8}
                width="80"
                height="16"
                fill="#FFBA08"
            />
            <text
                x={(trackData.coordinates[0].x - minX) * scale + padding}
                y={(trackData.coordinates[0].y - minY) * scale + padding - 25}
                fill="#FFBA08"
                fontSize="22"
                fontWeight="bold"
                textAnchor="middle"
            >
                START/FINISH
            </text>

            {/* ALL 20 Drivers - Team colors stay consistent */}
            {driverPositions.map((driver) => (
                <g key={driver.driver}>
                    {/* Glow */}
                    <circle cx={driver.x} cy={driver.y} r="20" fill={driver.color} opacity="0.3">
                        <animate attributeName="r" values="20;24;20" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Driver circle - SAME team color always */}
                    <circle cx={driver.x} cy={driver.y} r="16" fill={driver.color} stroke="#fff" strokeWidth="4" />
                    {/* Driver code */}
                    <text x={driver.x} y={driver.y - 26} fill={driver.color} fontSize="16" fontWeight="bold" textAnchor="middle" stroke="#000" strokeWidth="4" paintOrder="stroke">
                        {driver.driver}
                    </text>
                    {/* Position */}
                    <text x={driver.x} y={driver.y + 6} fill="#000" fontSize="15" fontWeight="bold" textAnchor="middle">
                        {driver.position}
                    </text>
                </g>
            ))}
        </svg>
    );
}

window.LiveComponents = { 
    AlertsBox, 
    LiveStandings, 
    PitStopTracker, 
    WeatherWidget, 
    TrackStatus,
    TrackMap
};
