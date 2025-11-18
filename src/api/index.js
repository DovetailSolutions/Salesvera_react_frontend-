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

export const adminApi = {
  users: () => axios.get("/admin/users"),
  assignRole: (userId, role) =>
    axios.post(`/admin/users/${userId}/role`, { role }),
  updatePassword: (data) => axios.patch("/admin/updatepassword", data),
};

export const meetingApi = {
  // ✅ Fetch meetings list (read-only)
  getUserMeetings: ({ userId, date, search }) =>
    axios.get("/admin/getusermeeting", {
      params: { userId, date, search },
    }),
};

export default { authApi, menuapi, adminApi };
