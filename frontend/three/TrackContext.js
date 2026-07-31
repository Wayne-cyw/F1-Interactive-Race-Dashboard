import { createContext, useContext } from 'react'

export const TrackContext = createContext(null)

export function useTrackCurve() {
    return useContext(TrackContext)
}
