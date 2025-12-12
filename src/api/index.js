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
  getUserByRole : (role) => axios.get(`/admin/getalluser?role=${role}`)
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

  getMySalespersons: ({ managerId, page = 1, search = "" }) =>
    axios.get("/admin/mysaleperson", { params: { managerId, page, search } }),

   getAdminManagers: (params = {}) => axios.get("/admin/admin-manager", { params }),

  getLeaveList: (params = {}) =>
  axios.get("/admin/get-leave-list", { params }),

  getUserLeave: (userId) =>
    axios.get("/admin/user-leave", { params: { userId } }),

  approveLeave: (data) =>
    axios.patch("/admin/approved-leave", data),

// In api.js
getExpenses: (params) => {
  return axios.get("/admin/get-expense", { params });
},

  getUserExpense: (params) => axios.get("/admin/user-expense", { params }),

  approveExpense: (data) =>
  axios.patch("/admin/approved-expense", data),

   getOwnLeave: () => axios.get("/admin/getown-leave"),
};

export const meetingApi = {
  getUserMeetings: ({ userId, date,page = 1,        
    limit = 10,     
    search = "", 
    timeFilter, empty = false }) => {
    const params = {};
    
    if (empty) {
      params.empty = true; 
      params.page = page;      
      params.limit = limit;    
      if (search) params.search = search;
    } else if (userId) {
      params.userId = userId;
      params.page = page;      
      params.limit = limit;    
      if (search) params.search = search;
      if (timeFilter) params.timeFilter = timeFilter; 
    }

    if (date) params.date = date;
    if (search) params.search = search;

    return axios.get("/admin/getusermeeting", { params });
  },

  assignMeeting: (data) => 
    axios.post("/admin/assign-meeting", data),
};

 export const clientApi = {
  bulkUploads: (data) => axios.post("/admin/bulk-upload", data),
  createClient: (data) => axios.post("/admin/create-client", data),
};

export const attendanceApi = {
  getAllUsersForAttendance: ({ page = 1, limit = 10, search = "" } = {}) =>
    axios.get("/admin/get-attendance", { params: { page, limit, search } }),

  getUserAttendance: ({ userId, page = 1, limit = 10 }) =>
    axios.get("/admin/user-attendance", { params: { userId, page, limit } }),

  getAttendanceBook: (params = {}) =>
    axios.get("/admin/attendance-book", { params }),
};

export default { authApi, menuapi, adminApi, clientApi };