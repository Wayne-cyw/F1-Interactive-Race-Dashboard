import { SELECT } from './ui'

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-6)', borderTop: '1px solid var(--line)', background: 'var(--surface-100)', flexShrink: 0 }}>
            <button
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
                style={{ border: '1px solid var(--line)', background: 'var(--surface-200)', color: 'var(--ink)', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0 }}
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
                className="apex-scrubber"
                style={{ flex: 1, '--progress': `${Math.min(100, (elapsedSeconds / Math.max(1, totalDurationSeconds)) * 100)}%` }}
            />

            <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                {formatClock(elapsedSeconds, totalDurationSeconds >= 3600)} / {formatClock(totalDurationSeconds, totalDurationSeconds >= 3600)} · Lap {currentLap} of {totalLaps}
            </div>

            <select
                value={playbackSpeed}
                onChange={e => onSpeedChange(Number(e.target.value))}
                aria-label="Playback speed"
                style={{ ...SELECT, minHeight: 28, fontSize: 12, padding: '0 var(--space-2)', flexShrink: 0 }}
            >
                {SPEED_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}x</option>
                ))}
            </select>
        </div>
    )
}
