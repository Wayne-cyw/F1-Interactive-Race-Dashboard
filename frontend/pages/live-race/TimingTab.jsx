import { LABEL, MONO } from './ui'

const COLUMNS = '36px 1.4fr 90px 90px 90px 70px 70px 70px 70px 60px'

export default function TimingTab({ drivers, onSelectDriver }) {
    return (
        <div style={{ padding: 'var(--space-4) var(--space-6)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...LABEL, marginBottom: 'var(--space-3)' }}>02 · Full timing sheet</div>
            <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 8, padding: '8px 12px', ...LABEL, borderBottom: '1px solid var(--line)' }}>
                <div>POS</div><div>DRIVER</div><div>GAP</div><div>BEST</div><div>LAST</div><div>S1</div><div>S2</div><div>S3</div><div>TIRE</div><div>PITS</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {drivers.map(d => (
                    <div
                        key={d.id}
                        onClick={() => onSelectDriver(d.id)}
                        style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 8, padding: '10px 12px', alignItems: 'center', cursor: 'pointer', background: d.rowBg, borderBottom: '1px solid var(--line)', ...MONO, fontSize: 13 }}
                    >
                        <div style={{ fontWeight: 600, color: d.posColor }}>{d.pos}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)' }}>
                            <div style={{ width: 4, height: 14, background: d.color, borderRadius: 'var(--radius-xs)' }} />
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                            <span style={{ ...LABEL, letterSpacing: '.06em' }}>{d.team}</span>
                        </div>
                        <div style={{ color: 'var(--ink-muted)' }}>{d.gap}</div>
                        <div>{d.best}</div>
                        <div>{d.last}</div>
                        <div>{d.s1}</div>
                        <div>{d.s2}</div>
                        <div>{d.s3}</div>
                        <div style={{ color: d.tireColor, fontWeight: 600 }}>{d.tire}·{d.age}</div>
                        <div>{d.pits}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
