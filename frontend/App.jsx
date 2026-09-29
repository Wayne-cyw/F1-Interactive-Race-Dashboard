import { useState } from 'react'
import Landing from './pages/landing/Landing'
import LiveRace from './pages/LiveRace'
import { useAppFonts } from './utils/fonts'

export default function App() {
    useAppFonts()
    const [entered, setEntered] = useState(false)

    return entered ? <LiveRace /> : <Landing onEnter={() => setEntered(true)} />
}
