import axios from './axiosInstance'

export const authApi = {
  login: (payload) => axios.post('/auth/login', payload),
  register: (payload) => axios.post('/admin/register', payload),
  logout: () => axios.post('/auth/logout'),
  refresh: () => axios.post('/auth/refresh'),
  getProfile: () => axios.get('/auth/me')
}

export const vehicleApi = {
  list: (params) => axios.get('/vehicles', { params }),
  get: (id) => axios.get(`/vehicles/${id}`),
  create: (data) => axios.post('/vehicles', data),
  update: (id, data) => axios.put(`/vehicles/${id}`, data)
}

export const adminApi = {
  users: () => axios.get('/admin/users'),
  assignRole: (userId, role) => axios.post(`/admin/users/${userId}/role`, { role })
}

export default { authApi, vehicleApi, adminApi }
