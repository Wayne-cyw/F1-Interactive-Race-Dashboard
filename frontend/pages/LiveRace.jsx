import { useEffect, useMemo, useRef, useState } from 'react'
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
import { buildTrackScene } from './live-race/trackGeometry3d'
import { sliceTelemetry } from './live-race/telemetrySlice'
import { computeDnfInfo } from './live-race/dnf'
import { deriveCurrentTrackStatus } from './live-race/trackStatus'
import LoadingScreen from './live-race/LoadingScreen'
import { LABEL } from './live-race/ui'

export default function LiveRace() {
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedDriverId, setSelectedDriverId] = useState(null)

    const replay = useRaceReplay()

    // Hold the loading screen ~1s after a successful load so its lights-out
    // finish plays; a failed load drops straight to the error message.
    const [finishing, setFinishing] = useState(false)
    const wasLoading = useRef(false)
    useEffect(() => {
        if (replay.loading) {
            wasLoading.current = true
            setFinishing(false)
            return
        }
        if (!wasLoading.current || replay.error) return
        wasLoading.current = false
        setFinishing(true)
        const t = setTimeout(() => setFinishing(false), 1000)
        return () => clearTimeout(t)
    }, [replay.loading, replay.error])
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

    const trackScene = useMemo(
        () => buildTrackScene(replay.track?.coordinates ?? []),
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--surface-000)', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
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

            {(replay.loading || finishing) && (
                <LoadingScreen
                    label={replay.raceName}
                    progress={replay.loadProgress.fraction}
                    stage={replay.loadProgress.stage}
                    done={!replay.loading}
                />
            )}
            {!replay.loading && replay.error && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-text)' }}>
                    Couldn't load this race: {replay.error}. Pick a different race above.
                </div>
            )}
            {!replay.loading && !replay.error && !selected && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LABEL }}>
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
                            trackScene={trackScene}
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
                            speedScrollPoly={telemetry?.speedScrollPoly ?? ''}
                            throttleScrollPoly={telemetry?.throttleScrollPoly ?? ''}
                            brakeScrollPoly={telemetry?.brakeScrollPoly ?? ''}
                            scrollContentWidthPx={telemetry?.scrollContentWidthPx ?? 0}
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
