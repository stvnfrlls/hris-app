import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute() {
    const { token } = useAuth()
    const location = useLocation()

    if (!token) {
        // Save where they were trying to go so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Outlet />
}