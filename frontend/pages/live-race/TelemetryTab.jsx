import ResizeHandle from './ResizeHandle'
import { useResizableWidth } from './useResizableWidth'
import { useFollowScroll } from './useFollowScroll'
import { DISPLAY, LABEL, MONO } from './ui'

function StatTile({ label, value, unit }) {
    return (
        <div style={{ flex: 1, background: 'var(--surface-100)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
            <div style={LABEL}>{label}</div>
            <div style={{ ...DISPLAY, fontSize: 26, marginTop: 4 }}>{value}{unit && <span style={{ ...LABEL, fontSize: 12 }}> {unit}</span>}</div>
        </div>
    )
}

function ScrollChart({ index, register, onScroll, contentWidthPx, points, color, strokeWidth = 2 }) {
    return (
        <div
            ref={register(index)}
            onScroll={onScroll(index)}
            style={{ flex: 1, minHeight: 0, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', background: 'var(--surface-100)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}
        >
            <svg
                viewBox={`0 0 ${Math.max(1, contentWidthPx)} 100`}
                preserveAspectRatio="none"
                style={{ display: 'block', width: contentWidthPx, height: '100%' }}
            >
                <polyline points={points} fill="none" style={{ stroke: color }} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    )
}

function JumpToLiveButton({ following, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={following}
            style={{
                ...LABEL,
                color: following ? 'var(--ink-muted)' : 'var(--ink)',
                background: 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 10,
                minHeight: 32,
                padding: '0 var(--space-4)',
                cursor: following ? 'default' : 'pointer',
                opacity: following ? 0.6 : 1,
            }}
        >
            Jump to live
        </button>
    )
}

export default function TelemetryTab({ drivers, selected, onSelectDriver, speedScrollPoly, throttleScrollPoly, brakeScrollPoly, scrollContentWidthPx, topSpeed, avgSpeed, drsCount, currentGear }) {
    const [driverListWidth, onDriverListResize] = useResizableWidth(260, { min: 200, max: 420, edge: 'right' })
    const { following, register, onScroll, jumpToLive } = useFollowScroll(scrollContentWidthPx ?? 0)

    return (
        <div style={{ display: 'grid', gridTemplateColumns: `${driverListWidth}px 10px minmax(0, 1fr)`, gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0, minWidth: 0 }}>
            <div style={{ padding: 'var(--space-4) 0', overflowY: 'auto', minHeight: 0 }}>
                <div style={{ padding: '0 var(--space-6) var(--space-2)', ...LABEL }}>Select driver</div>
                {drivers.map(d => (
                    <div
                        key={d.id}
                        onClick={() => onSelectDriver(d.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px var(--space-6)', cursor: 'pointer', background: d.rowBg, borderLeft: `3px solid ${d.rowAccent}` }}
                    >
                        <div style={{ width: 4, height: 14, background: d.color, borderRadius: 'var(--radius-xs)' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                    </div>
                ))}
            </div>

            <ResizeHandle onMouseDown={onDriverListResize} />

            <div style={{ padding: 'var(--space-4) var(--space-6)', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...LABEL, marginBottom: 6 }}>Telemetry deep dive</div>
                <div style={{ ...DISPLAY, fontSize: 20, marginBottom: 14 }}>
                    {selected.name} <span style={{ ...LABEL, fontSize: 12 }}>{selected.team}</span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                    <StatTile label="TOP SPEED" value={topSpeed} unit="km/h" />
                    <StatTile label="AVG SPEED" value={avgSpeed} unit="km/h" />
                    <StatTile label="DRS ACTIVATIONS" value={drsCount} />
                    <StatTile label="CURRENT GEAR" value={currentGear ?? '—'} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={LABEL}>Telemetry trace</div>
                    <JumpToLiveButton following={following} onClick={jumpToLive} />
                </div>

                <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 6, ...LABEL }}>Speed (km/h)</div>
                        <ScrollChart
                            index={0}
                            register={register}
                            onScroll={onScroll}
                            contentWidthPx={scrollContentWidthPx ?? 0}
                            points={speedScrollPoly}
                            color="var(--data-b)"
                            strokeWidth={2.5}
                        />
                    </div>

                    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 6, ...LABEL }}>Throttle %</div>
                        <ScrollChart
                            index={1}
                            register={register}
                            onScroll={onScroll}
                            contentWidthPx={scrollContentWidthPx ?? 0}
                            points={throttleScrollPoly}
                            color="var(--compound-medium)"
                        />
                    </div>

                    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 6, ...LABEL }}>Brake %</div>
                        <ScrollChart
                            index={2}
                            register={register}
                            onScroll={onScroll}
                            contentWidthPx={scrollContentWidthPx ?? 0}
                            points={brakeScrollPoly}
                            color="var(--data-a)"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
