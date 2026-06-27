import { createContext, useState } from 'react'
import api from '../api/axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    async function login(email, password) {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setToken(token)
        setUser(user)
    }

    async function logout() {
        try {
            await api.post('/auth/logout')
        } catch {
            // If the request fails, still clear local state
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
        }
    }

    function hasRole(role) {
        if (!user?.roles) return false
        return user.roles.some((r) => r.name === role || r === role)
    }

    const isAdmin = hasRole('admin')
    const isHr = hasRole('hr')
    const isAdminOrHr = isAdmin || isHr

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isHr, isAdminOrHr }}>
            {children}
        </AuthContext.Provider>
    )
}