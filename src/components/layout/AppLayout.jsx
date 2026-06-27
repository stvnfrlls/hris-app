import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        adminHrOnly: false,
    },
    {
        to: '/employees',
        label: 'Employees',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        adminHrOnly: true,
    },
    {
        to: '/attendance',
        label: 'Attendance',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        adminHrOnly: false,
    },
    {
        to: '/profile',
        label: 'Profile',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        adminHrOnly: false,
    },
]

function Sidebar({ onClose }) {
    const { user, isAdminOrHr, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/login', { replace: true })
    }

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : '?'

    const visibleNav = NAV_ITEMS.filter((item) => {
        if (item.adminHrOnly) return isAdminOrHr
        return true
    })

    return (
        <div className="flex flex-col h-full">

            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-200 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <span className="font-semibold text-gray-900">HRIS</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {visibleNav.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div className="border-t border-gray-200 p-3 shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                </button>
            </div>

        </div>
    )
}

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">

            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-200 shrink-0">
                <Sidebar />
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-white border-r border-gray-200 transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

                {/* Mobile topbar */}
                <header className="flex items-center gap-3 md:hidden h-16 px-4 bg-white border-b border-gray-200 shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-semibold text-gray-900">HRIS</span>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    )
}