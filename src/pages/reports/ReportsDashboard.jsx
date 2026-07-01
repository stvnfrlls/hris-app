import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

function peso(n) {
    return `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Summary Card ─────────────────────────────────────────────────────────

function ReportCard({ to, title, description, icon }) {
    return (
        <Link
            to={to}
            className="card p-6 hover:shadow-md transition-shadow group block"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
            </div>
        </Link>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ReportsDashboard() {
    const [headcount, setHeadcount] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchHeadcount() {
            try {
                const res = await api.get('/reports/headcount')
                setHeadcount(res.data)
            } catch (err) {
                setError(err.response?.data?.message ?? 'Failed to load headcount.')
            } finally {
                setLoading(false)
            }
        }
        fetchHeadcount()
    }, [])

    const pieData = headcount?.by_department?.map((d) => ({
        name: d.department,
        value: d.count,
    })) ?? []

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-500 mt-0.5">Overview of workforce and payroll data</p>
            </div>

            {/* Report links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <ReportCard
                    to="/reports/attendance"
                    title="Attendance Summary"
                    description="Monthly breakdown of present, late, and absent days per employee."
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                />
                <ReportCard
                    to="/reports/tardiness"
                    title="Tardiness Report"
                    description="Employees ranked by number of late arrivals for the month."
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <ReportCard
                    to="/reports/payroll-summary"
                    title="Payroll Summary"
                    description="Gross pay, deductions, and net pay grouped by department."
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <ReportCard
                    to="/reports/headcount"
                    title="Headcount"
                    description="Workforce breakdown by department, employment type, and status."
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />
            </div>

            {/* Headcount overview */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-800">Headcount by Department</h2>
                    {headcount && (
                        <span className="text-sm text-gray-500">
                            {headcount.total_employees} total employees
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : pieData.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                            >
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

        </div>
    )
}