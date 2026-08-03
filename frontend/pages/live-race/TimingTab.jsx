const COLUMNS = '36px 1.4fr 90px 90px 90px 70px 70px 70px 70px 60px'

export default function TimingTab({ drivers, onSelectDriver }) {
    return (
        <div style={{ padding: '16px 32px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>FULL TIMING SHEET</div>
            <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 8, padding: '8px 12px', fontSize: 11, color: '#a8a49b', fontWeight: 600, borderBottom: '1px solid #e6e3dc' }}>
                <div>POS</div><div>DRIVER</div><div>GAP</div><div>BEST</div><div>LAST</div><div>S1</div><div>S2</div><div>S3</div><div>TIRE</div><div>PITS</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {drivers.map(d => (
                    <div
                        key={d.id}
                        onClick={() => onSelectDriver(d.id)}
                        style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 8, padding: '10px 12px', alignItems: 'center', cursor: 'pointer', background: d.rowBg, borderBottom: '1px solid #f2f0ea', fontFamily: "'Inconsolata', monospace", fontSize: 12.5 }}
                    >
                        <div style={{ fontWeight: 700, color: d.posColor }}>{d.pos}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inconsolata', sans-serif" }}>
                            <div style={{ width: 4, height: 14, background: d.color, borderRadius: 2 }} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                            <span style={{ fontSize: 10.5, color: '#a8a49b' }}>{d.team}</span>
                        </div>
                        <div style={{ color: '#8b8880' }}>{d.gap}</div>
                        <div>{d.best}</div>
                        <div>{d.last}</div>
                        <div>{d.s1}</div>
                        <div>{d.s2}</div>
                        <div>{d.s3}</div>
                        <div style={{ color: d.tireColor, fontWeight: 700 }}>{d.tire}·{d.age}</div>
                        <div style={{ color: '#403c36' }}>{d.pits}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
