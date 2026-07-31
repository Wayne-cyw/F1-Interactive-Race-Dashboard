import { useState, useEffect } from 'react'
import { API_URL, formatTemp } from '../../utils/helpers'

export default function WeatherWidget({ year, race }) {
    const [weather, setWeather] = useState(null)

    useEffect(() => {
        if (!year || !race) return
        fetch(`${API_URL}/weather/${year}/${race}`)
            .then(res => res.json())
            .then(data => data.status === 'success' && setWeather(data.weather))
            .catch(console.error)
    }, [year, race])

    if (!weather) return null

    const items = [
        { label: 'Air Temp',   value: formatTemp(weather.air_temp),        show: weather.air_temp !== null },
        { label: 'Track Temp', value: formatTemp(weather.track_temp),       show: weather.track_temp !== null },
        { label: 'Humidity',   value: `${Math.round(weather.humidity)}%`,   show: weather.humidity !== null },
        {
            label: 'Rain',
            value: weather.rainfall ? 'Yes' : 'No',
            color: weather.rainfall ? 'var(--red)' : 'var(--green)',
            show: weather.rainfall !== null,
        },
    ]

    return (
        <div className="surface">
            <h3 className="panel-title">Weather</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {items.filter(i => i.show).map(item => (
                    <div key={item.label} style={{
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {item.label}
                        </div>
                        <strong style={{
                            fontSize: '13px',
                            fontFamily: 'Space Mono, monospace',
                            color: item.color || 'var(--text-data)',
                        }}>
                            {item.value}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    )
}
