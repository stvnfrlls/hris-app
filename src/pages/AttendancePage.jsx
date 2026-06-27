import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import api from '../api/axios'

const STATUS_BADGE = {
    present: 'badge-green',
    late: 'badge-yellow',
    absent: 'badge-red',
    half_day: 'badge-blue',
}

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

function EditAttendanceForm({ initial, onSubmit, loading }) {
    const [form, setForm] = useState({
        clock_in: initial?.clock_in ?? '',
        clock_out: initial?.clock_out ?? '',
        status: initial?.status ?? 'present',
        remarks: initial?.remarks ?? '',
    })

    function set(field) {
        return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    function handleSubmit(e) {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Clock In</label>
                    <input type="time" value={form.clock_in} onChange={set('clock_in')} className="input" />
                </div>
                <div>
                    <label className="label">Clock Out</label>
                    <input type="time" value={form.clock_out} onChange={set('clock_out')} className="input" />
                </div>
            </div>

            <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={set('status')} className="input">
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                </select>
            </div>

            <div>
                <label className="label">Remarks</label>
                <input
                    type="text"
                    value={form.remarks}
                    onChange={set('remarks')}
                    className="input"
                    placeholder="Optional notes"
                />
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Save changes'}
                </button>
            </div>
        </form>
    )
}

export default function AttendancePage() {
    const { isAdminOrHr } = useAuth()

    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editTarget, setEditTarget] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState(null)

    const [filterDate, setFilterDate] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const capitalize = (str) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    async function fetchRecords() {
        setLoading(true)
        setError(null)
        try {
            const params = {}
            if (filterDate) params.date = filterDate
            if (filterStatus) params.status = filterStatus

            const res = await api.get('/attendance', { params })
            setRecords(res.data?.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load attendance.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRecords()
    }, [filterDate, filterStatus])

    async function handleUpdate(data) {
        setFormLoading(true)
        setFormError(null)
        try {
            await api.put(`/attendance/${editTarget.id}`, data)
            setEditTarget(null)
            fetchRecords()
            toast.success('Attendance record updated.')
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to update record.')
            toast.error(err.response?.data?.message ?? 'Failed to update record.')
        } finally {
            setFormLoading(false)
        }
    }

    function clearFilters() {
        setFilterDate('')
        setFilterStatus('')
    }

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {isAdminOrHr ? 'All attendance records' : 'Your attendance history'}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="input w-auto text-sm"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input w-auto text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                </select>
                {(filterDate || filterStatus) && (
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                        Clear filters
                    </button>
                )}
            </div>

            {/* Error */}
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
                                <th className="th text-center">Date</th>
                                {isAdminOrHr && <th className="th text-center">Employee</th>}
                                <th className="th text-center">Clock In</th>
                                <th className="th text-center">Clock Out</th>
                                <th className="th text-center">Status</th>
                                <th className="th text-center">Remarks</th>
                                {isAdminOrHr && <th className="th w-16"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 7 : 5} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 7 : 5} className="td text-center py-10 text-gray-400">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                records.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="td text-center text-xs text-gray-500">{rec.date}</td>
                                        {isAdminOrHr && (
                                            <td className="td text-center text-gray-600 text-xs">{rec.employee?.employee_code ?? '—'}</td>
                                        )}
                                        <td className="td text-center text-xs">{rec.clock_in ?? '—'}</td>
                                        <td className="td text-center text-xs">{rec.clock_out ?? '—'}</td>
                                        <td className="td text-center">
                                            <span className={STATUS_BADGE[rec.status] ?? 'badge-gray'}>
                                                {capitalize(rec.status?.replace('_', ' '))}
                                            </span>
                                        </td>
                                        <td className="td text-center text-gray-500 text-xs">{capitalize(rec.remarks ?? '—')}</td>
                                        {isAdminOrHr && (
                                            <td className="td">
                                                <button
                                                    onClick={() => { setFormError(null); setEditTarget(rec) }}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit modal (admin/hr only) */}
            {editTarget && (
                <Modal title="Edit attendance record" onClose={() => setEditTarget(null)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <EditAttendanceForm
                        initial={editTarget}
                        onSubmit={handleUpdate}
                        loading={formLoading}
                    />
                </Modal>
            )}

        </div>
    )
}