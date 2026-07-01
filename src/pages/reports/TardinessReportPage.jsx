import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function currentMonth() { return new Date().getMonth() + 1 }
function currentYear() { return new Date().getFullYear() }

// Color scale — more late = more red
function barColor(count, max) {
    const ratio = max > 0 ? count / max : 0
    if (ratio >= 0.75) return '#ef4444'
    if (ratio >= 0.4) return '#f59e0b'
    return '#3b82f6'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function TardinessReportPage() {
    const [month, setMonth] = useState(currentMonth())
    const [year, setYear] = useState(currentYear())

    const [data, setData] = useState([])
    const [period, setPeriod] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

    async function fetchReport() {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/reports/tardiness', { params: { month, year } })
            setData(res.data?.data ?? [])
            setPeriod(res.data?.period ?? null)
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load tardiness report.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchReport() }, [month, year])

    const max = data[0]?.late_count ?? 1

    // Top 10 for chart
    const chartData = data.slice(0, 10).map((e) => ({
        name: e.name.split(' ')[0],
        Late: e.late_count,
    }))

    return (
        <div>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Tardiness Report</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {MONTHS[month - 1]} {year}
                    </p>
                </div>

                {/* Pickers */}
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

            {/* Summary badge */}
            {!loading && !error && (
                <div className="mb-6">
                    {data.length === 0 ? (
                        <div className="card p-10 text-center">
                            <p className="text-2xl mb-2">🎉</p>
                            <p className="text-sm font-medium text-gray-700">No late employees this period</p>
                            <p className="text-xs text-gray-400 mt-1">
                                All employees arrived on time in {MONTHS[month - 1]} {year}.
                            </p>
                        </div>
                    ) : (
                        <div className="card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {data.length} employee{data.length !== 1 ? 's' : ''} arrived late
                                </p>
                                <p className="text-xs text-gray-400">
                                    Top offender: <span className="font-medium text-gray-600">{data[0]?.name}</span> with{' '}
                                    <span className="font-medium text-red-600">{data[0]?.late_count}</span> late arrival{data[0]?.late_count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {data.length > 0 && (
                <>
                    {/* Horizontal bar chart */}
                    <div className="card p-6 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">
                            Top Offenders — Late Arrivals
                        </h2>
                        {loading ? (
                            <Skeleton className="h-56 w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 160)}>
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={72} />
                                    <Tooltip
                                        formatter={(value) => [`${value} late arrival${value !== 1 ? 's' : ''}`, 'Count']}
                                    />
                                    <Bar dataKey="Late" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={barColor(entry.Late, max)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Table */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="space-y-2 p-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="th w-10">#</th>
                                            <th className="th">Employee</th>
                                            <th className="th">Code</th>
                                            <th className="th text-center">Late Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((row, i) => (
                                            <tr key={row.employee_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="td text-gray-400 text-xs">{i + 1}</td>
                                                <td className="td font-medium text-gray-800">{row.name}</td>
                                                <td className="td font-mono text-xs text-gray-500">{row.employee_code}</td>
                                                <td className="td text-center">
                                                    <span className={
                                                        row.late_count >= 5
                                                            ? 'badge-red'
                                                            : row.late_count >= 3
                                                                ? 'badge-yellow'
                                                                : 'badge-blue'
                                                    }>
                                                        {row.late_count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

        </div>
    )
}