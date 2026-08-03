import { useCallback, useEffect, useRef, useState } from 'react'

const LIVE_EDGE_THRESHOLD_PX = 12

// Drives one or more horizontally-scrolling containers (e.g. paired
// throttle/brake charts sharing one timeline) that should track a growing
// `contentWidthPx` and stay pinned to the right ("live") edge as new data
// arrives — the same pattern as a chat log auto-scrolling to the newest
// message. A genuine user-driven horizontal scroll (trackpad, drag, the
// scrollbar) pauses auto-follow so a previous lap stays in view instead of
// being yanked back to "now" mid-look; scrolling back within
// LIVE_EDGE_THRESHOLD_PX of the right edge, or calling `jumpToLive`,
// resumes it. Multiple containers registered via `register(index)` are
// kept in scroll-sync with each other regardless of which one the user is
// dragging. Our own programmatic scrollLeft writes are tagged in
// `pendingProgrammaticRef` so the resulting 'scroll' event isn't
// mistaken for user input — a plain "did the user cause this" flag,
// rather than guessing from wheel/touch/mousedown, which also fire for
// vertical page scrolls that happen to pass over the chart.
export function useFollowScroll(contentWidthPx) {
    const [following, setFollowing] = useState(true)
    const elementsRef = useRef([])
    const pendingProgrammaticRef = useRef(new Set())

    const register = useCallback(index => el => {
        elementsRef.current[index] = el
    }, [])

    const setScrollLeftProgrammatically = useCallback((index, value) => {
        const el = elementsRef.current[index]
        if (!el || Math.abs(el.scrollLeft - value) < 1) return
        pendingProgrammaticRef.current.add(index)
        el.scrollLeft = value
    }, [])

    const syncScrollLeft = useCallback((scrollLeft, sourceIndex) => {
        elementsRef.current.forEach((el, i) => {
            if (el && i !== sourceIndex) setScrollLeftProgrammatically(i, scrollLeft)
        })
    }, [setScrollLeftProgrammatically])

    useEffect(() => {
        if (!following) return
        elementsRef.current.forEach((el, i) => {
            if (el) setScrollLeftProgrammatically(i, contentWidthPx - el.clientWidth)
        })
    }, [contentWidthPx, following, setScrollLeftProgrammatically])

    const onScroll = useCallback(index => e => {
        if (pendingProgrammaticRef.current.delete(index)) return

        const el = e.currentTarget
        syncScrollLeft(el.scrollLeft, index)
        setFollowing(el.scrollWidth - el.scrollLeft - el.clientWidth < LIVE_EDGE_THRESHOLD_PX)
    }, [syncScrollLeft])

    const jumpToLive = useCallback(() => setFollowing(true), [])

    return { following, register, onScroll, jumpToLive }
}
