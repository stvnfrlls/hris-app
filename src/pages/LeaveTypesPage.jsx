import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api/axios'

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

// ─── Leave Type Form ──────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', code: '', days_allowed: '' }

function LeaveTypeForm({ initial = EMPTY_FORM, onSubmit, loading, fieldErrors }) {
    const [form, setForm] = useState(initial)

    function set(field) {
        return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">

            <div>
                <label className="label">Name</label>
                <input
                    value={form.name}
                    onChange={set('name')}
                    required
                    className="input"
                    placeholder="Vacation Leave"
                />
                {fieldErrors?.name && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.name[0]}</p>
                )}
            </div>

            <div>
                <label className="label">Code</label>
                <input
                    value={form.code}
                    onChange={set('code')}
                    required
                    className="input"
                    placeholder="VL"
                />
                {fieldErrors?.code && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.code[0]}</p>
                )}
            </div>

            <div>
                <label className="label">Days Allowed</label>
                <input
                    type="number"
                    min="1"
                    value={form.days_allowed}
                    onChange={set('days_allowed')}
                    required
                    className="input"
                    placeholder="15"
                />
                {fieldErrors?.days_allowed && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.days_allowed[0]}</p>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Save leave type'}
                </button>
            </div>

        </form>
    )
}

// ─── Delete confirmation ──────────────────────────────────────────────────

function DeleteModal({ leaveType, onConfirm, onClose, loading }) {
    if (!leaveType) return null

    return (
        <Modal title="Delete leave type" onClose={onClose}>
            <p className="text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-900">{leaveType.name}</span>?
                This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={onConfirm} disabled={loading} className="btn-danger">
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </Modal>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LeaveTypesPage() {
    const [leaveTypes, setLeaveTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [addOpen, setAddOpen] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState(null)

    async function fetchLeaveTypes() {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/leave-types')
            setLeaveTypes(res.data?.data ?? res.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load leave types.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLeaveTypes() }, [])

    function clearFormErrors() {
        setFormError(null)
        setFieldErrors(null)
    }

    async function handleCreate(data) {
        setFormLoading(true)
        clearFormErrors()
        try {
            await api.post('/leave-types', data)
            toast.success('Leave type created.')
            setAddOpen(false)
            fetchLeaveTypes()
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to create leave type.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to create leave type.')
        } finally {
            setFormLoading(false)
        }
    }

    async function handleUpdate(data) {
        setFormLoading(true)
        clearFormErrors()
        try {
            await api.put(`/leave-types/${editTarget.id}`, data)
            toast.success('Leave type updated.')
            setEditTarget(null)
            fetchLeaveTypes()
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to update leave type.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to update leave type.')
        } finally {
            setFormLoading(false)
        }
    }

    async function handleDelete() {
        setFormLoading(true)
        try {
            await api.delete(`/leave-types/${deleteTarget.id}`)
            toast.success('Leave type deleted.')
            setDeleteTarget(null)
            fetchLeaveTypes()
        } catch (err) {
            toast.error(err.response?.data?.message ?? 'Failed to delete leave type.')
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Leave Types</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{leaveTypes.length} types configured</p>
                </div>
                <button
                    onClick={() => { clearFormErrors(); setAddOpen(true) }}
                    className="btn-primary"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add leave type
                </button>
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
                                <th className="th">Name</th>
                                <th className="th">Code</th>
                                <th className="th">Days Allowed</th>
                                <th className="th">Status</th>
                                <th className="th w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : leaveTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="td text-center py-10 text-gray-400">
                                        No leave types found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                leaveTypes.map((lt) => (
                                    <tr key={lt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="td font-medium text-gray-800">{lt.name}</td>
                                        <td className="td font-mono text-xs text-gray-500">{lt.code}</td>
                                        <td className="td">{lt.days_allowed} days</td>
                                        <td className="td">
                                            {lt.is_active
                                                ? <span className="badge-green">Active</span>
                                                : <span className="badge-gray">Inactive</span>
                                            }
                                        </td>
                                        <td className="td">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { clearFormErrors(); setEditTarget(lt) }}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(lt)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add modal */}
            {addOpen && (
                <Modal title="Add leave type" onClose={() => setAddOpen(false)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <LeaveTypeForm
                        onSubmit={handleCreate}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

            {/* Edit modal */}
            {editTarget && (
                <Modal title="Edit leave type" onClose={() => setEditTarget(null)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <LeaveTypeForm
                        initial={editTarget}
                        onSubmit={handleUpdate}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

            {/* Delete modal */}
            <DeleteModal
                leaveType={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={formLoading}
            />

        </div>
    )
}