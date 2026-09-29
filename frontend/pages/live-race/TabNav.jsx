import { MONO } from './ui'

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'timing', label: 'Timing' },
    { key: 'strategy', label: 'Strategy' },
    { key: 'telemetry', label: 'Telemetry' },
]

export default function TabNav({ activeTab, onChange }) {
    return (
        <div role="tablist" style={{ display: 'flex', gap: 'var(--space-5)', padding: '0 var(--space-6)', background: 'var(--surface-100)', borderBottom: '1px solid var(--line)' }}>
            {TABS.map(({ key, label }) => {
                const active = activeTab === key
                return (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        style={{
                            ...MONO,
                            cursor: 'pointer',
                            height: 36,
                            padding: 0,
                            marginBottom: -1,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            border: 'none',
                            borderBottom: `2px solid ${active ? 'var(--ink)' : 'transparent'}`,
                            background: 'transparent',
                            color: active ? 'var(--ink)' : 'var(--ink-muted)',
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}
