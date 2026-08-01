import { useEffect, useMemo, useState } from 'react'
import TopBar from './live-race/TopBar'
import TabNav from './live-race/TabNav'
import OverviewTab from './live-race/OverviewTab'
import TimingTab from './live-race/TimingTab'
import StrategyTab from './live-race/StrategyTab'
import TelemetryTab from './live-race/TelemetryTab'
import { useRaceReplay } from './live-race/useRaceReplay'
import { useDriverTelemetry } from './live-race/useDriverTelemetry'
import { buildLeaderboardRows } from './live-race/leaderboardData'
import { buildPitLog, buildTireStints } from './live-race/stints'
import { buildTrackPath } from './live-race/trackMap'

const FONT_LINK_ID = 'race-center-fonts'
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'

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
    const [selectedDriverId, setSelectedDriverId] = useState(null)

    const replay = useRaceReplay()
    const { telemetry } = useDriverTelemetry(replay.year, replay.round, selectedDriverId)

    const drivers = useMemo(() => {
        if (!replay.sessionData) return []
        return buildLeaderboardRows({
            laps: replay.sessionData.laps,
            results: replay.sessionData.results,
            pitstops: replay.pitstops,
            currentLap: replay.currentLap,
            selectedDriverId,
        })
    }, [replay.sessionData, replay.pitstops, replay.currentLap, selectedDriverId])

    // Default the selected driver to the race leader once data first loads.
    useEffect(() => {
        if (!selectedDriverId && drivers.length > 0) {
            setSelectedDriverId(drivers[0].id)
        }
    }, [drivers, selectedDriverId])

    const selected = drivers.find(d => d.id === selectedDriverId) ?? null

    const pitLog = useMemo(
        () => buildPitLog(replay.pitstops, replay.currentLap),
        [replay.pitstops, replay.currentLap]
    )

    const stintsByDriver = useMemo(
        () => replay.sessionData
            ? buildTireStints({ pitstops: replay.pitstops, results: replay.sessionData.results, currentLap: replay.currentLap, totalLaps: replay.totalLaps })
            : {},
        [replay.sessionData, replay.pitstops, replay.currentLap, replay.totalLaps]
    )
    const driversWithStints = useMemo(
        () => drivers.map(d => ({ ...d, stints: stintsByDriver[d.id] ?? [] })),
        [drivers, stintsByDriver]
    )

    const trackPath = useMemo(
        () => buildTrackPath(replay.track?.coordinates ?? []),
        [replay.track]
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#faf9f6', color: '#191b1e', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <TopBar
                seasons={replay.seasons}
                races={replay.races}
                year={replay.year}
                round={replay.round}
                onSelectYear={replay.selectYear}
                onSelectRace={round => replay.selectRace(replay.year, round)}
                currentLap={replay.currentLap}
                totalLaps={replay.totalLaps}
                isPlaying={replay.isPlaying}
                onPlayPause={() => (replay.isPlaying ? replay.pause() : replay.play())}
                onSeek={replay.seekToLap}
                weather={replay.weather}
                raceName={replay.raceName}
            />
            <TabNav activeTab={activeTab} onChange={setActiveTab} />

            {replay.loading && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b8880' }}>
                    Loading {replay.raceName || 'race'}… (first load of a race can take 30–60s)
                </div>
            )}
            {!replay.loading && replay.error && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c23b3b' }}>
                    Couldn't load this race: {replay.error}. Pick a different race above.
                </div>
            )}
            {!replay.loading && !replay.error && selected && (
                <>
                    {activeTab === 'overview' && (
                        <OverviewTab
                            drivers={driversWithStints}
                            selected={selected}
                            onSelectDriver={setSelectedDriverId}
                            trackPath={trackPath}
                            currentLap={replay.currentLap}
                            progress={replay.progress}
                            totalLaps={replay.totalLaps}
                            telemetry={telemetry}
                        />
                    )}
                    {activeTab === 'timing' && (
                        <TimingTab drivers={driversWithStints} onSelectDriver={setSelectedDriverId} />
                    )}
                    {activeTab === 'strategy' && (
                        <StrategyTab drivers={driversWithStints} pitLog={pitLog} />
                    )}
                    {activeTab === 'telemetry' && (
                        <TelemetryTab
                            drivers={driversWithStints}
                            selected={selected}
                            onSelectDriver={setSelectedDriverId}
                            speedPolyBig={telemetry?.speedPolyBig ?? ''}
                            throttlePolyBig={telemetry?.throttlePolyBig ?? ''}
                            brakePolyBig={telemetry?.brakePolyBig ?? ''}
                            topSpeed={telemetry?.topSpeed ?? 0}
                            avgSpeed={telemetry?.avgSpeed ?? 0}
                            drsCount={telemetry?.drsCount ?? 0}
                        />
                    )}
                </>
            )}
        </div>
    )
}
