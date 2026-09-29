import ResizeHandle from './ResizeHandle'
import { useResizableWidth } from './useResizableWidth'
import { LABEL, MONO } from './ui'

export default function StrategyTab({ drivers, pitLog, currentLap, totalLaps }) {
    const [pitLogWidth, onPitLogResize] = useResizableWidth(340, { min: 260, max: 480, edge: 'left' })

    return (
        <div style={{ display: 'grid', gridTemplateColumns: `minmax(0, 1fr) 10px ${pitLogWidth}px`, gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
            <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ ...LABEL, marginBottom: 'var(--space-4)' }}>Tyre strategy · Lap {currentLap}/{totalLaps}</div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {drivers.map(d => (
                        <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 4, height: 14, background: d.color, borderRadius: 'var(--radius-xs)' }} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                            </div>
                            <div style={{ position: 'relative', height: 16, background: 'var(--surface-200)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                                {d.stints.map((s, i) => (
                                    <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${s.left}%`, width: `${s.pct}%`, background: s.clr, borderRadius: 'var(--radius-xs)', boxShadow: 'inset -3px 0 0 var(--surface-000)' }}>
                                        {s.pct > 6 && <span style={{ ...MONO, fontSize: 12, fontWeight: 600, color: 'var(--surface-000)', paddingLeft: 6, lineHeight: '16px' }}>{s.c}</span>}
                                    </div>
                                ))}
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(currentLap / totalLaps) * 100}%`, width: 2, background: 'var(--brand)' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', ...LABEL }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 'var(--radius-xs)', background: 'var(--compound-soft)' }} />Soft</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 'var(--radius-xs)', background: 'var(--compound-medium)' }} />Medium</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 'var(--radius-xs)', background: 'var(--compound-hard)' }} />Hard</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 2, height: 12, background: 'var(--brand)' }} />Current lap</div>
                </div>
            </div>

            <ResizeHandle onMouseDown={onPitLogResize} />

            <div style={{ padding: 'var(--space-4) var(--space-6)', overflowY: 'auto', minHeight: 0 }}>
                <div style={{ ...LABEL, marginBottom: 'var(--space-3)' }}>Pit stop log</div>
                {pitLog.map((p, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                            {p.driver}
                            <span style={{ ...MONO, fontSize: 13, color: 'var(--ink)' }}>{p.dur}s</span>
                        </div>
                        <div style={{ ...LABEL, letterSpacing: '.06em', marginTop: 2 }}>Lap {p.lap} · {p.from} → {p.to}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
