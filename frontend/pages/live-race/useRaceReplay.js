import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'

const LAPS_PER_SECOND = 0.6

async function loadSessionBundle(year, round) {
    const [sessionData, pitstopsBody, weatherBody, trackBody] = await Promise.all([
        fetchJSON(`/session/${year}/${round}/R`),
        fetchJSON(`/pitstops/${year}/${round}`),
        fetchJSON(`/weather/${year}/${round}`),
        fetchJSON(`/track/${year}/${round}`),
    ])
    return {
        sessionData,
        pitstops: pitstopsBody.pit_stops,
        weather: weatherBody.weather,
        track: trackBody.track,
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

    const [elapsed, setElapsed] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)

    // Pick a default race on mount: the latest season's most recently
    // completed race. If the latest season has no completed races yet
    // (season not started), fall back one year — a single retry, not a
    // search loop.
    useEffect(() => {
        let cancelled = false
        async function pickDefault() {
            const seasonsBody = await fetchJSON('/seasons')
            if (cancelled) return
            setSeasons(seasonsBody.seasons)
            const latestYear = seasonsBody.seasons[0]

            const racesBody = await fetchJSON(`/races/${latestYear}`)
            if (cancelled) return
            const round = latestRunRound(racesBody.races)
            if (round != null) {
                setRaces(racesBody.races)
                setYear(latestYear)
                setRound(round)
                return
            }

            // Latest season has no completed races yet — fall back one year
            // (a single retry, not a search loop) and use its last race.
            const fallbackYear = latestYear - 1
            const fallbackRacesBody = await fetchJSON(`/races/${fallbackYear}`)
            if (cancelled) return
            const fallbackRound = latestRunRound(fallbackRacesBody.races) ?? fallbackRacesBody.races[0].round
            setRaces(fallbackRacesBody.races)
            setYear(fallbackYear)
            setRound(fallbackRound)
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
        loadSessionBundle(year, round)
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
        setElapsed(0)
        setIsPlaying(true)
    }, [year, round])

    const totalLaps = bundle?.sessionData?.total_laps ?? 0
    const currentLap = totalLaps ? Math.min(totalLaps, Math.floor(elapsed) + 1) : 1
    const progress = elapsed % 1

    useEffect(() => {
        if (!isPlaying || totalLaps === 0) return
        let raf
        let lastTime = performance.now()

        function tick(now) {
            const deltaSeconds = (now - lastTime) / 1000
            lastTime = now
            setElapsed(prev => Math.min(totalLaps - 0.001, prev + deltaSeconds * LAPS_PER_SECOND))
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isPlaying, totalLaps])

    // Auto-pause once the replay reaches the final lap, instead of looping
    // the animation frame forever after the race is over.
    useEffect(() => {
        if (totalLaps && currentLap >= totalLaps) setIsPlaying(false)
    }, [currentLap, totalLaps])

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
        if (currentLap >= totalLaps) {
            setElapsed(0)
        }
        setIsPlaying(true)
    }

    function pause() {
        setIsPlaying(false)
    }

    function seekToLap(lapNumber) {
        setIsPlaying(false)
        const clamped = Math.max(1, Math.min(totalLaps, Math.round(lapNumber)))
        setElapsed(clamped - 1)
    }

    const raceName = races.find(r => r.round === round)?.name ?? ''

    return {
        year, round, raceName, races, seasons,
        selectRace, selectYear,
        sessionData: bundle?.sessionData ?? null,
        pitstops: bundle?.pitstops ?? [],
        weather: bundle?.weather ?? null,
        track: bundle?.track ?? null,
        loading, error,
        currentLap, progress, totalLaps, isPlaying,
        play, pause, seekToLap,
    }
}
