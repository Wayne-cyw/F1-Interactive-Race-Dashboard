// Below this width, only the driver name and gap are shown — position,
// last-lap time, and tire+age drop out to avoid cramming/wrapping.
const COMPACT_WIDTH_THRESHOLD = 380

export default function Leaderboard({ drivers, onSelectDriver, width }) {
    const compact = width < COMPACT_WIDTH_THRESHOLD
    const columns = compact ? '1fr 64px' : '26px 1fr 64px 76px 54px'

    return (
        <div style={{ padding: '16px 0', overflowY: 'auto', minHeight: 0 }}>
            <div style={{ padding: '0 32px 8px', fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600 }}>LEADERBOARD</div>
            {drivers.map(d => (
                <div
                    key={d.id}
                    onClick={() => onSelectDriver(d.id)}
                    style={{ display: 'grid', gridTemplateColumns: columns, gap: 10, padding: '7px 32px', alignItems: 'center', cursor: 'pointer', background: d.rowBg, borderLeft: `3px solid ${d.rowAccent}` }}
                >
                    {!compact && <div style={{ fontWeight: 700, color: d.posColor }}>{d.pos}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: 4, height: 16, background: d.color, borderRadius: 2, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8b8880' }}>{d.gap}</div>
                    {!compact && <div style={{ fontSize: 12, color: '#403c36', fontFamily: "'JetBrains Mono', monospace" }}>{d.last}</div>}
                    {!compact && <div style={{ fontSize: 11, color: d.tireColor }}>{d.tire}·{d.age}</div>}
                </div>
            ))}
        </div>
    )
}
