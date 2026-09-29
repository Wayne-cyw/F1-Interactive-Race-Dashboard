import { useEffect, useState } from 'react'

// Minimal path router: two pages, no dependency. `navigate` pushes a history
// entry and notifies every `usePath` subscriber; back/forward fire popstate.
const NAV_EVENT = 'apex:navigate'

export const ROUTES = { landing: '/', race: '/race' }

export function navigate(path) {
    if (window.location.pathname === path) return
    window.history.pushState({}, '', path)
    window.dispatchEvent(new Event(NAV_EVENT))
    window.scrollTo(0, 0)
}

export function usePath() {
    const [path, setPath] = useState(window.location.pathname)
    useEffect(() => {
        const sync = () => setPath(window.location.pathname)
        window.addEventListener('popstate', sync)
        window.addEventListener(NAV_EVENT, sync)
        return () => {
            window.removeEventListener('popstate', sync)
            window.removeEventListener(NAV_EVENT, sync)
        }
    }, [])
    return path
}

// Plain-click handler for <a href> links that should navigate without a reload.
export function linkTo(path) {
    return (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(path)
    }
}
