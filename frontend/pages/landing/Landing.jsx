import './landing.css'

const CIRCUIT = 'M90 210 L200 210 C230 210 240 190 235 170 C230 150 250 130 275 130 L340 130 C370 130 385 150 405 165 C430 185 470 180 485 150 C500 120 480 80 440 70 L300 45 C270 38 245 55 215 70 C190 82 165 70 140 60 C100 46 60 70 60 110 C60 140 90 150 100 165 C110 180 60 195 90 210 Z'
const MARQUEE = ['Live timing', 'Tyre strategy', 'Telemetry', 'Race control']

function Logo() {
    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M4 24 L15 5 L26 24" stroke="var(--brand)" strokeWidth="3.5" strokeLinejoin="miter" />
            <path d="M10 24 L15 15 L20 24" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="miter" />
        </svg>
    )
}

function Arrow({ color }) {
    return (
        <svg className="apex-ld-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 10h13M11 4l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="square" />
        </svg>
    )
}

function MarqueeSet({ hidden }) {
    return (
        <div className="apex-ld-marquee-set" aria-hidden={hidden || undefined}>
            {[...MARQUEE, ...MARQUEE].map((label, i) => (
                <span key={i} style={{ display: 'contents' }}>
                    <span>{label}</span>
                    <span className="apex-ld-diamond" />
                </span>
            ))}
        </div>
    )
}

