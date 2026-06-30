import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import api from '../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const STATUS_BADGE = {
    draft: 'badge-yellow',
    released: 'badge-green',
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function peso(n) {
    return `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function periodLabel(period) {
    if (!period) return '—'
    const range = period.period_type === 'first_half' ? '1st – 15th' : '16th – End'
    return `${MONTHS[period.month - 1]} ${period.year} (${range})`
}

// ─── Modal ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    useEffect(() => {
        function handler(e) { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    )
}

// ─── Payroll Detail ───────────────────────────────────────────────────────

const DEDUCTION_LABEL = {
    sss: 'SSS',
    philhealth: 'PhilHealth',
    pagibig: 'Pag-IBIG',
    tax: 'Withholding Tax',
    custom: 'Other',
}

function PayrollDetail({ payroll, isAdmin, onRelease, releasing }) {
    return (
        <div className="space-y-5">

            {/* Employee + period */}
            <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-gray-800">
                    {payroll.employee?.name ?? '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {payroll.employee?.employee_code} &middot; {periodLabel(payroll.period)}
                </p>
            </div>

            {/* Attendance summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">{payroll.days_worked}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Days Worked</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">{payroll.days_absent}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Days Absent</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-gray-800">{payroll.late_minutes}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Late (mins)</p>
                </div>
            </div>

            {/* Earnings */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Earnings</h3>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Basic Salary</span>
                    <span className="text-sm font-medium text-gray-800">{peso(payroll.basic_salary)}</span>
                </div>
                <div className="flex justify-between items-center py-2 font-medium">
                    <span className="text-sm text-gray-700">Gross Pay</span>
                    <span className="text-sm text-gray-900">{peso(payroll.gross_pay)}</span>
                </div>
            </div>

            {/* Deductions */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deductions</h3>
                {payroll.deductions?.length > 0 ? (
                    payroll.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">
                                {DEDUCTION_LABEL[d.type] ?? d.name}
                            </span>
                            <span className="text-sm text-red-600">- {peso(d.amount)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-400">No deductions.</p>
                )}
                <div className="flex justify-between items-center py-2 font-medium">
                    <span className="text-sm text-gray-700">Total Deductions</span>
                    <span className="text-sm text-red-600">- {peso(payroll.total_deductions)}</span>
                </div>
            </div>

            {/* Net pay */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-900">Net Pay</span>
                <span className="text-lg font-bold text-blue-900">{peso(payroll.net_pay)}</span>
            </div>

            {/* Status + release */}
            <div className="flex items-center justify-between pt-2">
                <span className={STATUS_BADGE[payroll.status] ?? 'badge-gray'}>
                    {payroll.status}
                </span>
                {isAdmin && payroll.status === 'draft' && (
                    <button
                        onClick={() => onRelease(payroll)}
                        disabled={releasing}
                        className="btn-primary"
                    >
                        {releasing ? 'Releasing...' : 'Release payroll'}
                    </button>
                )}
            </div>

        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PayrollPage() {
    const { isAdmin, isAdminOrHr } = useAuth()

    const [records, setRecords] = useState([])
    const [periods, setPeriods] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [filterPeriod, setFilterPeriod] = useState('')
    const [filterYear, setFilterYear] = useState('')

    const [selected, setSelected] = useState(null)
    const [releasing, setReleasing] = useState(false)

    async function fetchPeriods() {
        try {
            const res = await api.get('/payroll-periods')
            setPeriods(res.data?.data ?? res.data ?? [])
        } catch {
            // Non-critical — filter dropdown just won't populate
        }
    }

    async function fetchRecords() {
        setLoading(true)
        setError(null)
        try {
            const params = {}
            if (filterPeriod) params.period_id = filterPeriod
            if (filterYear) params.year = filterYear

            const res = await api.get('/payroll', { params })
            setRecords(res.data?.data ?? res.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load payroll records.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPeriods() }, [])
    useEffect(() => { fetchRecords() }, [filterPeriod, filterYear])

    async function handleRelease(payroll) {
        setReleasing(true)
        try {
            await api.post(`/payroll/${payroll.id}/release`)
            toast.success('Payroll released.')
            setSelected(null)
            fetchRecords()
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Failed to release payroll.')
        } finally {
            setReleasing(false)
        }
    }

    function clearFilters() {
        setFilterPeriod('')
        setFilterYear('')
    }

    // Years available for the year filter, derived from fetched periods
    const years = [...new Set(periods.map((p) => p.year))].sort((a, b) => b - a)

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {isAdminOrHr ? 'All payroll records' : 'Your payroll records'}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="input w-auto text-sm"
                >
                    <option value="">All periods</option>
                    {periods.map((p) => (
                        <option key={p.id} value={p.id}>{periodLabel(p)}</option>
                    ))}
                </select>
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="input w-auto text-sm"
                >
                    <option value="">All years</option>
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                {(filterPeriod || filterYear) && (
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                        Clear filters
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {isAdminOrHr && <th className="th">Employee</th>}
                                <th className="th">Period</th>
                                <th className="th">Gross Pay</th>
                                <th className="th">Deductions</th>
                                <th className="th">Net Pay</th>
                                <th className="th">Status</th>
                                <th className="th w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 7 : 6} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 7 : 6} className="td text-center py-10 text-gray-400">
                                        No payroll records found.
                                    </td>
                                </tr>
                            ) : (
                                records.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                                        {isAdminOrHr && (
                                            <td className="td text-gray-600">{rec.employee?.name ?? '—'}</td>
                                        )}
                                        <td className="td text-gray-500">{periodLabel(rec.period)}</td>
                                        <td className="td">{peso(rec.gross_pay)}</td>
                                        <td className="td text-red-600">- {peso(rec.total_deductions)}</td>
                                        <td className="td font-medium text-gray-900">{peso(rec.net_pay)}</td>
                                        <td className="td">
                                            <span className={STATUS_BADGE[rec.status] ?? 'badge-gray'}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="td">
                                            <button
                                                onClick={() => setSelected(rec)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail modal */}
            {selected && (
                <Modal title="Payroll Details" onClose={() => setSelected(null)}>
                    <PayrollDetail
                        payroll={selected}
                        isAdmin={isAdmin}
                        onRelease={handleRelease}
                        releasing={releasing}
                    />
                </Modal>
            )}

        </div>
    )
}