import { useEffect, useState } from 'react'
import TopBar from './live-race/TopBar'
import TabNav from './live-race/TabNav'
import OverviewTab from './live-race/OverviewTab'
import TimingTab from './live-race/TimingTab'
import StrategyTab from './live-race/StrategyTab'
import TelemetryTab from './live-race/TelemetryTab'
import { fmtClock } from './live-race/mockData'
import { useRaceCenterData } from './live-race/useRaceCenterData'

const FONT_LINK_ID = 'race-center-fonts'
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'

// Loads the Race Center's fonts only while this page is mounted, so the rest
// of the app's font choices are unaffected.
function useRaceCenterFonts() {
    useEffect(() => {
        if (document.getElementById(FONT_LINK_ID)) return
        const preconnect = document.createElement('link')
        preconnect.rel = 'preconnect'
        preconnect.href = 'https://fonts.googleapis.com'
        preconnect.id = FONT_LINK_ID
        document.head.appendChild(preconnect)

        const stylesheet = document.createElement('link')
        stylesheet.rel = 'stylesheet'
        stylesheet.href = FONT_HREF
        document.head.appendChild(stylesheet)

        return () => {
            preconnect.remove()
            stylesheet.remove()
        }
    }, [])
}

export default function LiveRace() {
    useRaceCenterFonts()

    const [activeTab, setActiveTab] = useState('overview')
    const [selectedDriverId, setSelectedDriverId] = useState(1)
    const [sessionSeconds, setSessionSeconds] = useState(0)

    // Placeholder race state/weather — a following pass wires these to real
    // track-status and weather data instead of a fixed value.
    const [raceState] = useState('green')
    const [weather] = useState('dry')

    useEffect(() => {
        const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000)
        return () => clearInterval(timer)
    }, [])

    const {
        drivers, selected, pitLog, totalLaps,
        speedPoly, speedPolyBig, throttlePolyBig, brakePolyBig,
        topSpeed, avgSpeed, drsCount,
    } = useRaceCenterData(selectedDriverId)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#faf9f6', color: '#191b1e', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <TopBar
                raceName="Silverstone Grand Prix"
                currentLap={42}
                totalLaps={totalLaps}
                sessionClock={fmtClock(sessionSeconds)}
                raceState={raceState}
                weather={weather}
                trackTemp={41}
                airTemp={24}
            />
            <TabNav activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'overview' && (
                <OverviewTab drivers={drivers} selected={selected} onSelectDriver={setSelectedDriverId} speedPoly={speedPoly} />
            )}
            {activeTab === 'timing' && (
                <TimingTab drivers={drivers} onSelectDriver={setSelectedDriverId} />
            )}
            {activeTab === 'strategy' && (
                <StrategyTab drivers={drivers} pitLog={pitLog} />
            )}
            {activeTab === 'telemetry' && (
                <TelemetryTab
                    drivers={drivers}
                    selected={selected}
                    onSelectDriver={setSelectedDriverId}
                    speedPolyBig={speedPolyBig}
                    throttlePolyBig={throttlePolyBig}
                    brakePolyBig={brakePolyBig}
                    topSpeed={topSpeed}
                    avgSpeed={avgSpeed}
                    drsCount={drsCount}
                />
            )}
        </div>
    )
}
