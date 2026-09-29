import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'
import { deriveCurrentLap } from './raceClock'
import { computeLoadProgress } from './loadProgress'

const DEFAULT_YEAR = 2025
const RENDER_INTERVAL_MS = 33 // throttle re-renders to ~30Hz

async function loadSessionBundle(year, round, onStep) {
    const step = (id, promise) => promise.then(body => { onStep(id); return body })
    const [sessionData, pitstopsBody, weatherBody, trackBody, positionsBody, trackStatusBody] = await Promise.all([
        step('session', fetchJSON(`/session/${year}/${round}/R`)),
        step('pitstops', fetchJSON(`/pitstops/${year}/${round}`)),
        step('weather', fetchJSON(`/weather/${year}/${round}`)),
        step('track', fetchJSON(`/track/${year}/${round}`)),
        step('positions', fetchJSON(`/positions/${year}/${round}`)),
        step('trackStatus', fetchJSON(`/track-status/${year}/${round}`).catch(() => ({ track_status: [] }))),
    ])
    return {
        sessionData,
        pitstops: pitstopsBody.pit_stops,
        weather: weatherBody.weather,
        track: trackBody.track,
        positions: positionsBody.drivers,
        trackStatus: trackStatusBody.track_status,
    }
}

function latestRunRound(races) {
    const today = new Date().toISOString().slice(0, 10)
    const run = races.filter(r => r.date && r.date <= today)
    return run.length ? run[run.length - 1].round : null
}

export function useRaceReplay() {
    const [seasons, setSeasons] = useState([])
    const [races, setRaces] = useState([])
    const [year, setYear] = useState(null)
    const [round, setRound] = useState(null)
    const [bundle, setBundle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [doneSteps, setDoneSteps] = useState(() => new Set())

    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [clockEpoch, setClockEpoch] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    // Pick a default race on mount: the DEFAULT_YEAR season's most recently
    // completed race (its last round once the season is over). If that season
    // isn't available, fall back to the latest season.
    useEffect(() => {
        let cancelled = false
        async function pickDefault() {
            const seasonsBody = await fetchJSON('/seasons')
            if (cancelled) return
            setSeasons(seasonsBody.seasons)
            const defaultYear = seasonsBody.seasons.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : seasonsBody.seasons[0]

            const racesBody = await fetchJSON(`/races/${defaultYear}`)
            if (cancelled) return
            const round = latestRunRound(racesBody.races) ?? racesBody.races[0].round
            setRaces(racesBody.races)
            setYear(defaultYear)
            setRound(round)
            setDoneSteps(prev => new Set(prev).add('schedule'))
        }
        pickDefault().catch(err => {
            if (!cancelled) {
                setError(err.message)
                setLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [])

    // Fetch this race's session bundle whenever the selection changes.
    useEffect(() => {
        if (!year || !round) return
        let cancelled = false
        setLoading(true)
        setError(null)
        // Keep the schedule step (already done); re-track the per-race fetches.
        setDoneSteps(prev => new Set([...prev].filter(id => id === 'schedule')))
        loadSessionBundle(year, round, id => {
            if (!cancelled) setDoneSteps(prev => new Set(prev).add(id))
        })
            .then(result => {
                if (cancelled) return
                setBundle(result)
                setLoading(false)
            })
            .catch(err => {
                if (cancelled) return
                setError(err.message)
                setBundle(null)
                setLoading(false)
            })
        return () => { cancelled = true }
    }, [year, round])

    // Reset playback to the start whenever a new race is selected.
    useEffect(() => {
        setElapsedSeconds(0)
        setIsPlaying(true)
        setClockEpoch(e => e + 1)
    }, [year, round])

    const totalLaps = bundle?.sessionData?.total_laps ?? 0
    const totalDurationSeconds = bundle?.sessionData?.race_duration_seconds ?? 0
    const currentLap = bundle?.sessionData ? deriveCurrentLap(elapsedSeconds, bundle.sessionData.laps) : 1

    // Advances the real-time clock every animation frame for accurate
    // pacing (1 played second = 1 real race second), but only commits a
    // state update — and therefore a re-render — every RENDER_INTERVAL_MS
    // (30Hz), not on every frame (~60Hz). `elapsedSeconds` is deliberately
    // read once as this effect's starting point and NOT listed as a
    // dependency: the effect only needs to restart on play/pause or a race
    // change (both already covered by the dependency array), not on every
    // 30Hz tick it produces itself.
    useEffect(() => {
        if (!isPlaying || loading || totalDurationSeconds === 0) return
        let raf
        let lastFrameTime = performance.now()
        let lastRenderTime = lastFrameTime
        let localElapsed = elapsedSeconds

        function tick(now) {
            const deltaSeconds = (now - lastFrameTime) / 1000
            lastFrameTime = now
            localElapsed = Math.min(totalDurationSeconds, localElapsed + deltaSeconds * playbackSpeed)
            if (now - lastRenderTime >= RENDER_INTERVAL_MS) {
                lastRenderTime = now
                setElapsedSeconds(localElapsed)
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, totalDurationSeconds, clockEpoch, playbackSpeed, loading])

    // Auto-pause once the replay reaches the end, instead of looping the
    // animation frame forever after the race is over.
    useEffect(() => {
        if (totalDurationSeconds && elapsedSeconds >= totalDurationSeconds) setIsPlaying(false)
    }, [elapsedSeconds, totalDurationSeconds])

    function selectRace(nextYear, nextRound) {
        setYear(nextYear)
        setRound(nextRound)
    }

    async function selectYear(nextYear) {
        try {
            const racesBody = await fetchJSON(`/races/${nextYear}`)
            if (racesBody.races.length === 0) {
                setError(`No races found for ${nextYear}`)
                return
            }
            setRaces(racesBody.races)
            selectRace(nextYear, racesBody.races[0].round)
        } catch (err) {
            setError(err.message)
        }
    }

    function play() {
        if (elapsedSeconds >= totalDurationSeconds) {
            setElapsedSeconds(0)
            setClockEpoch(e => e + 1)
        }
        setIsPlaying(true)
    }

    function pause() {
        setIsPlaying(false)
    }

    function seekToSeconds(seconds) {
        setIsPlaying(false)
        setElapsedSeconds(Math.max(0, Math.min(totalDurationSeconds, seconds)))
        setClockEpoch(e => e + 1)
    }

    const loadProgress = computeLoadProgress(doneSteps)

    const raceName = races.find(r => r.round === round)?.name ?? ''

    return {
        year, round, raceName, races, seasons,
        selectRace, selectYear,
        sessionData: bundle?.sessionData ?? null,
        pitstops: bundle?.pitstops ?? [],
        weather: bundle?.weather ?? null,
        track: bundle?.track ?? null,
        positions: bundle?.positions ?? [],
        trackStatus: bundle?.trackStatus ?? [],
        loading, error, loadProgress,
        currentLap, totalLaps, elapsedSeconds, totalDurationSeconds, isPlaying,
        play, pause, seekToSeconds,
        playbackSpeed, setPlaybackSpeed,
    }
}
