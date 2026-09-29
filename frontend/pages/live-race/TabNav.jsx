import { MONO } from './ui'

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'timing', label: 'Timing' },
    { key: 'strategy', label: 'Strategy' },
    { key: 'telemetry', label: 'Telemetry' },
]

export default function TabNav({ activeTab, onChange }) {
    return (
        <div role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-6)', background: 'var(--surface-100)', borderBottom: '1px solid var(--line)' }}>
            {TABS.map(({ key, label }, i) => {
                const active = activeTab === key
                return (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        className={active ? 'apex-btn apex-btn-primary' : 'apex-btn apex-btn-secondary'}
                        style={{
                            ...MONO,
                            cursor: 'pointer',
                            minHeight: 44,
                            padding: '0 var(--space-5)',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            border: active ? '1px solid var(--brand)' : '1px solid var(--line)',
                            background: active ? 'var(--brand)' : 'transparent',
                            color: active ? 'var(--on-brand)' : 'var(--ink-muted)',
                        }}
                    >
                        {String(i + 1).padStart(2, '0')} · {label}
                    </button>
                )
            })}
        </div>
    )
}
