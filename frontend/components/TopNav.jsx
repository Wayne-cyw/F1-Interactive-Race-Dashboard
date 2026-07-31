import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
    { to: '/',          label: 'Race Analysis' },
    { to: '/standings', label: 'Standings'     },
    { to: '/teams',     label: 'Teams'         },
    { to: '/live',      label: 'Live Race'     },
]

export default function TopNav() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <nav className="topnav">
            {/* Logo */}
            <a className="topnav-logo" href="/" onClick={() => setMobileOpen(false)}>
                <span className="topnav-logo-symbol">◈</span>
                <span className="topnav-logo-text">F1 Dashboard</span>
            </a>

            {/* Center nav links — desktop */}
            <div className="topnav-links">
                {NAV_ITEMS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        {label}
                    </NavLink>
                ))}
            </div>

            {/* Right side */}
            <div className="topnav-right">
                <div className="nav-status" title="Connected" />
                {/* Mobile hamburger */}
                <button
                    className="topnav-hamburger"
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile dropdown */}
            <div className={`topnav-mobile-menu${mobileOpen ? ' open' : ''}`}>
                {NAV_ITEMS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        {label}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
