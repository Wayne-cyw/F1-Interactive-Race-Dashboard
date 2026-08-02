import { useMemo, useState } from 'react'
import Leaderboard from './Leaderboard'
import ResizeHandle from './ResizeHandle'
import { useResizableHeight } from './useResizableHeight'
import { useResizableWidth } from './useResizableWidth'
import { interpolatePosition } from './trackMap'

const SECTOR_DELTAS_MIN_HEIGHT = 64

export default function OverviewTab({ drivers, selected, onSelectDriver, trackPath, positions, elapsedSeconds, telemetry }) {
    const [leaderboardWidth, onLeaderboardResize] = useResizableWidth(440, { min: 320, max: 640, edge: 'right' })
    const [telemetryWidth, onTelemetryResize] = useResizableWidth(360, { min: 280, max: 520, edge: 'left' })
    const [sectorDeltasHeight, onSectorDeltasResize] = useResizableHeight(SECTOR_DELTAS_MIN_HEIGHT, { min: SECTOR_DELTAS_MIN_HEIGHT, max: 280, edge: 'top' })
    const [sectorDeltasCollapsed, setSectorDeltasCollapsed] = useState(false)

    const carPositions = useMemo(
        () => drivers.filter(d => !d.dnf).map(d => {
            const raw = interpolatePosition(positions[d.id], elapsedSeconds)
            const svg = raw ? trackPath.toSvgPoint(raw) : { x: 0, y: 0 }
            return { ...d, mx: svg.x, my: svg.y }
        }),
        [drivers, positions, elapsedSeconds, trackPath]
    )

    const lastPoint = telemetry?.current

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: `${leaderboardWidth}px 10px 1fr 10px ${telemetryWidth}px`, gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
                <Leaderboard drivers={drivers} onSelectDriver={onSelectDriver} width={leaderboardWidth} />

                <ResizeHandle onMouseDown={onLeaderboardResize} />

                <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 10 }}>TRACK MAP</div>
                    <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', flex: 1, minHeight: 0 }}>
                        <path d={trackPath.pathD} fill="none" stroke="#e3e0d8" strokeWidth="14" strokeLinecap="round" />
                        {carPositions.map(d => (
                            <circle key={d.id} cx={d.mx} cy={d.my} r={d.dotR} fill={d.color} stroke="#faf9f6" strokeWidth="2" />
                        ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 12, color: '#8b8880' }}>
                        <div>S1 <b style={{ color: '#403c36' }}>{selected?.s1 ?? '—'}</b></div>
                        <div>S2 <b style={{ color: 'oklch(52% .18 300)' }}>{selected?.s2 ?? '—'}</b></div>
                        <div>S3 <b style={{ color: '#403c36' }}>{selected?.s3 ?? '—'}</b></div>
                    </div>
                </div>

                <ResizeHandle onMouseDown={onTelemetryResize} />

                <div style={{ padding: '16px 32px', overflowY: 'auto', minHeight: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>TELEMETRY — {selected?.name ?? '—'}</div>
                    <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{telemetry?.topSpeed ?? '—'}<span style={{ fontSize: 14, color: '#a8a49b' }}> km/h</span></div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'oklch(50% .16 230)' }}>{lastPoint?.gear ?? '—'}</div>
                        {lastPoint?.drs > 0
                            ? <div style={{ padding: '4px 10px', borderRadius: 10, background: '#f2f8f4', fontSize: 11, color: 'oklch(45% .13 155)', fontWeight: 600 }}>DRS ON</div>
                            : <div style={{ padding: '4px 10px', borderRadius: 10, background: '#f2f0ea', fontSize: 11, color: '#8b8880', fontWeight: 600 }}>DRS OFF</div>}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Throttle</span><span>{Math.round(lastPoint?.throttle ?? 0)}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: `${lastPoint?.throttle ?? 0}%`, height: '100%', background: 'oklch(48% .13 155)', borderRadius: 3 }} /></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Brake</span><span>{lastPoint?.brake ? 100 : 0}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: lastPoint?.brake ? '100%' : '0%', height: '100%', background: 'oklch(55% .18 25)', borderRadius: 3 }} /></div>
                        </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>SPEED · LAST 15S</div>
                            <svg viewBox="0 0 300 90" style={{ width: '100%', height: 70 }}>
                                <polyline points={telemetry?.speedRollingPoly ?? ''} fill="none" stroke="oklch(50% .16 230)" strokeWidth="2" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>THROTTLE · LAST 15S</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.throttleRollingPoly ?? ''} fill="none" stroke="oklch(48% .13 155)" strokeWidth="2" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>BRAKE · LAST 15S</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.brakeRollingPoly ?? ''} fill="none" stroke="oklch(55% .18 25)" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '10px 32px 0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                {!sectorDeltasCollapsed && <ResizeHandle onMouseDown={onSectorDeltasResize} orientation="horizontal" />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600 }}>SECTOR DELTAS</div>
                    <button
                        onClick={() => setSectorDeltasCollapsed(c => !c)}
                        aria-label={sectorDeltasCollapsed ? 'Expand sector deltas' : 'Collapse sector deltas'}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#a8a49b', padding: 4 }}
                    >
                        {sectorDeltasCollapsed ? '▸' : '▾'}
                    </button>
                </div>
                {!sectorDeltasCollapsed && (
                    <div style={{ height: sectorDeltasHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 }}>
                        {drivers.filter(d => d.top5).map(d => (
                            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 11, color: '#403c36' }}>{d.name}</span>
                                <div style={{ display: 'flex', gap: 2, height: 7 }}>
                                    <div style={{ width: '33%', background: d.s1c, borderRadius: 2 }} />
                                    <div style={{ width: '34%', background: d.s2c, borderRadius: 2 }} />
                                    <div style={{ width: '33%', background: d.s3c, borderRadius: 2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
