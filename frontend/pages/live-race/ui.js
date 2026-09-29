// Shared APEX style fragments. Every value is a design-system token
// (frontend/design/tokens.css) — never hard-code colors, radii or fonts here.

// Uppercase mono label with wide tracking; 12px is the design system's floor.
export const LABEL = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-muted)',
    fontWeight: 500,
}

// Unbounded carries headlines and big readouts.
export const DISPLAY = { fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-.02em' }

export const MONO = { fontFamily: 'var(--font-mono)' }

// Pill tag (status, PIT, DRS…)
export const TAG = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--surface-200)',
    border: '1px solid var(--line)',
    whiteSpace: 'nowrap',
}

// Compact select: pill with a hairline border that turns brand on hover (via .apex-btn-secondary).
export const SELECT = {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '.04em',
    color: 'var(--ink)',
    background: 'var(--surface-100)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-pill)',
    minHeight: 44,
    padding: '0 var(--space-4)',
    cursor: 'pointer',
}
