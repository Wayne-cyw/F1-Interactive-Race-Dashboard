export default function TrackStatus({ vscActive }) {
    const color = vscActive ? 'var(--yellow)' : 'var(--green)'
    return (
        <div className="surface">
            <h3 className="panel-title">Track Status</h3>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '22px',
                    fontWeight: '700',
                    color,
                    textShadow: `0 0 16px ${color}`,
                    letterSpacing: '0.05em',
                }}>
                    {vscActive ? 'VSC' : 'GREEN FLAG'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {vscActive ? 'Virtual Safety Car' : 'Race in Progress'}
                </div>
            </div>
        </div>
    )
}
