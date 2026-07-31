export default function AlertsBox({ alerts }) {
    if (!alerts?.length) return null
    return (
        <div className="surface">
            <h3 className="panel-title">Live Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.04)',
                            borderLeft: `3px solid ${alert.color}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>
                            {alert.type === 'overtake' && '🏎️'}
                            {alert.type === 'pitstop' && '🔧'}
                            {alert.type === 'vsc' && '⚠️'}
                            {alert.type === 'success' && '✅'}
                        </span>
                        <span style={{ flex: 1 }}>{alert.message}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
