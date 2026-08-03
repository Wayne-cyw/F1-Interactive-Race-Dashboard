import { useEffect, useMemo, useState } from 'react'
import TopBar from './live-race/TopBar'
import TabNav from './live-race/TabNav'
import OverviewTab from './live-race/OverviewTab'
import TimingTab from './live-race/TimingTab'
import StrategyTab from './live-race/StrategyTab'
import TelemetryTab from './live-race/TelemetryTab'
import PlaybackBar from './live-race/PlaybackBar'
import { useRaceReplay } from './live-race/useRaceReplay'
import { useDriverTelemetry } from './live-race/useDriverTelemetry'
import { buildLeaderboardRows, deriveBestSectors } from './live-race/leaderboardData'
import { buildPitLog, buildTireStints } from './live-race/stints'
import { buildTrackPath } from './live-race/trackMap'
import { sliceTelemetry } from './live-race/telemetrySlice'
import { computeDnfInfo } from './live-race/dnf'
import { deriveCurrentTrackStatus } from './live-race/trackStatus'

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
    const { points: telemetryPoints } = useDriverTelemetry(replay.year, replay.round, selectedDriverId)

    const positionsByDriver = useMemo(
        () => Object.fromEntries((replay.positions ?? []).map(d => [d.driver, d.points])),
        [replay.positions]
    )

    const dnfInfo = useMemo(() => {
        if (!replay.sessionData) return new Map()
        return computeDnfInfo({
            results: replay.sessionData.results,
            laps: replay.sessionData.laps,
            totalDurationSeconds: replay.totalDurationSeconds,
        })
    }, [replay.sessionData, replay.totalDurationSeconds])

    const drivers = useMemo(() => {
        if (!replay.sessionData) return []
        return buildLeaderboardRows({
            laps: replay.sessionData.laps,
            results: replay.sessionData.results,
            pitstops: replay.pitstops,
            currentLap: replay.currentLap,
            selectedDriverId,
            dnfInfo,
            elapsedSeconds: replay.elapsedSeconds,
        })
    }, [replay.sessionData, replay.pitstops, replay.currentLap, selectedDriverId, dnfInfo, replay.elapsedSeconds])

    const bestSectors = useMemo(() => deriveBestSectors(drivers), [drivers])

    // Default the selected driver to the race leader once data first loads,
    // and re-default if a season switch drops the previously-selected driver
    // (e.g. they didn't race in the newly selected year).
    useEffect(() => {
        if (drivers.length === 0) return
        if (!selectedDriverId || !drivers.some(d => d.id === selectedDriverId)) {
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
            ? buildTireStints({ pitstops: replay.pitstops, results: replay.sessionData.results, laps: replay.sessionData.laps, currentLap: replay.currentLap, totalLaps: replay.totalLaps })
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

    const currentTrackStatus = useMemo(
        () => deriveCurrentTrackStatus(replay.elapsedSeconds, replay.trackStatus),
        [replay.elapsedSeconds, replay.trackStatus]
    )

    const telemetry = useMemo(
        () => sliceTelemetry(telemetryPoints, replay.elapsedSeconds),
        [telemetryPoints, replay.elapsedSeconds]
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
                weather={replay.weather}
                raceName={replay.raceName}
                trackStatus={replay.sessionData ? currentTrackStatus : null}
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
            {!replay.loading && !replay.error && !selected && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b8880' }}>
                    No driver data available for this session.
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
                            positions={positionsByDriver}
                            elapsedSeconds={replay.elapsedSeconds}
                            telemetry={telemetry}
                            bestSectors={bestSectors}
                        />
                    )}
                    {activeTab === 'timing' && (
                        <TimingTab drivers={driversWithStints} onSelectDriver={setSelectedDriverId} />
                    )}
                    {activeTab === 'strategy' && (
                        <StrategyTab drivers={driversWithStints} pitLog={pitLog} currentLap={replay.currentLap} totalLaps={replay.totalLaps} />
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
                            currentGear={telemetry?.current?.gear ?? null}
                        />
                    )}
                    <PlaybackBar
                        isPlaying={replay.isPlaying}
                        onPlayPause={() => (replay.isPlaying ? replay.pause() : replay.play())}
                        elapsedSeconds={replay.elapsedSeconds}
                        totalDurationSeconds={replay.totalDurationSeconds}
                        currentLap={replay.currentLap}
                        totalLaps={replay.totalLaps}
                        onSeek={replay.seekToSeconds}
                        playbackSpeed={replay.playbackSpeed}
                        onSpeedChange={replay.setPlaybackSpeed}
                    />
                </>
            )}
        </div>
    )
}
