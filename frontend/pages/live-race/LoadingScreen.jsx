import './loading.css'

// Full-viewport APEX loading screen: start-light gantry + progress readout.
// Purely presentational — mount it while data is loading, unmount when done.
// `label` (e.g. the race being loaded) replaces the "Session link" tag.
const STREAKS = [
    { top: '17%', width: 320, color: 'var(--ink)', delay: '.2s', duration: '3.4s' },
    { top: '30%', width: 180, color: 'var(--brand)', delay: '1.1s', duration: '2.6s' },
    { top: '71%', width: 420, color: 'var(--ink)', delay: '.7s', duration: '4s' },
    { top: '81%', width: 220, color: 'var(--data-b)', delay: '1.9s', duration: '3s' },
    { top: '89%', width: 300, color: 'var(--brand)', delay: '2.6s', duration: '3.8s' },
]

export default function LoadingScreen({ label }) {
    return (
        <div className="apex-ls" role="status" aria-live="polite" aria-label="Loading dashboard">
            <div className="apex-ls-grid" />

            <svg className="apex-ls-rings" viewBox="0 0 900 900" fill="none" aria-hidden="true">
                <g className="apex-ls-ring1">
                    <circle cx="450" cy="450" r="400" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 14" />
                    <circle cx="450" cy="450" r="400" stroke="var(--brand)" strokeWidth="3" strokeDasharray="90 2420" />
                </g>
                <g className="apex-ls-ring2">
                    <circle cx="450" cy="450" r="330" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="1 9" />
                    <circle cx="450" cy="450" r="330" stroke="var(--data-b)" strokeOpacity=".8" strokeWidth="3" strokeDasharray="60 2014" />
                </g>
            </svg>

            {STREAKS.map(s => (
                <div
                    key={s.top}
                    className="apex-ls-streak"
                    style={{ top: s.top, width: s.width, background: s.color, animationDelay: s.delay, animationDuration: s.duration }}
                />
            ))}

            <div className="apex-ls-brand apex-ls-rise">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                    <path d="M4 24 L15 5 L26 24" stroke="var(--brand)" strokeWidth="3.5" />
                    <path d="M10 24 L15 15 L20 24" stroke="var(--ink)" strokeWidth="3.5" />
                </svg>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '.06em' }}>APEX</span>
            </div>
            <div className="apex-ls-session apex-ls-mono apex-ls-rise" style={{ animationDelay: '.2s', fontSize: 12, letterSpacing: '.16em' }}>
                {label || 'Session link'}
            </div>

            <div className="apex-ls-gantry apex-ls-rise" style={{ animationDelay: '.3s' }} role="img" aria-label="Five start lights lighting up in sequence">
                <div className="apex-ls-light apex-ls-l1" />
                <div className="apex-ls-light apex-ls-l2" />
                <div className="apex-ls-light apex-ls-l3" />
                <div className="apex-ls-light apex-ls-l4" />
                <div className="apex-ls-light apex-ls-l5" />
            </div>

            <div className="apex-ls-headline">
                <div className="apex-ls-go">Lights out<span style={{ color: 'var(--brand)' }}>.</span></div>
            </div>

            <div className="apex-ls-progress apex-ls-rise" style={{ animationDelay: '.6s' }}>
                <div className="apex-ls-row apex-ls-mono">
                    <span>Loading dashboard</span>
                    <span className="apex-ls-pct" />
                </div>
                <div className="apex-ls-track"><div className="apex-ls-fill" /></div>
                <div className="apex-ls-stages apex-ls-mono">
                    <div className="apex-ls-st apex-ls-s1">Connecting to timing feed</div>
                    <div className="apex-ls-st apex-ls-s2">Syncing car telemetry</div>
                    <div className="apex-ls-st apex-ls-s3">Loading tyre and strategy data</div>
                    <div className="apex-ls-st apex-ls-s4">Green flag</div>
                </div>
            </div>
        </div>
    )
}
