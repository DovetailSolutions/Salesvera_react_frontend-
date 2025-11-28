// src/context/AuthProvider.js
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
        }

        // ✅ Use cached user immediately (no API call)
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        // 🔥 Fetch and extract user correctly
        const res = await authApi.getProfile();
        
        // 💡 Critical: extract the inner user object
        const userData = res.data?.data; // ✅ This is the actual user

        if (!userData) throw new Error("Invalid profile response");

        // Save to localStorage and state
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (e) {
        console.warn('Auth init failed:', e);
        // Optional: redirect to login if needed
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (credentials) => {
    const r = await authApi.login(credentials);
    const { accessToken, refreshToken, user: userData } = r.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData)); 
    localStorage.setItem('roles', userData.role);

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(userData);
    return r;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}