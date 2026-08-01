import { useEffect, useState } from 'react'
import { fetchJSON } from '../../utils/api'

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
        pickDefault().catch(err => !cancelled && setError(err.message))
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

    function selectRace(nextYear, nextRound) {
        setYear(nextYear)
        setRound(nextRound)
    }

    async function selectYear(nextYear) {
        const racesBody = await fetchJSON(`/races/${nextYear}`)
        setRaces(racesBody.races)
        selectRace(nextYear, racesBody.races[0].round)
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
    }
}
