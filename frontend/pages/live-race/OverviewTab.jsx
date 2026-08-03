import { useMemo, useRef } from 'react'
import Leaderboard from './Leaderboard'
import ResizeHandle from './ResizeHandle'
import TrackMap3D from './TrackMap3D'
import { useResizableWidth } from './useResizableWidth'
import { interpolatePosition } from './trackMap'
import { BEST_SECTOR_COLOR } from './leaderboardData'

const SECTOR_BOXES = [
    { key: 's1', label: 'SECTOR 1' },
    { key: 's2', label: 'SECTOR 2' },
    { key: 's3', label: 'SECTOR 3' },
]

// How far ahead (in seconds) to sample a driver's position to derive
// their current heading — small enough to track corners responsively,
// large enough to stay stable at low speed / in the pit lane.
const HEADING_LOOKAHEAD_SECONDS = 0.15

export default function OverviewTab({ drivers, selected, onSelectDriver, trackScene, positions, elapsedSeconds, telemetry, bestSectors }) {
    const [leaderboardWidth, onLeaderboardResize] = useResizableWidth(440, { min: 320, max: 640, edge: 'right' })
    const [telemetryWidth, onTelemetryResize] = useResizableWidth(360, { min: 280, max: 520, edge: 'left' })

    const lastHeadingRef = useRef(new Map())

    const carPositions = useMemo(
        () => drivers.filter(d => !d.dnf).map(d => {
            const raw = interpolatePosition(positions[d.id], elapsedSeconds)
            const ahead = interpolatePosition(positions[d.id], elapsedSeconds + HEADING_LOOKAHEAD_SECONDS)
            const scenePosition = raw ? trackScene.toScenePoint(raw) : { x: 0, y: 0, z: 0 }
            const sceneAhead = ahead ? trackScene.toScenePoint(ahead) : scenePosition
            const dx = sceneAhead.x - scenePosition.x
            const dz = sceneAhead.z - scenePosition.z
            const heading = (dx !== 0 || dz !== 0)
                ? Math.atan2(-dz, dx)
                : lastHeadingRef.current.get(d.id) ?? 0
            lastHeadingRef.current.set(d.id, heading)
            return { ...d, scenePosition, heading }
        }),
        [drivers, positions, elapsedSeconds, trackScene]
    )

    const lastPoint = telemetry?.current

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: `${leaderboardWidth}px 10px 1fr 10px ${telemetryWidth}px`, gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
                <Leaderboard drivers={drivers} onSelectDriver={onSelectDriver} width={leaderboardWidth} />

                <ResizeHandle onMouseDown={onLeaderboardResize} />

                <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 10 }}>TRACK MAP</div>
                    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
                        <TrackMap3D trackPoints={trackScene.points} carPositions={carPositions} onSelectDriver={onSelectDriver} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 12, color: '#8b8880' }}>
                        <div>S1 <b style={{ color: '#403c36' }}>{selected?.s1 ?? '—'}</b></div>
                        <div>S2 <b style={{ color: selected?.s2c === BEST_SECTOR_COLOR ? BEST_SECTOR_COLOR : '#403c36' }}>{selected?.s2 ?? '—'}</b></div>
                        <div>S3 <b style={{ color: '#403c36' }}>{selected?.s3 ?? '—'}</b></div>
                    </div>
                </div>

                <ResizeHandle onMouseDown={onTelemetryResize} />

                <div style={{ padding: '16px 32px', overflowY: 'auto', minHeight: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>TELEMETRY — {selected?.name ?? '—'}</div>
                    <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{lastPoint?.speed != null ? Math.round(lastPoint.speed) : '—'}<span style={{ fontSize: 14, color: '#a8a49b' }}> km/h</span></div>
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
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>SPEED</div>
                            <svg viewBox="0 0 300 90" style={{ width: '100%', height: 70 }}>
                                <polyline points={telemetry?.speedRollingPoly ?? ''} fill="none" stroke="oklch(50% .16 230)" strokeWidth="2" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>THROTTLE</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.throttleRollingPoly ?? ''} fill="none" stroke="oklch(48% .13 155)" strokeWidth="2" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>BRAKE</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.brakeRollingPoly ?? ''} fill="none" stroke="oklch(55% .18 25)" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '10px 32px 16px', background: '#fff' }}>
                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 8 }}>SECTOR DELTAS</div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {SECTOR_BOXES.map(({ key, label }) => (
                        <div key={key} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#f7f6f2' }}>
                            <div style={{ fontSize: 10.5, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{bestSectors?.[key]?.name ?? '—'}</span>
                                <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 13, color: '#403c36' }}>{bestSectors?.[key]?.time ?? '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
