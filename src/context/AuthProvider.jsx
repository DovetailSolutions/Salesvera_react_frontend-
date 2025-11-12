import React, { createContext, useState, useEffect } from 'react'
import { authApi } from '../api/index'
import axiosInstance from '../api/axiosInstance'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        // Get stored tokens and user
        const storedAccessToken = localStorage.getItem('accessToken')
        const storedRefreshToken = localStorage.getItem('refreshToken')
        const storedUser = localStorage.getItem('user')

        // Restore tokens to axios if available
        if (storedAccessToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
        }

        // Restore user from localStorage if exists
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }

        // Optionally verify the session by hitting getProfile()
        const r = await authApi.getProfile()
        setUser(r.data)
      } catch (e) {
        console.warn('Auth init failed:', e)
        logout() // clear everything if token invalid
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (credentials) => {
    const r = await authApi.login(credentials)
    const { accessToken, refreshToken, user } = r.data.data

    if (accessToken) {
      // Store tokens and user in localStorage
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('roles',user.role)

      // Set Authorization header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }

    setUser(user)
    return r
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore logout errors
    }

    // Clear everything
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    delete axiosInstance.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
