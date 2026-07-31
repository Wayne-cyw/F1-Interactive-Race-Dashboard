import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Background3D from './three/Background3D'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Standings = lazy(() => import('./pages/Standings'))
const Teams     = lazy(() => import('./pages/Teams'))
const LiveRace  = lazy(() => import('./pages/LiveRace'))

export default function App() {
    return (
        <BrowserRouter>
            {/* Persistent star-field background on all routes */}
            <Background3D />

            <div className="app-layout" style={{ position: 'relative', zIndex: 1 }}>
                <TopNav />
                <main className="main-content">
                    <Suspense fallback={
                        <div className="loading">
                            <div className="loading-spinner"></div>
                        </div>
                    }>
                        <Routes>
                            <Route path="/"          element={<Dashboard />} />
                            <Route path="/standings" element={<Standings />} />
                            <Route path="/teams"     element={<Teams />} />
                            <Route path="/live"      element={<LiveRace />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </BrowserRouter>
    )
}
