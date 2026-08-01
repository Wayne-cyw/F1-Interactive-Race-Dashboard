const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'timing', label: 'Timing' },
    { key: 'strategy', label: 'Strategy' },
    { key: 'telemetry', label: 'Telemetry' },
]

export default function TabNav({ activeTab, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 6, padding: '8px 32px', background: '#fff', borderBottom: '1px solid #e6e3dc' }}>
            {TABS.map(({ key, label }) => {
                const active = activeTab === key
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        style={{
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px 18px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            background: active ? '#191b1e' : 'transparent',
                            color: active ? '#fff' : '#5c5852',
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}