function TimingPreview() {
    const rows = [
        ['P1', '100%', 'var(--brand)', '0s'],
        ['P2', '86%', 'var(--brand)', '-.6s'],
        ['P3', '72%', 'var(--ink)', '-1.2s'],
        ['P4', '60%', 'var(--ink)', '-1.8s'],
    ]
    return (
        <div className="apex-ld-preview">
            {rows.map(([pos, width, color, delay]) => (
                <div key={pos} className="apex-ld-barrow">
                    <span className="apex-ld-mono">{pos}</span>
                    <div className="apex-ld-bartrack">
                        <div className="apex-ld-bar" style={{ width, background: color, animationDelay: delay }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

function StrategyPreview() {
    const rows = [
        [[34, 'soft', 0], [40, 'medium', .25], [26, 'hard', .5]],
        [[22, 'medium', .15], [44, 'hard', .4], [34, 'medium', .65]],
        [[46, 'soft', .3], [54, 'hard', .55]],
        [[30, 'medium', .45], [70, 'hard', .7]],
    ]
    return (
        <div className="apex-ld-preview">
            {rows.map((stints, r) => (
                <div key={r} className="apex-ld-stintrow">
                    {stints.map(([width, compound, delay], i) => (
                        <div key={i} className="apex-ld-stint" style={{ width: `${width}%`, background: `var(--compound-${compound})`, animationDelay: `${delay}s` }} />
                    ))}
                </div>
            ))}
        </div>
    )
}

function TelemetryPreview() {
    return (
        <div className="apex-ld-preview" style={{ justifyContent: 'center' }}>
            <svg width="100%" height="120" viewBox="0 0 300 120" fill="none" role="img" aria-label="Two overlaid telemetry traces">
                <path className="apex-ld-trace" pathLength="1" d="M0 90 C30 90 40 20 70 20 S110 96 140 96 S180 16 210 16 S250 80 300 44" stroke="var(--data-b)" strokeWidth="2.5" strokeLinecap="round" />
                <path className="apex-ld-trace" pathLength="1" style={{ animationDelay: '.15s' }} d="M0 94 C30 94 46 28 76 28 S116 90 146 90 S186 24 216 24 S256 76 300 50" stroke="var(--data-a)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

export default function Landing({ onEnter }) {
    const enter = (e) => { e.preventDefault(); onEnter() }

    return (
        <div className="apex-ld" id="top">
            <div className="apex-ld-inner">

                <header className="apex-ld-nav apex-ld-pad">
                    <a href="#top" className="apex-ld-brand" aria-label="APEX home">
                        <Logo />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '.06em' }}>APEX</span>
                    </a>
                    <nav className="apex-ld-navlinks">
                        <a className="apex-ld-navlink" href="#features">Live timing</a>
                        <a className="apex-ld-navlink" href="#features">Strategy</a>
                        <a className="apex-ld-navlink" href="#features">Telemetry</a>
                        <button type="button" className="apex-ld-btn apex-ld-btn-sm" onClick={enter}>Enter the pit wall</button>
                    </nav>
                </header>

                <section className="apex-ld-hero apex-ld-pad">
                    <div className="apex-ld-herogrid" />
                    <div className="apex-ld-lapline-wrap"><div className="apex-ld-lapline" /></div>

                    <div className="apex-ld-copy">
                        <div className="apex-ld-eyebrow apex-ld-mono apex-ld-mono-lg apex-ld-rise" style={{ animationDelay: '.1s' }}>
                            <span className="apex-ld-pulse" style={{ width: 9, height: 9 }} />Formula 1 · live race intelligence
                        </div>
                        <h1 className="apex-ld-display apex-ld-h1 apex-ld-rise" style={{ animationDelay: '.25s' }}>
                            Every lap.<br /><span style={{ color: 'var(--brand)' }}>Read live.</span>
                        </h1>
                        <p className="apex-ld-lede apex-ld-rise" style={{ animationDelay: '.45s' }}>
                            Timing, tyre strategy and car telemetry on a single pit-wall screen, so you see why the gap moved, not only that it did.
                        </p>
                        <div className="apex-ld-actions apex-ld-rise" style={{ animationDelay: '.6s' }}>
                            <button type="button" className="apex-ld-btn apex-ld-btn-lg" onClick={enter}>
                                Enter the pit wall <Arrow color="var(--on-brand)" />
                            </button>
                            <a className="apex-ld-underlink" href="#features">See what's inside</a>
                        </div>
                    </div>

                    <div className="apex-ld-card-hero apex-ld-rise" style={{ animationDelay: '.5s' }}>
                        <div className="apex-ld-cardhead apex-ld-mono">
                            <span>Circuit · Live</span>
                            <span className="apex-ld-rec"><span className="apex-ld-pulse" style={{ width: 8, height: 8 }} />Rec</span>
                        </div>
                        <svg className="apex-ld-svg" viewBox="0 0 560 260" fill="none" role="img" aria-label="Animated circuit map with a car moving around the track">
                            <path d={CIRCUIT} stroke="var(--line)" strokeWidth="16" strokeLinejoin="round" />
                            <path className="apex-ld-dashed" d={CIRCUIT} stroke="var(--ink)" strokeOpacity=".5" strokeWidth="1.5" />
                            <circle r="16" fill="var(--brand)" fillOpacity=".22"><animateMotion dur="7s" repeatCount="indefinite" path={CIRCUIT} /></circle>
                            <circle r="7" fill="var(--data-a)"><animateMotion dur="7s" repeatCount="indefinite" path={CIRCUIT} /></circle>
                            <circle r="7" fill="var(--data-b)"><animateMotion dur="7s" begin="-.9s" repeatCount="indefinite" path={CIRCUIT} /></circle>
                        </svg>
                        <div className="apex-ld-divider" />
                        <div className="apex-ld-mono">Speed trace · Lap comparison</div>
                        <svg className="apex-ld-svg" viewBox="0 0 564 150" fill="none" role="img" aria-label="Two animated speed traces compared across a lap">
                            {[37, 75, 113].map(y => <line key={y} x1="0" y1={y} x2="564" y2={y} stroke="var(--line)" />)}
                            <path className="apex-ld-trace" pathLength="1" d="M0 120 C40 120 50 30 90 30 S140 128 180 128 S230 24 280 24 S330 108 370 108 S430 34 470 34 S540 96 564 70" stroke="var(--data-b)" strokeWidth="2.5" strokeLinecap="round" />
                            <path className="apex-ld-trace" pathLength="1" style={{ animationDelay: '.12s' }} d="M0 124 C40 124 55 36 96 36 S146 118 186 118 S236 30 286 30 S336 100 376 100 S434 40 474 40 S544 92 564 74" stroke="var(--data-a)" strokeWidth="2.5" strokeLinecap="round" />
                            <rect className="apex-ld-cursor" x="0" y="0" width="2" height="150" fill="var(--ink)" fillOpacity=".7" />
                        </svg>
                        <div className="apex-ld-legend apex-ld-mono">
                            <span><i style={{ background: 'var(--data-a)' }} />Driver A</span>
                            <span><i style={{ background: 'var(--data-b)' }} />Driver B</span>
                        </div>
                    </div>
                </section>

                <div className="apex-ld-marquee-wrap" aria-hidden="true">
                    <div className="apex-ld-marquee">
                        <MarqueeSet />
                        <MarqueeSet hidden />
                    </div>
                </div>

                <section id="features" className="apex-ld-features apex-ld-pad">
                    <div className="apex-ld-features-head">
                        <h2 className="apex-ld-display apex-ld-h2">Built for the pit wall, not the spreadsheet.</h2>
                        <div className="apex-ld-mono apex-ld-mono-lg">Three views · One screen</div>
                    </div>
                    <div className="apex-ld-grid3">
                        <div className="apex-ld-card">
                            <TimingPreview />
                            <div className="apex-ld-mono apex-ld-tag">01 · Live timing</div>
                            <h3 className="apex-ld-h3">Gaps that update while you're still looking.</h3>
                            <p className="apex-ld-p">Sector splits, intervals and pit windows on one board, made to be read at a glance instead of decoded.</p>
                        </div>
                        <div className="apex-ld-card">
                            <StrategyPreview />
                            <div className="apex-ld-mono apex-ld-tag">02 · Tyre strategy</div>
                            <h3 className="apex-ld-h3">See the undercut before the call comes.</h3>
                            <p className="apex-ld-p">Stint lengths and compound history for every car, so strategy stops being a guess.</p>
                        </div>
                        <div className="apex-ld-card">
                            <TelemetryPreview />
                            <div className="apex-ld-mono apex-ld-tag">03 · Telemetry compare</div>
                            <h3 className="apex-ld-h3">Two drivers. One corner. Every metre.</h3>
                            <p className="apex-ld-p">Overlay speed, throttle and brake traces to see exactly where the lap time went.</p>
                        </div>
                    </div>
                </section>

                <div className="apex-ld-pad">
                    <section className="apex-ld-cta">
                        <div className="apex-ld-checker" />
                        <div className="apex-ld-cta-copy">
                            <h2 className="apex-ld-display">Be on the pit wall when the lights go out.</h2>
                            <p>Open the dashboard and pick up the session live.</p>
                        </div>
                        <button type="button" className="apex-ld-btn apex-ld-btn-dark" onClick={enter}>
                            Enter the pit wall <Arrow color="var(--ink)" />
                        </button>
                    </section>
                </div>

                <footer className="apex-ld-footer apex-ld-pad">
                    <span className="apex-ld-mono" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '.06em', color: 'var(--ink)' }}>APEX</span>
                        © 2026
                    </span>
                    <span className="apex-ld-mono">Unofficial fan project. Not affiliated with Formula 1.</span>
                </footer>
            </div>
        </div>
    )
}
