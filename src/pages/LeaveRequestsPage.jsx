import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import api from '../api/axios'
import ApplyLeaveModal from '../components/ApplyLeaveModal'

// ─── Helpers ──────────────────────────────────────────────────────────────

const STATUS_BADGE = {
    pending: 'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red',
    cancelled: 'badge-gray',
}

// ─── Reject Modal ─────────────────────────────────────────────────────────

function RejectModal({ request, onClose, onSuccess }) {
    const [remarks, setRemarks] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        function handler(e) { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!remarks.trim()) {
            setError('Remarks are required when rejecting a request.')
            return
        }
        setLoading(true)
        setError(null)
        try {
            await api.post(`/leave-requests/${request.id}/reject`, { remarks })
            toast.success('Leave request rejected.')
            onSuccess()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to reject request.')
            toast.error(err.response?.data?.message ?? 'Failed to reject request.')
        } finally {
            setLoading(false)
        }
    }

    if (!request) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Reject Leave Request</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600 mb-4">
                        Rejecting leave request from{' '}
                        <span className="font-medium text-gray-900">
                            {request.employee?.name ?? request.employee?.employee_code}
                        </span>{' '}
                        for{' '}
                        <span className="font-medium text-gray-900">{request.leave_type?.name}</span>.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">
                                Remarks <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={remarks}
                                onChange={(e) => { setRemarks(e.target.value); setError(null) }}
                                className="input resize-none"
                                placeholder="Reason for rejection..."
                            />
                            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn-danger">
                                {loading ? 'Rejecting...' : 'Reject request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LeaveRequestsPage() {
    const { isAdminOrHr } = useAuth()

    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filterStatus, setFilterStatus] = useState('')

    const [applyOpen, setApplyOpen] = useState(false)
    const [rejectTarget, setRejectTarget] = useState(null)
    const [actionLoading, setActionLoading] = useState(null) // holds id of row being acted on

    async function fetchRequests() {
        setLoading(true)
        setError(null)
        try {
            const params = {}
            if (filterStatus) params.status = filterStatus
            const res = await api.get('/leave-requests', { params })
            setRequests(res.data?.data ?? res.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load leave requests.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchRequests() }, [filterStatus])

    async function handleApprove(request) {
        setActionLoading(request.id)
        try {
            await api.post(`/leave-requests/${request.id}/approve`)
            toast.success('Leave request approved.')
            fetchRequests()
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Failed to approve request.')
        } finally {
            setActionLoading(null)
        }
    }

    async function handleCancel(request) {
        setActionLoading(request.id)
        try {
            await api.post(`/leave-requests/${request.id}/cancel`)
            toast.success('Leave request cancelled.')
            fetchRequests()
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Failed to cancel request.')
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Leave Requests</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isAdminOrHr ? 'All employee leave requests' : 'Your leave requests'}
                    </p>
                </div>
                <button onClick={() => setApplyOpen(true)} className="btn-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Apply for leave
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-5">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input w-auto text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                {filterStatus && (
                    <button onClick={() => setFilterStatus('')} className="text-sm text-blue-600 hover:underline">
                        Clear
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
                                {isAdminOrHr && <th className="th">Employee</th>}
                                <th className="th">Leave Type</th>
                                <th className="th">Start Date</th>
                                <th className="th">End Date</th>
                                <th className="th">Days</th>
                                <th className="th">Status</th>
                                <th className="th">Reason</th>
                                <th className="th w-32"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 8 : 7} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHr ? 8 : 7} className="td text-center py-10 text-gray-400">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        {isAdminOrHr && (
                                            <td className="td font-mono text-xs text-gray-500">
                                                {req.employee?.name ?? req.employee?.employee_code ?? '—'}
                                            </td>
                                        )}
                                        <td className="td">{req.leave_type?.name ?? '—'}</td>
                                        <td className="td text-gray-500">{req.start_date}</td>
                                        <td className="td text-gray-500">{req.end_date}</td>
                                        <td className="td text-center">{req.days_requested}</td>
                                        <td className="td">
                                            <span className={STATUS_BADGE[req.status] ?? 'badge-gray'}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="td text-gray-500 text-xs max-w-xs truncate">
                                            {req.reason ?? '—'}
                                        </td>
                                        <td className="td">
                                            <div className="flex items-center gap-2">
                                                {/* Admin/HR actions — approve and reject on pending */}
                                                {isAdminOrHr && req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(req)}
                                                            disabled={actionLoading === req.id}
                                                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                                                        >
                                                            {actionLoading === req.id ? '...' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectTarget(req)}
                                                            disabled={actionLoading === req.id}
                                                            className="text-xs text-red-500 hover:underline disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {/* Employee actions — cancel on pending or approved */}
                                                {!isAdminOrHr && (req.status === 'pending' || req.status === 'approved') && (
                                                    <button
                                                        onClick={() => handleCancel(req)}
                                                        disabled={actionLoading === req.id}
                                                        className="text-xs text-gray-500 hover:underline disabled:opacity-50"
                                                    >
                                                        {actionLoading === req.id ? '...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply modal */}
            {applyOpen && (
                <ApplyLeaveModal
                    onClose={() => setApplyOpen(false)}
                    onSuccess={() => { setApplyOpen(false); fetchRequests() }}
                />
            )}

            {/* Reject modal */}
            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onSuccess={fetchRequests}
                />
            )}

        </div>
    )
}