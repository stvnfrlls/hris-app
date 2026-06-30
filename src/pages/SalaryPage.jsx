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

// ─── Salary Form ──────────────────────────────────────────────────────────

function SalaryForm({ employee, initial, onSubmit, loading, fieldErrors }) {
    const [basicSalary, setBasicSalary] = useState(initial?.basic_salary ?? '')

    function handleSubmit(e) {
        e.preventDefault()
        onSubmit({ basic_salary: basicSalary })
    }

    // Live hourly rate preview — assumes 8 hours/day, 22 working days/month
    const hourlyPreview = basicSalary
        ? (Number(basicSalary) / 22 / 8).toFixed(2)
        : null

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-gray-800">
                    {employee?.user?.name ?? employee?.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{employee?.employee_code}</p>
            </div>

            <div>
                <label className="label">Basic Salary (Monthly)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    required
                    className="input"
                    placeholder="25000.00"
                />
                {fieldErrors?.basic_salary && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.basic_salary[0]}</p>
                )}
                {hourlyPreview && (
                    <p className="text-xs text-gray-400 mt-1">
                        Approx. hourly rate: ₱{hourlyPreview}
                    </p>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : 'Save salary'}
                </button>
            </div>
        </form>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function SalaryPage() {
    const [employees, setEmployees] = useState([])
    const [salaries, setSalaries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalTarget, setModalTarget] = useState(null) // { employee, salary | null }
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState(null)

    async function fetchData() {
        setLoading(true)
        setError(null)
        try {
            const [empRes, salRes] = await Promise.all([
                api.get('/employees'),
                api.get('/salary'),
            ])
            setEmployees(empRes.data?.data ?? [])
            setSalaries(salRes.data?.data ?? salRes.data ?? [])
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to load salary data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Match a salary record to an employee
    function salaryFor(employeeId) {
        return salaries.find((s) => s.employee?.id === employeeId)
    }

    function clearFormErrors() {
        setFormError(null)
        setFieldErrors(null)
    }

    function openModal(employee, salary) {
        clearFormErrors()
        setModalTarget({ employee, salary })
    }

    async function handleSubmit(data) {
        setFormLoading(true)
        clearFormErrors()
        const { employee, salary } = modalTarget

        try {
            if (salary) {
                // Update existing salary
                await api.put(`/salary/${employee.id}`, data)
                toast.success('Salary updated.')
            } else {
                // Create new salary
                await api.post('/salary', { employee_id: employee.id, ...data })
                toast.success('Salary added.')
            }
            setModalTarget(null)
            fetchData()
        } catch (err) {
            setFormError(err.response?.data?.message ?? 'Failed to save salary.')
            setFieldErrors(err.response?.data?.errors ?? null)
            toast.error(err.response?.data?.message ?? 'Failed to save salary.')
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Salary Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">{employees.length} employees</p>
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
                                <th className="th">Employee</th>
                                <th className="th">Code</th>
                                <th className="th">Basic Salary</th>
                                <th className="th">Hourly Rate</th>
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
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="td text-center py-10 text-gray-400">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => {
                                    const salary = salaryFor(emp.id)
                                    return (
                                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="td font-medium text-gray-800">
                                                {emp.user?.name ?? '—'}
                                            </td>
                                            <td className="td font-mono text-xs text-gray-500">{emp.employee_code}</td>
                                            <td className="td">
                                                {salary
                                                    ? `₱${Number(salary.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                                    : <span className="text-gray-400">Not set</span>
                                                }
                                            </td>
                                            <td className="td">
                                                {salary
                                                    ? `₱${Number(salary.hourly_rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                                    : '—'
                                                }
                                            </td>
                                            <td className="td">
                                                <button
                                                    onClick={() => openModal(emp, salary)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    {salary ? 'Edit' : 'Add salary'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit modal */}
            {modalTarget && (
                <Modal
                    title={modalTarget.salary ? 'Edit salary' : 'Add salary'}
                    onClose={() => setModalTarget(null)}
                >
                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                            {formError}
                        </div>
                    )}
                    <SalaryForm
                        employee={modalTarget.employee}
                        initial={modalTarget.salary}
                        onSubmit={handleSubmit}
                        loading={formLoading}
                        fieldErrors={fieldErrors}
                    />
                </Modal>
            )}

        </div>
    )
}