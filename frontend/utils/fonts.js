import { useEffect } from 'react'

// Loads the APEX fonts (Unbounded / Instrument Sans / JetBrains Mono) while the app is mounted.
const FONT_LINK_ID = 'race-center-fonts'
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap'

export function useAppFonts() {
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
