import { STATUS_META } from './trackStatus'
import { ROUTES, linkTo } from '../../utils/navigation'
import { DISPLAY, LABEL, MONO, SELECT, TAG } from './ui'

const WEATHER_LABEL = (rainfall) => rainfall
    ? { color: 'var(--data-b)', text: 'WET' }
    : { color: 'var(--ink)', text: 'DRY' }

export default function TopBar({ seasons, races, year, round, onSelectYear, onSelectRace, weather, trackStatus }) {
    const weatherInfo = weather ? WEATHER_LABEL(weather.rainfall) : null
    const statusMeta = trackStatus ? (STATUS_META[trackStatus.status] ?? { label: trackStatus.message || 'UNKNOWN', color: 'var(--ink-muted)' }) : null

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-6)', borderBottom: '1px solid var(--line)', background: 'var(--surface-100)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <a href={ROUTES.landing} onClick={linkTo(ROUTES.landing)} aria-label="APEX home" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'inherit', textDecoration: 'none' }}>
                    <svg width="22" height="22" viewBox="0 0 30 30" fill="none" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                        <path d="M4 27 L15 13 L26 27" style={{ stroke: 'var(--ink)' }} />
                        <path d="M4 16 L15 2 L26 16" style={{ stroke: 'var(--brand)' }} />
                    </svg>
                    <span style={{ ...DISPLAY, fontSize: 16, letterSpacing: '.04em' }}>APEX</span>
                </a>
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
                            ...DISPLAY,
                            fontSize: 18,
                            color: 'var(--ink)',
                            minHeight: 44,
                            padding: '2px 26px 2px 2px',
                        }}
                    >
                        {races.map(r => (
                            <option key={r.round} value={r.round}>{r.name}</option>
                        ))}
                    </select>
                    <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: 'var(--ink-muted)' }}>▾</span>
                </div>

                <select
                    value={year ?? ''}
                    onChange={e => onSelectYear(Number(e.target.value))}
                    aria-label="Select season"
                    style={SELECT}
                >
                    {seasons.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                {statusMeta && (
                    <div style={{ ...TAG, color: statusMeta.color }}>
                        {statusMeta.label}
                    </div>
                )}
                {weatherInfo && (
                    <div style={{ display: 'flex', gap: 'var(--space-5)', ...LABEL }}>
                        <div>Track <b style={{ ...MONO, color: 'var(--ink)', fontWeight: 600 }}>{Math.round(weather.track_temp)}°C</b></div>
                        <div>Air <b style={{ ...MONO, color: 'var(--ink)', fontWeight: 600 }}>{Math.round(weather.air_temp)}°C</b></div>
                        <div style={{ color: weatherInfo.color }}>{weatherInfo.text}</div>
                    </div>
                )}
            </div>
        </div>
    )
}
