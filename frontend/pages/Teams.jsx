import { useState, useEffect, lazy, Suspense } from 'react'
import { API_URL } from '../utils/helpers'

const Hero3D = lazy(() => import('../three/Hero3D'))

export default function Teams() {
    const [seasons, setSeasons] = useState([])
    const [year, setYear] = useState(2024)
    const [teams, setTeams] = useState([])
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
        fetch(`${API_URL}/teams/${year}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setTeams(data.teams)
                else setError(data.message)
                setLoading(false)
            })
            .catch(() => { setError('Failed to load teams data.'); setLoading(false) })
    }, [year])

    return (
        <div className="fade-in">
            <Suspense fallback={null}>
                <Hero3D />
            </Suspense>

            <div className="section-header">
                <div>
                    <h1 className="section-title">F1 Teams</h1>
                    <div className="section-breadcrumb">
                        <span>{year}</span> / Driver rosters
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
                </div>
            </div>

            {error && <div className="error-message"><strong>Error:</strong> {error}</div>}

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    Loading teams…
                </div>
            )}

            {!loading && teams.length > 0 && (
                <div className="teams-grid">
                    {teams.map(team => <TeamTile key={team.name} team={team} />)}
                </div>
            )}
        </div>
    )
}

function TeamTile({ team }) {
    return (
        <div
            className="team-tile"
            style={{ borderTopColor: team.color || 'var(--border-accent)' }}
        >
            <div
                className="team-tile-name"
                style={{ color: team.color || 'var(--text-primary)' }}
            >
                {team.name}
            </div>
            <div className="team-tile-drivers">
                {team.drivers.map(driver => (
                    <div key={driver.code} className="team-tile-driver">
                        <div>
                            <div
                                className="team-tile-driver-code"
                                style={{ color: team.color || 'var(--text-data)' }}
                            >
                                {driver.code}
                            </div>
                            <div className="team-tile-driver-name">{driver.name}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
