function StatTile({ label, value, unit }) {
    return (
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eeece6', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 10.5, color: '#a8a49b', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}{unit && <span style={{ fontSize: 12, color: '#a8a49b' }}> {unit}</span>}</div>
        </div>
    )
}

export default function TelemetryTab({ drivers, selected, onSelectDriver, speedPolyBig, throttlePolyBig, brakePolyBig, topSpeed, avgSpeed, drsCount }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1 }}>
            <div style={{ padding: '24px 0', borderRight: '1px solid #eeece6' }}>
                <div style={{ padding: '0 32px 12px', fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600 }}>SELECT DRIVER</div>
                {drivers.map(d => (
                    <div
                        key={d.id}
                        onClick={() => onSelectDriver(d.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 32px', cursor: 'pointer', background: d.rowBg, borderLeft: `3px solid ${d.rowAccent}` }}
                    >
                        <div style={{ width: 4, height: 14, background: d.color, borderRadius: 2 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
                    </div>
                ))}
            </div>

            <div style={{ padding: '24px 32px' }}>
                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 6 }}>TELEMETRY DEEP DIVE</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
                    {selected.name} <span style={{ fontSize: 13, color: '#a8a49b', fontWeight: 400 }}>{selected.team}</span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                    <StatTile label="TOP SPEED" value={topSpeed} unit="km/h" />
                    <StatTile label="AVG SPEED" value={avgSpeed} unit="km/h" />
                    <StatTile label="DRS ACTIVATIONS" value={drsCount} />
                    <StatTile label="CURRENT GEAR" value={selected.gear} />
                </div>

                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 8 }}>SPEED (km/h) · LAP TRACE</div>
                <svg viewBox="0 0 600 110" style={{ width: '100%', height: 150, background: '#fff', border: '1px solid #eeece6', borderRadius: 10 }}>
                    <polyline points={speedPolyBig} fill="none" stroke="oklch(50% .16 230)" strokeWidth="2.5" />
                </svg>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 8 }}>THROTTLE %</div>
                        <svg viewBox="0 0 600 70" style={{ width: '100%', height: 90, background: '#fff', border: '1px solid #eeece6', borderRadius: 10 }}>
                            <polyline points={throttlePolyBig} fill="none" stroke="oklch(48% .13 155)" strokeWidth="2" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 8 }}>BRAKE %</div>
                        <svg viewBox="0 0 600 70" style={{ width: '100%', height: 90, background: '#fff', border: '1px solid #eeece6', borderRadius: 10 }}>
                            <polyline points={brakePolyBig} fill="none" stroke="oklch(55% .18 25)" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
