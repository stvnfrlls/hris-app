import { useState, useEffect } from 'react'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function peso(n) {
    return `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function periodLabel(p) {
    if (!p) return '—'
    const range = p.period_type === 'first_half' ? '1st – 15th' : '16th – End'
    return `${MONTHS[p.month - 1]} ${p.year} (${range})`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ label, value, loading }) {
    return (
        <div className="card p-5">
            <p className="text-xs text-gray-500 mb-2">{label}</p>
            {loading
                ? <Skeleton className="h-7 w-32" />
                : <p className="text-xl font-semibold text-gray-900">{value}</p>
            }
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PayrollSummaryPage() {
    const [periods, setPeriods] = useState([])
    const [selectedPeriod, setSelectedPeriod] = useState('')

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch payroll periods for the dropdown
    useEffect(() => {
        async function fetchPeriods() {
            try {
                const res = await api.get('/payroll-periods')
                const list = res.data?.data ?? res.data ?? []
                setPeriods(list)
            } catch {
                // Non-critical — report still loads without the filter
            }
        }
        fetchPeriods()
    }, [])

    // Fetch report whenever period changes
    useEffect(() => {
        async function fetchReport() {
            setLoading(true)
            setError(null)
            try {
                const params = {}
                if (selectedPeriod) params.payroll_period_id = selectedPeriod

                const res = await api.get('/reports/payroll-summary', { params })
                setReport(res.data)
            } catch (err) {
                setError(err.response?.data?.message ?? 'Failed to load payroll summary.')
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [selectedPeriod])

    const totals = report?.totals ?? {}
    const data = report?.data ?? []

    // Pie chart data — gross pay by department
    const pieData = data.map((d) => ({
        name: d.department,
        value: Number(d.total_gross_pay),
    }))

    return (
        <div>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Payroll Summary</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {selectedPeriod
                            ? periodLabel(periods.find((p) => String(p.id) === String(selectedPeriod)))
                            : 'Current period'
                        }
                    </p>
                </div>

                {/* Period filter */}
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="input w-auto text-sm"
                >
                    <option value="">Current period</option>
                    {periods.map((p) => (
                        <option key={p.id} value={p.id}>{periodLabel(p)}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Employees" value={totals.employee_count} loading={loading} />
                <StatCard label="Total Gross Pay" value={peso(totals.total_gross_pay)} loading={loading} />
                <StatCard label="Total Deductions" value={peso(totals.total_deductions)} loading={loading} />
                <StatCard label="Total Net Pay" value={peso(totals.total_net_pay)} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Pie chart */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Gross Pay Distribution by Department
                    </h2>
                    {loading ? (
                        <Skeleton className="h-56 w-full" />
                    ) : pieData.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">No data available.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => peso(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Quick totals breakdown */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Pay Breakdown</h2>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Gross Pay</span>
                                <span className="text-sm font-medium text-gray-900">{peso(totals.total_gross_pay)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Total Deductions</span>
                                <span className="text-sm font-medium text-red-600">- {peso(totals.total_deductions)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
                                <span className="text-sm font-semibold text-blue-900">Net Pay</span>
                                <span className="text-sm font-bold text-blue-900">{peso(totals.total_net_pay)}</span>
                            </div>
                            <p className="text-xs text-gray-400 pt-1">
                                Covering {totals.employee_count ?? 0} employee{totals.employee_count !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Department table */}
            <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-700">By Department</h2>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="th">Department</th>
                                    <th className="th text-center">Employees</th>
                                    <th className="th text-right">Gross Pay</th>
                                    <th className="th text-right">Deductions</th>
                                    <th className="th text-right">Net Pay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="td text-center py-10 text-gray-400">
                                            No payroll data for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {data.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="td font-medium text-gray-800">{row.department}</td>
                                                <td className="td text-center text-gray-500">{row.employee_count}</td>
                                                <td className="td text-right">{peso(row.total_gross_pay)}</td>
                                                <td className="td text-right text-red-600">- {peso(row.total_deductions)}</td>
                                                <td className="td text-right font-medium text-gray-900">{peso(row.total_net_pay)}</td>
                                            </tr>
                                        ))}
                                        {/* Totals row */}
                                        <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                            <td className="td text-gray-700">Total</td>
                                            <td className="td text-center text-gray-700">{totals.employee_count}</td>
                                            <td className="td text-right text-gray-700">{peso(totals.total_gross_pay)}</td>
                                            <td className="td text-right text-red-600">- {peso(totals.total_deductions)}</td>
                                            <td className="td text-right text-gray-900">{peso(totals.total_net_pay)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    )
}