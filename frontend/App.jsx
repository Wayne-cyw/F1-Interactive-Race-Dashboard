import Landing from './pages/landing/Landing'
import LiveRace from './pages/LiveRace'
import { useAppFonts } from './utils/fonts'
import { ROUTES, navigate, usePath } from './utils/navigation'

export default function App() {
    useAppFonts()
    const path = usePath()

    // Landing lives at "/", the Race Center at "/race"; unknown paths get the landing page.
    return path.replace(/\/+$/, '') === ROUTES.race
        ? <LiveRace />
        : <Landing onEnter={() => navigate(ROUTES.race)} />
}
