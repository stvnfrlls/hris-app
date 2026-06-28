import { useState, useEffect } from 'react'
import api from '../api/axios'

function BalanceCard({ balance }) {
    const { leave_type, total_days, used_days, remaining_days } = balance

    const percentage = total_days > 0
        ? Math.round((used_days / total_days) * 100)
        : 0

    const barColor = percentage >= 90
        ? 'bg-red-500'
        : percentage >= 60
            ? 'bg-yellow-500'
            : 'bg-green-500'

    return (
        <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-900">{leave_type?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{leave_type?.code}</p>
                </div>
                <span className="text-2xl font-bold text-gray-900">{remaining_days}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {/* Stats row */}
            <div className="flex justify-between text-xs text-gray-500">
                <span>{used_days} used</span>
                <span>{remaining_days} remaining</span>
                <span>{total_days} total</span>
            </div>
        </div>
    )
}

export default function LeaveBalancePage() {
    const [balances, setBalances] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchBalance() {
            try {
                const res = await api.get('/leave-requests/balance')
                setBalances(res.data?.data ?? res.data ?? [])
            } catch (err) {
                setError(err.response?.data?.message ?? 'Failed to load leave balance.')
            } finally {
                setLoading(false)
            }
        }
        fetchBalance()
    }, [])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Leave Balance</h1>
                <p className="text-sm text-gray-500 mt-0.5">Your remaining leave days for this year</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
            ) : balances.length === 0 ? (
                <div className="card p-10 text-center text-gray-400 text-sm">
                    No leave balance found. Apply for leave to initialize your balance.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.map((b) => (
                        <BalanceCard key={b.id} balance={b} />
                    ))}
                </div>
            )}
        </div>
    )
}