import { useEffect, useRef } from 'react'
import './loading.css'

// The bar is driven by real request completion (`progress`, 0..1). Between
// completions it creeps toward — but never past — a ceiling just above the
// last real value, so long FastF1 loads still show life without lying.
const CREEP_HEADROOM = 0.15
const CREEP_TAU_MS = 6000
const MAX_BEFORE_DONE = 0.97
const LIGHTS = 5

function useSmoothProgress(progress, done, { fillRef, pctRef, lightsRef }) {
    const target = useRef({ value: progress, since: performance.now() })
    const shown = useRef(0)

    useEffect(() => {
        target.current = { value: done ? 1 : progress, since: performance.now() }
    }, [progress, done])

    useEffect(() => {
        let raf
        let last = performance.now()
        const tick = (now) => {
            const { value, since } = target.current
            const ceiling = value >= 1
                ? 1
                : Math.min(MAX_BEFORE_DONE, value + CREEP_HEADROOM * (1 - Math.exp(-(now - since) / CREEP_TAU_MS)))
            shown.current += (ceiling - shown.current) * (1 - Math.exp(-(now - last) / 180))
            last = now
            const p = value >= 1 && ceiling - shown.current < 0.002 ? 1 : shown.current
            if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
            if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}%`
            lightsRef.current?.forEach((el, i) => el?.setAttribute('data-on', String(p >= (i + 1) / LIGHTS - 0.001 || (value >= 1 && p >= 0.99))))
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [fillRef, pctRef, lightsRef])
}

// Full-viewport APEX loading screen: start-light gantry + progress readout.
// Purely presentational — mount it while data is loading, unmount when done.
// `label` (e.g. the race being loaded) replaces the "Session link" tag.
// `progress` (0..1) and `stage` come from real loading state; `done` plays the
// lights-out finish just before the screen is unmounted.
const STREAKS = [
    { top: '17%', width: 320, color: 'var(--ink)', delay: '.2s', duration: '3.4s' },
    { top: '30%', width: 180, color: 'var(--brand)', delay: '1.1s', duration: '2.6s' },
    { top: '71%', width: 420, color: 'var(--ink)', delay: '.7s', duration: '4s' },
    { top: '81%', width: 220, color: 'var(--data-b)', delay: '1.9s', duration: '3s' },
    { top: '89%', width: 300, color: 'var(--brand)', delay: '2.6s', duration: '3.8s' },
]

export default function LoadingScreen({ label, progress = 0, stage = '', done = false }) {
    const fillRef = useRef(null)
    const pctRef = useRef(null)
    const lightsRef = useRef([])
    useSmoothProgress(progress, done, { fillRef, pctRef, lightsRef })

    return (
        <div className={`apex-ls${done ? ' apex-ls-done' : ''}`} role="status" aria-live="polite" aria-label="Loading dashboard">
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
                {Array.from({ length: LIGHTS }, (_, i) => (
                    <div key={i} className="apex-ls-light" ref={el => { lightsRef.current[i] = el }} />
                ))}
            </div>

            <div className="apex-ls-headline">
                <div className="apex-ls-go">Lights out<span style={{ color: 'var(--brand)' }}>.</span></div>
            </div>

            <div className="apex-ls-progress apex-ls-rise" style={{ animationDelay: '.6s' }}>
                <div className="apex-ls-row apex-ls-mono">
                    <span>Loading dashboard</span>
                    <span className="apex-ls-pct" ref={pctRef}>0%</span>
                </div>
                <div className="apex-ls-track"><div className="apex-ls-fill" ref={fillRef} /></div>
                <div key={done ? 'done' : stage} className={`apex-ls-stage apex-ls-mono${done ? ' apex-ls-stage-done' : ''}`}>
                    {done ? 'Green flag' : stage || 'Connecting to timing feed'}
                </div>
            </div>
        </div>
    )
}
