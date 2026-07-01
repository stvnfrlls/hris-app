import { useState, useEffect } from 'react'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

const STATUS_COLORS = {
    active: '#10b981',
    inactive: '#94a3b8',
    terminated: '#ef4444',
}

const TYPE_LABELS = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractual: 'Contractual',
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Chart Card ───────────────────────────────────────────────────────────

function ChartCard({ title, loading, children }) {
    return (
        <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
            {loading
                ? <Skeleton className="h-52 w-full" />
                : children
            }
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HeadcountPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchReport() {
            setLoading(true)
            setError(null)
            try {
                const res = await api.get('/reports/headcount')
                setData(res.data)
            } catch (err) {
                setError(err.response?.data?.message ?? 'Failed to load headcount report.')
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [])

    // Chart data
    const deptPieData = (data?.by_department ?? []).map((d) => ({
        name: d.department,
        value: d.count,
    }))

    const typePieData = (data?.by_employment_type ?? []).map((d) => ({
        name: TYPE_LABELS[d.employment_type] ?? capitalize(d.employment_type),
        value: d.count,
    }))

    const statusBarData = (data?.by_status ?? []).map((d) => ({
        name: capitalize(d.status),
        Count: d.count,
        fill: STATUS_COLORS[d.status] ?? '#94a3b8',
    }))

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Headcount</h1>
                <p className="text-sm text-gray-500 mt-0.5">Workforce breakdown across the organization</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Total employees card */}
            <div className="card p-6 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div>
                    {loading
                        ? <Skeleton className="h-8 w-16 mb-1" />
                        : <p className="text-3xl font-bold text-gray-900">{data?.total_employees ?? 0}</p>
                    }
                    <p className="text-sm text-gray-500">Total Employees</p>
                </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* By department */}
                <ChartCard title="By Department" loading={loading}>
                    {deptPieData.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={deptPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name} (${value})`}
                                    labelLine={false}
                                >
                                    {deptPieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* By employment type */}
                <ChartCard title="By Employment Type" loading={loading}>
                    {typePieData.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={typePieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {typePieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

            </div>

            {/* By status bar chart */}
            <ChartCard title="By Employment Status" loading={loading}>
                {statusBarData.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                            data={statusBarData}
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                                {statusBarData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Breakdown tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* By department */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">By Department</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="th">Department</th>
                                    <th className="th text-center">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data?.by_department ?? []).map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="td text-gray-700">{d.department}</td>
                                        <td className="td text-center font-medium text-gray-900">{d.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* By employment type */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">By Employment Type</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="th">Type</th>
                                    <th className="th text-center">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data?.by_employment_type ?? []).map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="td text-gray-700">
                                            {TYPE_LABELS[d.employment_type] ?? capitalize(d.employment_type)}
                                        </td>
                                        <td className="td text-center font-medium text-gray-900">{d.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* By status */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">By Status</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="th">Status</th>
                                    <th className="th text-center">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data?.by_status ?? []).map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="td">
                                            <span className={
                                                d.status === 'active' ? 'badge-green' :
                                                    d.status === 'terminated' ? 'badge-red' : 'badge-gray'
                                            }>
                                                {capitalize(d.status)}
                                            </span>
                                        </td>
                                        <td className="td text-center font-medium text-gray-900">{d.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>

        </div>
    )
}