import { useState, useEffect, lazy, Suspense } from 'react'
import { API_URL } from '../utils/helpers'

const Hero3D = lazy(() => import('../three/Hero3D'))

export default function Standings() {
    const [seasons, setSeasons] = useState([])
    const [year, setYear] = useState(2024)
    const [standingsData, setStandingsData] = useState(null)
    const [viewType, setViewType] = useState('drivers')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch(`${API_URL}/seasons`)
            .then(res => res.json())
            .then(data => { if (data.status === 'success') setSeasons(data.seasons) })
            .catch(err => console.error('Error:', err))
    }, [])

    useEffect(() => {
        if (!year) return
        setLoading(true)
        setError(null)
        fetch(`${API_URL}/standings/${year}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setStandingsData(data)
                else setError(data.message)
                setLoading(false)
            })
            .catch(() => { setError('Failed to load standings data.'); setLoading(false) })
    }, [year])

    return (
        <div className="fade-in">
            <Suspense fallback={null}>
                <Hero3D />
            </Suspense>

            <div className="section-header">
                <div>
                    <h1 className="section-title">Championship Standings</h1>
                    <div className="section-breadcrumb">
                        <span>{year}</span>
                        {standingsData && <> / After round {standingsData.last_race}</>}
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
                    {standingsData && (
                        <div className="toggle-group">
                            <button
                                className={`toggle-btn${viewType === 'drivers' ? ' active' : ''}`}
                                onClick={() => setViewType('drivers')}
                            >
                                Drivers
                            </button>
                            <button
                                className={`toggle-btn${viewType === 'constructors' ? ' active' : ''}`}
                                onClick={() => setViewType('constructors')}
                            >
                                Constructors
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="error-message"><strong>Error:</strong> {error}</div>}

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    Loading standings…
                </div>
            )}

            {standingsData && !loading && (
                <div className="surface">
                    {viewType === 'drivers'
                        ? <DriversStandings standings={standingsData.driver_standings} />
                        : <ConstructorsStandings standings={standingsData.team_standings} />
                    }
                </div>
            )}
        </div>
    )
}

function DriversStandings({ standings }) {
    return (
        <>
            <h3 className="panel-title">Driver Championship</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Driver</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((driver, index) => (
                        <tr key={driver.driver} className="standings-row">
                            <td>
                                <span className={`pos-num${index === 0 ? ' p1' : index === 1 ? ' p2' : index === 2 ? ' p3' : ''}`}>
                                    {driver.position}
                                </span>
                            </td>
                            <td>
                                <div className="driver-name-cell">
                                    <span
                                        className="team-dot"
                                        style={{ backgroundColor: driver.team_color || 'var(--text-secondary)' }}
                                    />
                                    <div>
                                        <div className="driver-full-name">{driver.name}</div>
                                        <div className="driver-abbr">{driver.driver}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ color: driver.team_color, fontSize: '13px' }}>{driver.team}</td>
                            <td className="points-cell">{driver.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

function ConstructorsStandings({ standings }) {
    return (
        <>
            <h3 className="panel-title">Constructor Championship</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th style={{ textAlign: 'right' }}>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((team, index) => (
                        <tr key={team.team} className="standings-row">
                            <td>
                                <span className={`pos-num${index === 0 ? ' p1' : index === 1 ? ' p2' : index === 2 ? ' p3' : ''}`}>
                                    {team.position}
                                </span>
                            </td>
                            <td>
                                <div className="driver-name-cell">
                                    <span
                                        className="team-dot"
                                        style={{ backgroundColor: team.color || 'var(--text-secondary)' }}
                                    />
                                    <span style={{ color: team.color, fontWeight: 600 }}>{team.team}</span>
                                </div>
                            </td>
                            <td className="points-cell">{team.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}
