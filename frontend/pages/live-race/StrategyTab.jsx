const CURRENT_LAP_MARKER_PCT = 72.4

export default function StrategyTab({ drivers, pitLog }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1 }}>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 16 }}>TIRE STRATEGY · LAP 42/58</div>
                {drivers.map(d => (
                    <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 4, height: 14, background: d.color, borderRadius: 2 }} />
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
                        </div>
                        <div style={{ position: 'relative', height: 20, background: '#f2f0ea', borderRadius: 10, overflow: 'hidden' }}>
                            {d.stints.map((s, i) => (
                                <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${s.left}%`, width: `${s.pct}%`, background: s.clr }} />
                            ))}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${CURRENT_LAP_MARKER_PCT}%`, width: 2, background: '#191b1e' }} />
                        </div>
                    </div>
                ))}
                <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: '#8b8880' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#c23b3b' }} />Soft</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#d9a300' }} />Medium</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#6b6862' }} />Hard</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 2, height: 10, background: '#191b1e' }} />Current lap</div>
                </div>
            </div>

            <div style={{ padding: '24px 32px', borderLeft: '1px solid #eeece6' }}>
                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>PIT STOP LOG</div>
                {pitLog.map((p, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f2f0ea' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600 }}>
                            {p.driver}
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'oklch(48% .13 155)' }}>{p.dur}s</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#a8a49b', marginTop: 2 }}>Lap {p.lap} · {p.from} → {p.to}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
