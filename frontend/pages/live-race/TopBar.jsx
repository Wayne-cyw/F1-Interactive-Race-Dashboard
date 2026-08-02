import { STATUS_META } from './trackStatus'

const WEATHER_LABEL = (rainfall) => rainfall
    ? { color: 'oklch(50% .16 230)', text: 'WET' }
    : { color: 'oklch(48% .13 155)', text: 'DRY' }

export default function TopBar({ seasons, races, year, round, onSelectYear, onSelectRace, weather, raceName, trackStatus }) {
    const weatherInfo = weather ? WEATHER_LABEL(weather.rainfall) : null
    const statusMeta = trackStatus ? (STATUS_META[trackStatus.status] ?? STATUS_META['1']) : null

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: '1px solid #e6e3dc', background: '#fff', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <select
                        value={round ?? ''}
                        onChange={e => onSelectRace(Number(e.target.value))}
                        aria-label="Select race"
                        style={{
                            appearance: 'none',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 19,
                            fontFamily: 'Inter, sans-serif',
                            color: '#191b1e',
                            padding: '2px 22px 2px 2px',
                        }}
                    >
                        {races.map(r => (
                            <option key={r.round} value={r.round}>{r.name}</option>
                        ))}
                    </select>
                    <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#a8a49b' }}>▾</span>
                </div>

                <select
                    value={year ?? ''}
                    onChange={e => onSelectYear(Number(e.target.value))}
                    aria-label="Select season"
                    style={{
                        border: '1px solid #e6e3dc',
                        borderRadius: 10,
                        background: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'Inter, sans-serif',
                        color: '#5c5852',
                        padding: '4px 8px',
                    }}
                >
                    {seasons.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                {statusMeta && (
                    <div style={{ padding: '4px 10px', borderRadius: 10, background: '#f2f0ea', fontSize: 11, fontWeight: 600, color: statusMeta.color }}>
                        {statusMeta.label}
                    </div>
                )}
                {weatherInfo && (
                    <div style={{ display: 'flex', gap: 22, fontSize: 13, color: '#5c5852' }}>
                        <div>Track <b style={{ color: '#191b1e' }}>{Math.round(weather.track_temp)}°C</b></div>
                        <div>Air <b style={{ color: '#191b1e' }}>{Math.round(weather.air_temp)}°C</b></div>
                        <div style={{ color: weatherInfo.color }}>{weatherInfo.text}</div>
                    </div>
                )}
            </div>
        </div>
    )
}
