import { useState } from 'react'
import Leaderboard from './Leaderboard'
import ResizeHandle from './ResizeHandle'
import { useResizableHeight } from './useResizableHeight'
import { useResizableWidth } from './useResizableWidth'

// Tall enough for 3 sector-delta rows (~14px each, 6px gaps) plus the
// scroll box's own bottom padding, so the panel can never be shrunk below
// showing all three without scrolling.
const SECTOR_DELTAS_MIN_HEIGHT = 64

export default function OverviewTab({ drivers, selected, onSelectDriver, speedPoly }) {
    const [leaderboardWidth, onLeaderboardResize] = useResizableWidth(440, { min: 320, max: 640, edge: 'right' })
    const [telemetryWidth, onTelemetryResize] = useResizableWidth(360, { min: 280, max: 520, edge: 'left' })
    const [sectorDeltasHeight, onSectorDeltasResize] = useResizableHeight(SECTOR_DELTAS_MIN_HEIGHT, { min: SECTOR_DELTAS_MIN_HEIGHT, max: 280, edge: 'top' })
    const [sectorDeltasCollapsed, setSectorDeltasCollapsed] = useState(false)

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: `${leaderboardWidth}px 10px 1fr 10px ${telemetryWidth}px`, flex: 1, minHeight: 0 }}>
                <Leaderboard drivers={drivers} onSelectDriver={onSelectDriver} width={leaderboardWidth} />

                <ResizeHandle onMouseDown={onLeaderboardResize} />

                <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 10 }}>TRACK MAP</div>
                    <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', flex: 1, minHeight: 0 }}>
                        <path d="M60 260 C40 200 60 140 120 120 C160 108 180 60 240 55 C300 50 320 90 380 85 C440 80 460 40 500 60 C530 75 520 130 470 150 C420 170 430 210 390 230 C340 255 300 220 250 235 C190 252 130 300 60 260 Z" fill="none" stroke="#e3e0d8" strokeWidth="14" strokeLinecap="round" />
                        {drivers.map(d => (
                            <circle key={d.id} cx={d.mx} cy={d.my} r={d.dotR} fill={d.color} stroke="#faf9f6" strokeWidth="2" />
                        ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 12, color: '#8b8880' }}>
                        <div>S1 <b style={{ color: '#403c36' }}>28.4</b></div>
                        <div>S2 <b style={{ color: 'oklch(52% .18 300)' }}>31.1</b></div>
                        <div>S3 <b style={{ color: '#403c36' }}>29.0</b></div>
                    </div>
                </div>

                <ResizeHandle onMouseDown={onTelemetryResize} />

                <div style={{ padding: '16px 32px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>TELEMETRY — {selected.name}</div>
                    <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{selected.topSpeed}<span style={{ fontSize: 14, color: '#a8a49b' }}> km/h</span></div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'oklch(50% .16 230)' }}>{selected.gear}</div>
                        {selected.drs && <div style={{ padding: '4px 10px', borderRadius: 10, background: '#f2f8f4', fontSize: 11, color: 'oklch(45% .13 155)', fontWeight: 600 }}>DRS ON</div>}
                        {!selected.drs && <div style={{ padding: '4px 10px', borderRadius: 10, background: '#f2f0ea', fontSize: 11, color: '#8b8880', fontWeight: 600 }}>DRS OFF</div>}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Throttle</span><span>{selected.throttle}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: `${selected.throttle}%`, height: '100%', background: 'oklch(48% .13 155)', borderRadius: 3 }} /></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Brake</span><span>{selected.brake}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: `${selected.brake}%`, height: '100%', background: 'oklch(55% .18 25)', borderRadius: 3 }} /></div>
                        </div>
                    </div>
                    <svg viewBox="0 0 300 90" style={{ width: '100%', height: 70, marginTop: 14 }}>
                        <polyline points={speedPoly} fill="none" stroke="oklch(50% .16 230)" strokeWidth="2" />
                    </svg>
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
