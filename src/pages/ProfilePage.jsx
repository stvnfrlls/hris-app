import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
            <dt className="w-36 shrink-0 text-sm text-gray-500">{label}</dt>
            <dd className="text-sm font-medium text-gray-800">{value ?? '—'}</dd>
        </div>
    )
}

export default function ProfilePage() {
    const { user: cachedUser } = useAuth()

    const [user, setUser] = useState(cachedUser)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchMe() {
            try {
                const res = await api.get('/auth/me')
                setUser(res.data)
            } catch (err) {
                setError(err.response?.data?.message ?? 'Failed to load profile.')
            } finally {
                setLoading(false)
            }
        }

        fetchMe()
    }, [])

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : '?'

    const roles = user?.roles
        ?.map((r) => r.name ?? r)
        .join(', ') ?? '—'

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : '—'

    if (loading) {
        return (
            <div className="text-sm text-gray-400 py-10 text-center">Loading...</div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
            </div>
        )
    }

    return (
        <div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-500 mt-0.5">Your account information</p>
            </div>

            <div className="max-w-lg">
                <div className="card p-6">

                    {/* Avatar + name */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>

                    {/* Info */}
                    <dl>
                        <InfoRow label="Full name" value={user?.name} />
                        <InfoRow label="Email" value={user?.email} />
                        <InfoRow label="Role" value={roles} />
                        <InfoRow label="Account ID" value={`#${user?.id}`} />
                        <InfoRow label="Member since" value={memberSince} />
                    </dl>

                </div>
            </div>

        </div>
    )
}