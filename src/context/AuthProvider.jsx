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
        const r = await authApi.getProfile()
        setUser(r.data)
        // if server returns access token, set header
        if (r.data.accessToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${r.data.accessToken}`
        }
      } catch (e) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (credentials) => {
    const r = await authApi.login(credentials)
    const { accessToken, user } = r.data
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
    setUser(user)
    return r
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('accessToken')
    delete axiosInstance.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
