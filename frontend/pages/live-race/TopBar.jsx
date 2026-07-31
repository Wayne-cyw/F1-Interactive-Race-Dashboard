const FLAG_BADGE = {
    green: { bg: '#f2f8f4', border: '#cfe9d6', dot: '#3ecf6e', color: 'oklch(45% .13 155)', label: 'GREEN FLAG' },
    vsc: { bg: '#fbf3de', border: '#f0dfa8', dot: '#d9a300', color: '#7a5a00', label: 'VIRTUAL SAFETY CAR' },
    sc: { bg: '#fbf3de', border: '#f0dfa8', dot: '#d9a300', color: '#7a5a00', label: 'SAFETY CAR' },
    red: { bg: '#fbe8e8', border: '#eec3c3', dot: '#c23b3b', color: '#8f2323', label: 'RED FLAG' },
    'pre-race': { bg: '#f2f0ea', border: '#e6e3dc', dot: '#8b8880', color: '#5c5852', label: 'FORMATION LAP' },
    'post-race': { bg: '#191b1e', border: '#191b1e', dot: '#fff', color: '#fff', label: 'CHEQUERED FLAG', dark: true },
}

const WEATHER_LABEL = {
    dry: { color: 'oklch(48% .13 155)', text: 'DRY · Rain 4%' },
    damp: { color: '#b98a00', text: 'DAMP · Rain 38%' },
    wet: { color: 'oklch(50% .16 230)', text: 'WET · Rain 82%' },
}

export default function TopBar({ raceName, currentLap, totalLaps, sessionClock, raceState, weather, trackTemp, airTemp }) {
    const flag = FLAG_BADGE[raceState] || FLAG_BADGE.green
    const weatherInfo = WEATHER_LABEL[weather] || WEATHER_LABEL.dry

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid #e6e3dc', background: '#fff', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 19 }}>{raceName}</div>
                <div style={{ fontSize: 13, color: '#8b8880' }}>Lap {currentLap} of {totalLaps}</div>
                <div style={{ fontSize: 12, color: '#a8a49b', fontFamily: "'JetBrains Mono', monospace" }}>SESSION {sessionClock}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: flag.dark ? '7px 18px' : '7px 18px', background: flag.bg, border: `1px solid ${flag.border}`, borderRadius: flag.dark ? 10 : 24 }}>
                <div style={{ width: 7, height: 7, borderRadius: flag.dark ? 0 : '50%', background: flag.dot }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: flag.color }}>{flag.label}</div>
            </div>

            <div style={{ display: 'flex', gap: 22, fontSize: 13, color: '#5c5852' }}>
                <div>Track <b style={{ color: '#191b1e' }}>{trackTemp}°C</b></div>
                <div>Air <b style={{ color: '#191b1e' }}>{airTemp}°C</b></div>
                <div style={{ color: weatherInfo.color }}>{weatherInfo.text}</div>
            </div>
        </div>
    )
}
