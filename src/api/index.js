import axios from "./axiosInstance";

export const authApi = {
  login: (payload) => axios.post("/admin/login", payload),
  register: (payload) => axios.post("/admin/register", payload),
  logout: () => axios.post("/admin/logout"),
  refresh: () => axios.post("/admin/refresh"),
  getProfile: () => axios.get("/admin/getprofile"),
};

export const menuapi = {
  categoryList: (params) => axios.get("/admin/getcategory", { params }),
  categoryGet: (id) => axios.get(`/admin/getcategory/${id}`),
  createCategory: (data) => axios.post("/admin/addcategory", data),
  updateCategory: (id, data) =>
    axios.patch(`/admin/updatecategory/${id}`, data),
  deleteCategory: (id) => axios.delete(`/admin/deletecategory/${id}`),
};

export const registrationApi = {
  getUserByRole : (role) => axios.get(`https://api.salesvera.com/admin/getalluser?role=${role}`)
}

export const adminApi = {
  users: () => axios.get('/admin/users'),
  assignRole: (userId, role) => axios.post(`/admin/users/${userId}/role`, { role }),
  updatePassword: (data) =>
    axios.patch("/admin/updatepassword", data),

  getAllUsers: ({ page = 1, limit = 10, search = "", role } = {}) =>
    axios.get("/admin/getalluser", {
      params: { page, limit, search, role },
    }),

  getMySalespersons: ({ managerId, page = 1 }) =>
    axios.get("/admin/mysaleperson", { params: { managerId, page } }),
};

export const meetingApi = {
  getUserMeetings: ({ userId, date, search = "", empty = false }) => {
    const params = {};
    
    if (empty) {
      params.empty = true; // ✅ This fetches all meetings
    } else if (userId) {
      params.userId = userId; // only add userId if not using empty
    }

    if (date) params.date = date;
    if (search) params.search = search;

    return axios.get("/admin/getusermeeting", { params });
  },
};

 export const clientApi = {
  bulkUploads: (data) => axios.post("/admin/bulk-upload", data),
};

export default { authApi, menuapi, adminApi, clientApi };
