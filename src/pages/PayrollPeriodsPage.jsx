import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api/axios'

// ─── Helpers ──────────────────────────────────────────────────────────────

const STATUS_BADGE = {
    draft: 'badge-gray',
    processed: 'badge-blue',
    released: 'badge-green',
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function currentYear() {
    return new Date().getFullYear()
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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

// ─── Create Period Form ───────────────────────────────────────────────────

function CreatePeriodForm({ onSubmit, loading, fieldErrors }) {
    const [form, setForm] = useState({
        month: new Date().getMonth() + 1,
        year: currentYear(),
        period_type: 'first_half',
    })

    function set(field) {
        return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Month</label>
                    <select value={form.month} onChange={set('month')} className="input">
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    {fieldErrors?.month && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.month[0]}</p>
                    )}
                </div>
                <div>
                    <label className="label">Year</label>
                    <input
                        type="number"
                        value={form.year}
                        onChange={set('year')}
                        className="input"
                    />
                    {fieldErrors?.year && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.year[0]}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="label">Period Type</label>
                <select value={form.period_type} onChange={set('period_type')} className="input">
                    <option value="first_half">1st – 15th</option>
                    <option value="second_half">16th – End of Month</option>
                </select>
                {fieldErrors?.period_type && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.period_type[0]}</p>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Creating...' : 'Create period'}
                </button>
            </div>

        </form>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PayrollPeriodsPage() {
    const [periods, setPeriods] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState(null)

    // Tracks which period is currently generating payroll
    const [generatingId, setGeneratingId] = useState(null)

    async function fetchPeriods() {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/payroll-periods')
            setPeriods(res.data?.data ?? res.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load payroll periods.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPeriods() }, [])

    async function handleCreate(data) {
        setFormLoading(true)
        setFormError(null)
        setFieldErrors(null)
        try {
            await api.post('/payroll-periods', data)
            toast.success('Payroll period created.')
            setCreateOpen(false)
            fetchPeriods()
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to create period.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to create period.')
        } finally {
            setFormLoading(false)
        }
    }

    async function handleGenerate(period) {
        setGeneratingId(period.id)
        try {
            await api.post('/payroll/generate', { payroll_period_id: period.id })
            toast.success('Payroll generated successfully.')
            fetchPeriods()
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Failed to generate payroll.')
        } finally {
            setGeneratingId(null)
        }
    }

    function periodLabel(p) {
        return p.period_type === 'first_half' ? '1st – 15th' : '16th – End of Month'
    }

    return (
        <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Payroll Periods</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{periods.length} periods</p>
                </div>
                <button onClick={() => { setFormError(null); setFieldErrors(null); setCreateOpen(true) }} className="btn-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New period
                </button>
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
                                <th className="th">Month / Year</th>
                                <th className="th">Period</th>
                                <th className="th">Start Date</th>
                                <th className="th">End Date</th>
                                <th className="th">Status</th>
                                <th className="th w-36"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : periods.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="td text-center py-10 text-gray-400">
                                        No payroll periods yet. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                periods.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="td font-medium text-gray-800">
                                            {MONTHS[p.month - 1]} {p.year}
                                        </td>
                                        <td className="td text-gray-500">{periodLabel(p)}</td>
                                        <td className="td text-gray-500">{p.start_date}</td>
                                        <td className="td text-gray-500">{p.end_date}</td>
                                        <td className="td">
                                            <span className={STATUS_BADGE[p.status] ?? 'badge-gray'}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="td">
                                            {p.status === 'draft' ? (
                                                <button
                                                    onClick={() => handleGenerate(p)}
                                                    disabled={generatingId === p.id}
                                                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                                >
                                                    {generatingId === p.id ? 'Generating...' : 'Generate payroll'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    {p.status === 'processed' ? 'Already generated' : 'Released'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create modal */}
            {createOpen && (
                <Modal title="Create payroll period" onClose={() => setCreateOpen(false)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <CreatePeriodForm
                        onSubmit={handleCreate}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

        </div>
    )
}