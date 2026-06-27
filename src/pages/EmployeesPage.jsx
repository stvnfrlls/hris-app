import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api/axios'

const STATUS_BADGE = {
    active: 'badge-green',
    inactive: 'badge-gray',
    terminated: 'badge-red',
}

const TYPE_BADGE = {
    full_time: 'badge-blue',
    part_time: 'badge-yellow',
    contractual: 'badge-gray',
}

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'admin',
    employee_code: '',
    department: '',
    position: '',
    employment_type: 'full_time',
    hire_date: '',
    status: 'active',
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

function EmployeeForm({ initial = EMPTY_FORM, onSubmit, loading, fieldErrors }) {
    const [form, setForm] = useState(initial)
    const [step, setStep] = useState(1)

    function set(field) {
        return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    function handleNext(e) {
        e.preventDefault()
        setStep(2)
    }

    function handleSubmit(e) {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
                {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${step === s
                                ? 'bg-blue-600 text-white'
                                : step > s
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {s}
                        </div>
                        <span className={`text-xs ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            {s === 1 ? 'Account' : 'Employment'}
                        </span>
                        {s < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
                    </div>
                ))}
            </div>

            {/* Step 1 — account */}
            {step === 1 && (
                <form onSubmit={handleNext} className="space-y-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input
                            value={form.name}
                            onChange={set('name')}
                            className="input"
                            placeholder="Juan dela Cruz"
                            required
                        />
                        {fieldErrors?.name && (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.name[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                            className="input"
                            placeholder="juan@company.com"
                            required
                        />
                        {fieldErrors?.email && (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.email[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={set('password')}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                            {fieldErrors?.password && (
                                <p className="text-xs text-red-600 mt-1">{fieldErrors.password[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={set('password_confirmation')}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Role</label>
                        <select value={form.role} onChange={set('role')} className="input">
                            <option value="admin">Admin</option>
                            <option value="hr">HR</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" className="btn-primary">
                            Next &rarr;
                        </button>
                    </div>
                </form>
            )}

            {/* Step 2 — employment */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Employee Code</label>
                            <input
                                value={form.employee_code}
                                onChange={set('employee_code')}
                                className="input"
                                placeholder="EMP-001"
                            />
                            {fieldErrors?.employee_code && (
                                <p className="text-xs text-red-600 mt-1">{fieldErrors.employee_code[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="label">Department</label>
                            <input
                                value={form.department}
                                onChange={set('department')}
                                className="input"
                                placeholder="Engineering"
                            />
                            {fieldErrors?.department && (
                                <p className="text-xs text-red-600 mt-1">{fieldErrors.department[0]}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="label">Position</label>
                        <input
                            value={form.position}
                            onChange={set('position')}
                            className="input"
                            placeholder="Software Engineer"
                        />
                        {fieldErrors?.position && (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.position[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Employment Type</label>
                            <select value={form.employment_type} onChange={set('employment_type')} className="input">
                                <option value="full_time">Full Time</option>
                                <option value="part_time">Part Time</option>
                                <option value="contractual">Contractual</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status} onChange={set('status')} className="input">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Hire Date</label>
                        <input
                            type="date"
                            value={form.hire_date}
                            onChange={set('hire_date')}
                            className="input"
                        />
                        {fieldErrors?.hire_date && (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.hire_date[0]}</p>
                        )}
                    </div>

                    <div className="flex justify-between pt-2">
                        <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                            &larr; Back
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Save employee'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

function DeleteModal({ employee, onConfirm, onClose, loading }) {
    if (!employee) return null

    return (
        <Modal title="Delete employee" onClose={onClose}>
            <p className="text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-900">{employee.employee_code}</span>?
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

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([])
    const [meta, setMeta] = useState({})
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Modals
    const [addOpen, setAddOpen] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // Form state
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState(null)

    const capitalize = (str) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    async function fetchEmployees(p = 1) {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/employees', { params: { page: p } })
            setEmployees(res.data?.data ?? [])
            setMeta(res.data?.meta ?? {})
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load employees.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees(page)
    }, [page])

    function clearFormErrors() {
        setFormError(null)
        setFieldErrors(null)
    }

    async function handleCreate(data) {
        setFormLoading(true)
        clearFormErrors()
        try {
            const registerRes = await api.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                role: data.role,
            })

            const userId = registerRes.data?.user?.id ?? registerRes.data?.data?.id

            await api.post('/employees', {
                user_id: userId,
                employee_code: data.employee_code,
                department: data.department,
                position: data.position,
                employment_type: data.employment_type,
                hire_date: data.hire_date,
                status: data.status,
            })

            setAddOpen(false)
            fetchEmployees(page)
            toast.success('Employee created successfully.')
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to create employee.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to create employee.')
        } finally {
            setFormLoading(false)
        }
    }

    async function handleUpdate(data) {
        setFormLoading(true)
        clearFormErrors()
        try {
            await api.put(`/employees/${editTarget.id}`, data)
            setEditTarget(null)
            fetchEmployees(page)
            toast.success('Employee updated successfully.')
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to update employee.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to update employee.')
        } finally {
            setFormLoading(false)
        }
    }

    async function handleDelete() {
        setFormLoading(true)
        try {
            await api.delete(`/employees/${deleteTarget.id}`)
            setDeleteTarget(null)
            fetchEmployees(page)
            toast.success('Employee deleted successfully.')
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to delete employee.')
            toast.error(err.response?.data?.message ?? 'Failed to delete employee.')
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Employees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{meta.total ?? 0} total</p>
                </div>
                <button onClick={() => { clearFormErrors(); setAddOpen(true) }} className="btn-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add employee
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
                                <th className="th text-center">Code</th>
                                <th className="th text-center">Department</th>
                                <th className="th text-center">Position</th>
                                <th className="th text-center">Type</th>
                                <th className="th text-center">Hire Date</th>
                                <th className="th text-center">Status</th>
                                <th className="th w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="td text-center py-10 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="td text-center py-10 text-gray-400">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="td text-center text-xs text-gray-500">{emp.employee_code}</td>
                                        <td className="td text-center text-xs">{emp.department}</td>
                                        <td className="td text-center text-xs">{emp.position}</td>
                                        <td className="td text-center text-xs">
                                            <span className={TYPE_BADGE[emp.employment_type] ?? 'badge-gray'}>
                                                {capitalize(emp.employment_type?.replace('_', ' '))}
                                            </span>
                                        </td>
                                        <td className="td text-center text-xs text-gray-500">{emp.hire_date}</td>
                                        <td className="td text-center text-xs">
                                            <span className={STATUS_BADGE[emp.status] ?? 'badge-gray'}>
                                                {capitalize(emp.status)}
                                            </span>
                                        </td>
                                        <td className="td text-center">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { clearFormErrors(); setEditTarget(emp) }}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(emp)}
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

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Page {meta.current_page} of {meta.last_page}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={meta.current_page === 1}
                                className="btn-secondary px-3 py-1.5 text-xs"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={meta.current_page === meta.last_page}
                                className="btn-secondary px-3 py-1.5 text-xs"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add modal */}
            {addOpen && (
                <Modal title="Add employee" onClose={() => setAddOpen(false)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <EmployeeForm
                        onSubmit={handleCreate}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

            {/* Edit modal */}
            {editTarget && (
                <Modal title="Edit employee" onClose={() => setEditTarget(null)}>
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <EmployeeForm
                        initial={editTarget}
                        onSubmit={handleUpdate}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

            {/* Delete modal */}
            <DeleteModal
                employee={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                loading={formLoading}
            />

        </div>
    )
}