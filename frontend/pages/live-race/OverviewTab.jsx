import { useMemo, useRef } from 'react'
import Leaderboard from './Leaderboard'
import ResizeHandle from './ResizeHandle'
import TrackMap3D from './TrackMap3D'
import { useResizableWidth } from './useResizableWidth'
import { interpolatePosition } from './trackMap'
import { DRS_OPEN_MIN } from './telemetrySlice'
import { BEST_SECTOR_COLOR } from './leaderboardData'
import { DISPLAY, LABEL, MONO, TAG } from './ui'

// Fixed size so the on/off states never shift the row.
const DRS_TAG = { borderRadius: 10, minWidth: 72, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }

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
    const [leaderboardWidth, onLeaderboardResize] = useResizableWidth(440, { min: 272, max: 640, edge: 'right' })
    const [telemetryWidth, onTelemetryResize] = useResizableWidth(360, { min: 280, max: 520, edge: 'left' })

    const lastHeadingRef = useRef(new Map())
    const lastPitchRef = useRef(new Map())

    const carPositions = useMemo(
        () => drivers.filter(d => !d.dnf).map(d => {
            const raw = interpolatePosition(positions[d.id], elapsedSeconds)
            const ahead = interpolatePosition(positions[d.id], elapsedSeconds + HEADING_LOOKAHEAD_SECONDS)
            const scenePosition = raw ? trackScene.toScenePoint(raw) : { x: 0, y: 0, z: 0 }
            // toScenePoint is a pure affine map (uniform scale + translation,
            // no rotation), so the heading angle is identical whether it's
            // derived before or after the transform — diff the raw
            // pre-transform points directly instead of transforming twice.
            const dx = raw && ahead ? ahead.x - raw.x : 0
            const dy = raw && ahead ? ahead.y - raw.y : 0
            const heading = (dx !== 0 || dy !== 0)
                ? Math.atan2(dy, dx)
                : lastHeadingRef.current.get(d.id) ?? 0
            lastHeadingRef.current.set(d.id, heading)

            // Pitch, unlike heading, does need the post-transform scene point:
            // elevation is exaggerated relative to the horizontal plane (see
            // trackGeometry3d.js), so the slope the ribbon actually renders
            // only shows up once both points have gone through toScenePoint.
            let pitch = lastPitchRef.current.get(d.id) ?? 0
            if (ahead) {
                const sceneAhead = trackScene.toScenePoint(ahead)
                const horizontal = Math.hypot(sceneAhead.x - scenePosition.x, sceneAhead.z - scenePosition.z)
                if (horizontal > 1e-6) pitch = Math.atan2(sceneAhead.y - scenePosition.y, horizontal)
            }
            lastPitchRef.current.set(d.id, pitch)

            return { ...d, scenePosition, heading, pitch }
        }),
        [drivers, positions, elapsedSeconds, trackScene]
    )

    const lastPoint = telemetry?.current

    return (
        <>
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <div style={{ position: 'absolute', inset: 0, padding: 'var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ ...LABEL, marginBottom: 10 }}>Track map</div>
                    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
                        <TrackMap3D trackPoints={trackScene.points} carPositions={carPositions} onSelectDriver={onSelectDriver} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 8, ...LABEL }}>
                        <div>S1 <b style={{ ...MONO, color: 'var(--ink)', fontWeight: 600 }}>{selected?.s1 ?? '—'}</b></div>
                        <div>S2 <b style={{ ...MONO, color: selected?.s2c === BEST_SECTOR_COLOR ? BEST_SECTOR_COLOR : 'var(--ink)', fontWeight: 600 }}>{selected?.s2 ?? '—'}</b></div>
                        <div>S3 <b style={{ ...MONO, color: 'var(--ink)', fontWeight: 600 }}>{selected?.s3 ?? '—'}</b></div>
                    </div>
                </div>

                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: leaderboardWidth, background: 'var(--surface-000)', display: 'grid', overflow: 'hidden' }}>
                    <Leaderboard drivers={drivers} onSelectDriver={onSelectDriver} width={leaderboardWidth} />
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: leaderboardWidth - 5, zIndex: 1 }}>
                    <ResizeHandle onMouseDown={onLeaderboardResize} />
                </div>

                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: telemetryWidth, boxSizing: 'border-box', background: 'var(--surface-000)', overflowY: 'auto', padding: 'var(--space-4) var(--space-6)' }}>
                    <div style={{ ...LABEL, marginBottom: 'var(--space-3)' }}>Telemetry — {selected?.name ?? '—'}</div>
                    <div style={{ ...DISPLAY, fontSize: 40, lineHeight: 1 }}>{lastPoint?.speed != null ? Math.round(lastPoint.speed) : '—'}<span style={{ ...LABEL, fontSize: 12 }}> km/h</span></div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
                        <div style={{ ...DISPLAY, fontSize: 24, color: 'var(--ink)', width: '1.5ch', minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{lastPoint?.gear ?? '—'}</div>
                        {lastPoint?.drs >= DRS_OPEN_MIN
                            ? <div style={{ ...TAG, ...DRS_TAG, background: 'var(--brand)', borderColor: 'var(--brand)', color: 'var(--on-brand)' }}>DRS on</div>
                            : <div style={{ ...TAG, ...DRS_TAG, color: 'var(--ink-muted)' }}>DRS off</div>}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', ...LABEL }}><span>Throttle</span><span>{Math.round(lastPoint?.throttle ?? 0)}%</span></div>
                            <div style={{ height: 6, background: 'var(--surface-200)', borderRadius: 'var(--radius-xs)', marginTop: 4 }}><div style={{ width: `${lastPoint?.throttle ?? 0}%`, height: '100%', background: 'var(--compound-medium)', borderRadius: 'var(--radius-xs)' }} /></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', ...LABEL }}><span>Brake</span><span>{lastPoint?.brake ? 100 : 0}%</span></div>
                            <div style={{ height: 6, background: 'var(--surface-200)', borderRadius: 'var(--radius-xs)', marginTop: 4 }}><div style={{ width: lastPoint?.brake ? '100%' : '0%', height: '100%', background: 'var(--brand)', borderRadius: 'var(--radius-xs)' }} /></div>
                        </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <div style={{ ...LABEL, marginBottom: 4 }}>Speed</div>
                            <svg viewBox="0 0 300 90" style={{ width: '100%', height: 70 }}>
                                <polyline points={telemetry?.speedRollingPoly ?? ''} fill="none" style={{ stroke: 'var(--data-b)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ ...LABEL, marginBottom: 4 }}>Throttle</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.throttleRollingPoly ?? ''} fill="none" style={{ stroke: 'var(--compound-medium)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ ...LABEL, marginBottom: 4 }}>Brake</div>
                            <svg viewBox="0 0 300 60" style={{ width: '100%', height: 46 }}>
                                <polyline points={telemetry?.brakeRollingPoly ?? ''} fill="none" style={{ stroke: 'var(--data-a)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: telemetryWidth - 5, zIndex: 1 }}>
                    <ResizeHandle onMouseDown={onTelemetryResize} />
                </div>
            </div>

            <div style={{ padding: 'var(--space-3) var(--space-6) var(--space-4)', background: 'var(--surface-100)', borderTop: '1px solid var(--line)' }}>
                <div style={{ ...LABEL, marginBottom: 8 }}>Sector deltas</div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {SECTOR_BOXES.map(({ key, label }) => (
                        <div key={key} style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-200)' }}>
                            <div style={{ ...LABEL, marginBottom: 4 }}>{label}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ ...DISPLAY, fontSize: 14 }}>{bestSectors?.[key]?.name ?? '—'}</span>
                                <span style={{ ...MONO, fontSize: 13, color: 'var(--ink)' }}>{bestSectors?.[key]?.time ?? '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
