const SPEED_OPTIONS = [1, 2, 4, 8]

function formatClock(totalSeconds, showHours) {
    const s = Math.max(0, Math.floor(totalSeconds))
    if (showHours) {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = s % 60
        return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
}

export default function PlaybackBar({ isPlaying, onPlayPause, elapsedSeconds, totalDurationSeconds, currentLap, totalLaps, onSeek, playbackSpeed, onSpeedChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 32px', borderTop: '1px solid #e6e3dc', background: '#fff', flexShrink: 0 }}>
            <button
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
                style={{ border: 'none', background: '#191b1e', color: '#fff', width: 30, height: 30, borderRadius: 10, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>

            <input
                type="range"
                min={0}
                max={Math.max(1, totalDurationSeconds)}
                value={Math.min(elapsedSeconds, totalDurationSeconds)}
                onChange={e => onSeek(Number(e.target.value))}
                aria-label="Playback scrubber"
                style={{ flex: 1, accentColor: '#191b1e' }}
            />

            <div style={{ fontSize: 12, color: '#8b8880', fontFamily: "'Inconsolata', monospace", whiteSpace: 'nowrap' }}>
                {formatClock(elapsedSeconds, totalDurationSeconds >= 3600)} / {formatClock(totalDurationSeconds, totalDurationSeconds >= 3600)} · Lap {currentLap} of {totalLaps}
            </div>

            <select
                value={playbackSpeed}
                onChange={e => onSpeedChange(Number(e.target.value))}
                aria-label="Playback speed"
                style={{
                    border: '1px solid #e6e3dc',
                    borderRadius: 10,
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "'Carbon Black', sans-serif",
                    color: '#5c5852',
                    padding: '4px 8px',
                    flexShrink: 0,
                }}
            >
                {SPEED_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}x</option>
                ))}
            </select>
        </div>
    )
}
