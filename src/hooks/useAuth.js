import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider.jsx'

export const useAuth = () => useContext(AuthContext)
