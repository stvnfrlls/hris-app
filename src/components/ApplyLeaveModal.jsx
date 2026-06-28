import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api/axios'

export default function ApplyLeaveModal({ onClose, onSuccess }) {
    const [leaveTypes, setLeaveTypes] = useState([])
    const [balances, setBalances] = useState([])
    const [loadingInit, setLoadingInit] = useState(true)

    const [form, setForm] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    })

    const [fieldErrors, setFieldErrors] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        function handler(e) { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        async function init() {
            try {
                const [typesRes, balanceRes] = await Promise.all([
                    api.get('/leave-types'),
                    api.get('/leave-requests/balance'),
                ])
                setLeaveTypes(typesRes.data?.data ?? typesRes.data ?? [])
                setBalances(balanceRes.data?.data ?? balanceRes.data ?? [])
            } catch {
                toast.error('Could not load leave types.')
            } finally {
                setLoadingInit(false)
            }
        }
        init()
    }, [])

    function set(field) {
        return (e) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }))
            setFieldErrors((prev) => ({ ...prev, [field]: null }))
            setError(null)
        }
    }

    // Find balance for selected leave type
    const selectedBalance = balances.find(
        (b) => String(b.leave_type?.id) === String(form.leave_type_id)
    )

    // Client-side date validation
    function validate() {
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            setFieldErrors((prev) => ({
                ...prev,
                end_date: ['End date must be on or after start date.'],
            }))
            return false
        }
        return true
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        setError(null)
        setFieldErrors(null)

        try {
            await api.post('/leave-requests', {
                leave_type_id: form.leave_type_id,
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason || undefined,
            })
            toast.success('Leave request submitted.')
            onSuccess()
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to submit leave request.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to submit leave request.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Apply for Leave</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5">
                    {loadingInit ? (
                        <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                                    {error}
                                </div>
                            )}

                            {/* Leave type */}
                            <div>
                                <label className="label">Leave Type</label>
                                <select
                                    value={form.leave_type_id}
                                    onChange={set('leave_type_id')}
                                    required
                                    className="input"
                                >
                                    <option value="">Select leave type</option>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id} value={lt.id}>
                                            {lt.name} ({lt.code})
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors?.leave_type_id && (
                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.leave_type_id[0]}</p>
                                )}

                                {/* Balance indicator */}
                                {selectedBalance && (
                                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                        Balance: {' '}
                                        <span className="font-medium text-gray-800">
                                            {selectedBalance.remaining_days} remaining
                                        </span>
                                        {' '} of {selectedBalance.total_days} days
                                        {' '}({selectedBalance.used_days} used)
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Start Date</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={set('start_date')}
                                        required
                                        className="input"
                                    />
                                    {fieldErrors?.start_date && (
                                        <p className="text-xs text-red-600 mt-1">{fieldErrors.start_date[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={set('end_date')}
                                        required
                                        min={form.start_date || undefined}
                                        className="input"
                                    />
                                    {fieldErrors?.end_date && (
                                        <p className="text-xs text-red-600 mt-1">{fieldErrors.end_date[0]}</p>
                                    )}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="label">Reason <span className="text-gray-400">(optional)</span></label>
                                <textarea
                                    rows={3}
                                    value={form.reason}
                                    onChange={set('reason')}
                                    className="input resize-none"
                                    placeholder="Briefly describe your reason..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={onClose} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Submitting...' : 'Submit request'}
                                </button>
                            </div>

                        </form>
                    )}
                </div>

            </div>
        </div>
    )
}