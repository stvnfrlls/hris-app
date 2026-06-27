import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import api from '../api/axios'

function greeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
}

function today() {
    return new Date().toISOString().split('T')[0]
}

function formatTime(t) {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const d = new Date()
    d.setHours(+h, +m)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, color }) {
    const colors = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
    }
    return (
        <div className="card p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-semibold mt-1 ${colors[color] ?? 'text-gray-900'}`}>
                {value ?? '—'}
            </p>
        </div>
    )
}

function ClockWidget() {
    const [record, setRecord] = useState(null)
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(false)
    const pendingRef = useRef(false)

    async function fetchToday() {
        try {
            const res = await api.get('/attendance', { params: { date: today() } })
            setRecord(res.data?.data?.[0] ?? null)
        } catch {
            toast.error('Could not load attendance.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchToday() }, [])

    async function handleClockIn() {
        if (pendingRef.current || record?.clock_in) return
        pendingRef.current = true
        setActing(true)
        try {
            await api.post('/attendance/clock-in')
            await fetchToday()
            toast.success('Clocked in successfully.')
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Clock in failed.')
        } finally {
            pendingRef.current = false
            setActing(false)
        }
    }

    async function handleClockOut() {
        if (pendingRef.current || record?.clock_out) return
        pendingRef.current = true
        setActing(true)
        try {
            await api.post('/attendance/clock-out')
            await fetchToday()
            toast.success('Clocked out successfully.')
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Clock out failed.')
        } finally {
            pendingRef.current = false
            setActing(false)
        }
    }

    const isClockedIn = Boolean(record?.clock_in)
    const isClockedOut = Boolean(record?.clock_out)

    const statusBadge = {
        present: 'badge-green',
        late: 'badge-yellow',
        absent: 'badge-red',
        half_day: 'badge-blue',
    }

    return (
        <div className="card p-6 max-w-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Attendance</h2>
            {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
            ) : (
                <div className="space-y-4">
                    {record?.status && (
                        <span className={statusBadge[record.status] ?? 'badge-gray'}>
                            {record.status.replace('_', ' ')}
                        </span>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Clock In</p>
                            <p className="text-lg font-semibold text-gray-800">{formatTime(record?.clock_in)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Clock Out</p>
                            <p className="text-lg font-semibold text-gray-800">{formatTime(record?.clock_out)}</p>
                        </div>
                    </div>
                    <div>
                        {!isClockedIn && (
                            <button onClick={handleClockIn} disabled={acting} className="btn-primary w-full">
                                {acting ? 'Clocking in...' : 'Clock In'}
                            </button>
                        )}
                        {isClockedIn && !isClockedOut && (
                            <button onClick={handleClockOut} disabled={acting} className="btn-secondary w-full">
                                {acting ? 'Clocking out...' : 'Clock Out'}
                            </button>
                        )}
                        {isClockedOut && (
                            <p className="text-sm text-center text-green-600 font-medium">✓ Shift complete</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function AdminSummary() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const [empRes, attRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/attendance', { params: { date: today() } }),
                ])
                const employees = empRes.data?.data ?? []
                const attendance = attRes.data?.data ?? []
                setStats({
                    total: employees.length,
                    present: attendance.filter((a) => a.status === 'present').length,
                    late: attendance.filter((a) => a.status === 'late').length,
                    absent: attendance.filter((a) => a.status === 'absent').length,
                })
            } catch {
                toast.error('Could not load dashboard stats.')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <p className="text-sm text-gray-400">Loading...</p>

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Employees" value={stats?.total} color="blue" />
            <StatCard label="Present Today" value={stats?.present} color="green" />
            <StatCard label="Late Today" value={stats?.late} color="yellow" />
            <StatCard label="Absent Today" value={stats?.absent} color="red" />
        </div>
    )
}

export default function DashboardPage() {
    const { user, isAdminOrHr } = useAuth()
    const firstName = user?.name?.split(' ')[0] ?? 'there'
    const dateLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">{greeting()}, {firstName}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
            </div>
            {isAdminOrHr ? <AdminSummary /> : <ClockWidget />}
        </div>
    )
}