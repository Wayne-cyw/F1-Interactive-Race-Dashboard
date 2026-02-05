const { useState, useEffect, useRef, useMemo, useCallback } = React;

const API_URL = 'http://localhost:5000/api';

function RaceDashboard() {
    const [year, setYear] = useState(2024);
    const [races, setRaces] = useState([]);
    const [selectedRace, setSelectedRace] = useState(null);
    const [raceData, setRaceData] = useState(null);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        fetch(`${API_URL}/races/${year}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setRaces(data.races);
                } else {
                    setError(data.message);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setError('Cannot connect to backend. Make sure Flask is running on port 5000.');
                setLoading(false);
            });
    }, [year]);

    const fetchRaceData = useCallback((raceRound) => {
        setLoading(true);
        setError(null);
        
        // Fetch race data and drivers in parallel
        Promise.all([
            fetch(`${API_URL}/race/${year}/${raceRound}`).then(res => res.json()),
            fetch(`${API_URL}/drivers/${year}/${raceRound}`).then(res => res.json())
        ])
        .then(([raceResponse, driversResponse]) => {
            if (raceResponse.status === 'success') {
                setRaceData(raceResponse);
                if (raceResponse.results && raceResponse.results.length > 0) {
                    const topDrivers = raceResponse.results.slice(0, 3).map(d => d.driver);
                    setSelectedDrivers(topDrivers);
                }
            } else {
                setError(raceResponse.message);
            }
            
            if (driversResponse.status === 'success') {
                setDrivers(driversResponse.drivers);
            }
            
            setLoading(false);
        })
        .catch(err => {
            console.error('Error:', err);
            setError('Failed to load race data. First load may take 30-60 seconds.');
            setLoading(false);
        });
    }, [year]);

    const handleRaceSelect = useCallback((e) => {
        const raceRound = parseInt(e.target.value);
        setSelectedRace(raceRound);
        if (raceRound) {
            fetchRaceData(raceRound);
        }
    }, [fetchRaceData]);

    const toggleDriver = useCallback((driverCode) => {
        setSelectedDrivers(prev => 
            prev.includes(driverCode)
                ? prev.filter(d => d !== driverCode)
                : [...prev, driverCode]
        );
    }, []);

    return (
        <div className="container">
            <header>
                <h1>F1 Race Dashboard</h1>
                <div className="subtitle">Real-Time Telemetry Dashboard</div>
            </header>

            <div className="controls">
                <div className="control-group">
                    <label>Select Season</label>
                    <select onChange={(e) => setYear(parseInt(e.target.value))} value={year}>
                        <option value="2024">2024 Season</option>
                        <option value="2023">2023 Season</option>
                        <option value="2022">2022 Season</option>
                        <option value="2021">2021 Season</option>
                        <option value="2020">2020 Season</option>
                        <option value="2019">2019 Season</option>
                        <option value="2018">2018 Season</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Select Race</label>
                    <select onChange={handleRaceSelect} value={selectedRace || ''}>
                        <option value="">Choose a race...</option>
                        {races.map(race => (
                            <option key={race.round} value={race.round}>
                                Round {race.round}: {race.name}
                            </option>
                        ))}
                    </select>
                </div>

                {drivers.length > 0 && (
                    <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Select Drivers to Compare</label>
                        <div className="driver-selector">
                            {drivers.map(driver => (
                                <div
                                    key={driver.code}
                                    className={`driver-chip ${selectedDrivers.includes(driver.code) ? 'selected' : ''}`}
                                    onClick={() => toggleDriver(driver.code)}
                                    title={driver.name}
                                >
                                    {driver.code}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {loading && (
                <div className="loading">
                    LOADING RACE DATA...
                    <div className="loading-note">
                        First load may take 30-60 seconds while downloading data
                    </div>
                </div>
            )}

            {raceData && !loading && (
                <>
                    <StatsGrid raceData={raceData} />
                    <div className="dashboard">
                        <PositionChart 
                            raceData={raceData} 
                            selectedDrivers={selectedDrivers}
                        />
                        <LapTimeChart 
                            raceData={raceData} 
                            selectedDrivers={selectedDrivers}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function StatsGrid({ raceData }) {
    const stats = useMemo(() => {
        const validLaps = raceData.laps.filter(lap => lap.lap_time !== null);
        
        if (validLaps.length === 0) {
            return null;
        }

        const fastestLap = validLaps.reduce((min, lap) => 
            lap.lap_time < min.lap_time ? lap : min
        );

        const winner = raceData.results.find(r => r.position === 1) || raceData.results[0];
        
        return { fastestLap, winner };
    }, [raceData]);
    
    if (!stats) {
        return null;
    }

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-label">Race Winner</div>
                <div className="stat-value">{stats.winner.driver}</div>
                <div className="stat-label">{stats.winner.driver_name}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Fastest Lap</div>
                <div className="stat-value">{stats.fastestLap.lap_time.toFixed(3)}s</div>
                <div className="stat-label">{stats.fastestLap.driver}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Total Laps</div>
                <div className="stat-value">{raceData.total_laps}</div>
                <div className="stat-label">{raceData.race.name}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Location</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                    {raceData.race.location}
                </div>
                <div className="stat-label">{raceData.race.country}</div>
            </div>
        </div>
    );
}

function PositionChart({ raceData, selectedDrivers }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const datasets = useMemo(() => {
        if (!raceData || selectedDrivers.length === 0) return [];

        return selectedDrivers.map((driverCode, index) => {
            const driverLaps = raceData.laps
                .filter(lap => lap.driver === driverCode && lap.position !== null)
                .sort((a, b) => a.lap_number - b.lap_number);

            if (driverLaps.length === 0) return null;

            const colors = ['#e10600', '#ffd700', '#00ff00', '#0080ff', '#ff00ff', '#ff8000'];

            return {
                label: driverCode,
                data: driverLaps.map(lap => ({ x: lap.lap_number, y: lap.position })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '40',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
            };
        }).filter(d => d !== null);
    }, [raceData, selectedDrivers]);

    useEffect(() => {
        if (!chartRef.current || datasets.length === 0) return;

        const ctx = chartRef.current.getContext('2d');

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { 
                            display: true, 
                            text: 'Lap Number',
                            color: '#ffffff'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    y: {
                        reverse: true,
                        title: { 
                            display: true, 
                            text: 'Position',
                            color: '#ffffff'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#ffffff',
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { 
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                        titleColor: '#ffd700',
                        bodyColor: '#ffffff'
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [datasets]);

    return (
        <div className="chart-card">
            <h3>Position Throughout Race</h3>
            <div style={{ height: '400px' }}>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
}

function LapTimeChart({ raceData, selectedDrivers }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const datasets = useMemo(() => {
        if (!raceData || selectedDrivers.length === 0) return [];

        return selectedDrivers.map((driverCode, index) => {
            const driverLaps = raceData.laps
                .filter(lap => lap.driver === driverCode && lap.lap_time !== null)
                .sort((a, b) => a.lap_number - b.lap_number);

            if (driverLaps.length === 0) return null;

            const colors = ['#e10600', '#ffd700', '#00ff00', '#0080ff', '#ff00ff', '#ff8000'];

            return {
                label: driverCode,
                data: driverLaps.map(lap => ({ x: lap.lap_number, y: lap.lap_time })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '40',
                borderWidth: 3,
                tension: 0.2,
                pointRadius: 2,
                pointHoverRadius: 6,
            };
        }).filter(d => d !== null);
    }, [raceData, selectedDrivers]);

    useEffect(() => {
        if (!chartRef.current || datasets.length === 0) return;

        const ctx = chartRef.current.getContext('2d');

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { 
                            display: true, 
                            text: 'Lap Number',
                            color: '#ffffff'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    },
                    y: {
                        title: { 
                            display: true, 
                            text: 'Lap Time (seconds)',
                            color: '#ffffff'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ffffff' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { 
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.9)',
                        titleColor: '#ffd700',
                        bodyColor: '#ffffff',
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}s`;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [datasets]);

    return (
        <div className="chart-card">
            <h3>Lap Time Progression</h3>
            <div style={{ height: '400px' }}>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
}

ReactDOM.render(<RaceDashboard />, document.getElementById('root'));
