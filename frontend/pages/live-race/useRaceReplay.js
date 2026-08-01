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

export function useRaceReplay() {
    const [seasons, setSeasons] = useState([])
    const [races, setRaces] = useState([])
    const [year, setYear] = useState(null)
    const [round, setRound] = useState(null)
    const [bundle, setBundle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [currentLap, setCurrentLap] = useState(1)
    const [progress, setProgress] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)

    // Pick a default race on mount: latest season, round 1. If that
    // session isn't available yet (season in progress), fall back one
    // year — a single retry, not a search loop.
    useEffect(() => {
        let cancelled = false
        async function pickDefault() {
            const seasonsBody = await fetchJSON('/seasons')
            if (cancelled) return
            setSeasons(seasonsBody.seasons)
            const latestYear = seasonsBody.seasons[0]
            try {
                const racesBody = await fetchJSON(`/races/${latestYear}`)
                if (cancelled) return
                setRaces(racesBody.races)
                setYear(latestYear)
                setRound(racesBody.races[0].round)
            } catch {
                if (cancelled) return
                const fallbackYear = latestYear - 1
                const racesBody = await fetchJSON(`/races/${fallbackYear}`)
                if (cancelled) return
                setRaces(racesBody.races)
                setYear(fallbackYear)
                setRound(racesBody.races[0].round)
            }
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
        setCurrentLap(1)
        setProgress(0)
        setIsPlaying(true)
    }, [year, round])

    const totalLaps = bundle?.sessionData?.total_laps ?? 0

    useEffect(() => {
        if (!isPlaying || totalLaps === 0) return
        let raf
        let lastTime = performance.now()

        function tick(now) {
            const deltaSeconds = (now - lastTime) / 1000
            lastTime = now
            setProgress(prevProgress => {
                let nextProgress = prevProgress + deltaSeconds * LAPS_PER_SECOND
                if (nextProgress >= 1) {
                    nextProgress -= 1
                    setCurrentLap(prevLap => Math.min(totalLaps, prevLap + 1))
                }
                return nextProgress
            })
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isPlaying, totalLaps])

    function selectRace(nextYear, nextRound) {
        setYear(nextYear)
        setRound(nextRound)
    }

    async function selectYear(nextYear) {
        const racesBody = await fetchJSON(`/races/${nextYear}`)
        setRaces(racesBody.races)
        selectRace(nextYear, racesBody.races[0].round)
    }

    function play() {
        if (currentLap >= totalLaps) return
        setIsPlaying(true)
    }

    function pause() {
        setIsPlaying(false)
    }

    function seekToLap(lapNumber) {
        setIsPlaying(false)
        setCurrentLap(Math.max(1, Math.min(totalLaps, Math.round(lapNumber))))
        setProgress(0)
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
