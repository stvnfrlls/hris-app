import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function currentMonth() { return new Date().getMonth() + 1 }
function currentYear() { return new Date().getFullYear() }

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function TableSkeleton() {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>
    )
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, loading }) {
    const colors = {
        green: 'text-green-600 bg-green-50',
        yellow: 'text-yellow-600 bg-yellow-50',
        red: 'text-red-600 bg-red-50',
        blue: 'text-blue-600 bg-blue-50',
    }

    return (
        <div className="card p-5">
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            {loading
                ? <Skeleton className="h-8 w-16" />
                : <p className={`text-2xl font-semibold rounded px-2 py-0.5 inline-block ${colors[color]}`}>
                    {value ?? 0}
                </p>
            }
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AttendanceSummaryPage() {
    const [month, setMonth] = useState(currentMonth())
    const [year, setYear] = useState(currentYear())

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function fetchReport() {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/reports/attendance-summary', {
                params: { month, year },
            })
            setReport(res.data)
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load attendance summary.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchReport() }, [month, year])

    const totals = report?.totals ?? {}
    const data = report?.data ?? []

    // Top 10 for the bar chart
    const chartData = data.slice(0, 10).map((e) => ({
        name: e.name.split(' ')[0], // first name only to keep labels short
        Present: e.present_count,
        Late: e.late_count,
        Absent: e.absent_count,
    }))

    // Build year options — current year ± 2
    const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

    return (
        <div>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Attendance Summary</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {MONTHS[month - 1]} {year}
                    </p>
                </div>

                {/* Month / Year pickers */}
                <div className="flex items-center gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="input w-auto text-sm"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="input w-auto text-sm"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Present" value={totals.total_present} color="green" loading={loading} />
                <StatCard label="Total Late" value={totals.total_late} color="yellow" loading={loading} />
                <StatCard label="Total Absent" value={totals.total_absent} color="red" loading={loading} />
                <StatCard label="Total Half Day" value={totals.total_half_day} color="blue" loading={loading} />
            </div>

            {/* Bar chart */}
            <div className="card p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    Present vs Late vs Absent — Top 10 Employees
                </h2>
                {loading ? (
                    <Skeleton className="h-56 w-full" />
                ) : chartData.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No data for this period.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="th">Employee</th>
                                    <th className="th">Code</th>
                                    <th className="th text-center">Present</th>
                                    <th className="th text-center">Late</th>
                                    <th className="th text-center">Absent</th>
                                    <th className="th text-center">Half Day</th>
                                    <th className="th text-center">Total Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="td text-center py-10 text-gray-400">
                                            No attendance records for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => (
                                        <tr key={row.employee_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="td font-medium text-gray-800">{row.name}</td>
                                            <td className="td font-mono text-xs text-gray-500">{row.employee_code}</td>
                                            <td className="td text-center">
                                                <span className="badge-green">{row.present_count}</span>
                                            </td>
                                            <td className="td text-center">
                                                <span className={row.late_count > 0 ? 'badge-yellow' : 'text-gray-400 text-sm'}>
                                                    {row.late_count}
                                                </span>
                                            </td>
                                            <td className="td text-center">
                                                <span className={row.absent_count > 0 ? 'badge-red' : 'text-gray-400 text-sm'}>
                                                    {row.absent_count}
                                                </span>
                                            </td>
                                            <td className="td text-center">
                                                <span className={row.half_day_count > 0 ? 'badge-blue' : 'text-gray-400 text-sm'}>
                                                    {row.half_day_count}
                                                </span>
                                            </td>
                                            <td className="td text-center text-gray-600">{row.total_days}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    )
}