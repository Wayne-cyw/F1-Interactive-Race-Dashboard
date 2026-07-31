export default function OverviewTab({ drivers, selected, onSelectDriver, speedPoly }) {
    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr 360px', flex: 1 }}>
                <div style={{ padding: '20px 0', borderRight: '1px solid #eeece6' }}>
                    <div style={{ padding: '0 24px 12px', fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600 }}>LEADERBOARD</div>
                    {drivers.map(d => (
                        <div
                            key={d.id}
                            onClick={() => onSelectDriver(d.id)}
                            style={{ display: 'grid', gridTemplateColumns: '26px 1fr 64px 76px 54px', gap: 10, padding: '10px 24px', alignItems: 'center', cursor: 'pointer', background: d.rowBg, borderLeft: `3px solid ${d.rowAccent}` }}
                        >
                            <div style={{ fontWeight: 700, color: d.posColor }}>{d.pos}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 4, height: 16, background: d.color, borderRadius: 2 }} />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#8b8880' }}>{d.gap}</div>
                            <div style={{ fontSize: 12, color: '#403c36', fontFamily: "'JetBrains Mono', monospace" }}>{d.last}</div>
                            <div style={{ fontSize: 11, color: d.tireColor }}>{d.tire}·{d.age}</div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '20px 24px', borderRight: '1px solid #eeece6' }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 10 }}>TRACK MAP</div>
                    <svg viewBox="0 0 560 320" style={{ width: '100%', height: 300 }}>
                        <path d="M60 260 C40 200 60 140 120 120 C160 108 180 60 240 55 C300 50 320 90 380 85 C440 80 460 40 500 60 C530 75 520 130 470 150 C420 170 430 210 390 230 C340 255 300 220 250 235 C190 252 130 300 60 260 Z" fill="none" stroke="#e3e0d8" strokeWidth="14" strokeLinecap="round" />
                        {drivers.map(d => (
                            <circle key={d.id} cx={d.mx} cy={d.my} r={d.dotR} fill={d.color} stroke="#faf9f6" strokeWidth="2" />
                        ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 12, color: '#8b8880' }}>
                        <div>S1 <b style={{ color: '#403c36' }}>28.4</b></div>
                        <div>S2 <b style={{ color: 'oklch(52% .18 300)' }}>31.1</b></div>
                        <div>S3 <b style={{ color: '#403c36' }}>29.0</b></div>
                    </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 12 }}>TELEMETRY — {selected.name}</div>
                    <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{selected.topSpeed}<span style={{ fontSize: 14, color: '#a8a49b' }}> km/h</span></div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'oklch(50% .16 230)' }}>{selected.gear}</div>
                        {selected.drs && <div style={{ padding: '4px 10px', borderRadius: 16, background: '#f2f8f4', fontSize: 11, color: 'oklch(45% .13 155)', fontWeight: 600 }}>DRS ON</div>}
                        {!selected.drs && <div style={{ padding: '4px 10px', borderRadius: 16, background: '#f2f0ea', fontSize: 11, color: '#8b8880', fontWeight: 600 }}>DRS OFF</div>}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Throttle</span><span>{selected.throttle}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: `${selected.throttle}%`, height: '100%', background: 'oklch(48% .13 155)', borderRadius: 3 }} /></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a8a49b' }}><span>Brake</span><span>{selected.brake}%</span></div>
                            <div style={{ height: 6, background: '#eeece6', borderRadius: 3, marginTop: 4 }}><div style={{ width: `${selected.brake}%`, height: '100%', background: 'oklch(55% .18 25)', borderRadius: 3 }} /></div>
                        </div>
                    </div>
                    <svg viewBox="0 0 300 90" style={{ width: '100%', height: 80, marginTop: 14 }}>
                        <polyline points={speedPoly} fill="none" stroke="oklch(50% .16 230)" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            <div style={{ padding: '14px 32px', borderTop: '1px solid #e6e3dc', background: '#fff' }}>
                <div style={{ fontSize: 11, letterSpacing: '.06em', color: '#a8a49b', fontWeight: 600, marginBottom: 8 }}>SECTOR DELTAS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {drivers.filter(d => d.top5).map(d => (
                        <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#403c36' }}>{d.name}</span>
                            <div style={{ display: 'flex', gap: 2, height: 7 }}>
                                <div style={{ width: '33%', background: d.s1c, borderRadius: 2 }} />
                                <div style={{ width: '34%', background: d.s2c, borderRadius: 2 }} />
                                <div style={{ width: '33%', background: d.s3c, borderRadius: 2 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
