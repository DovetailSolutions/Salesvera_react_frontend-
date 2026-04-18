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
  createSubCategory: (data) => axios.post('/admin/addSubCategory', data),
  getSubCategory: (id) => axios.get(`/admin/getsubcategory/${id}`),
  updateSubCategory: (id, data) =>
    axios.patch(`/admin/updatesubcategory/${id}`, data),
};

export const registrationApi = {
  getUserByRole: (role) => axios.get(`/admin/getalluser?role=${role}`)
}

export const adminApi = {
  users: () => axios.get('/admin/users'),
  assignRole: (userId, role) => axios.post(`/admin/users/${userId}/role`, { role }),
  updatePassword: (data) =>
    axios.patch("/admin/updatepassword", data),

  getFuelExpenses: (params) => axios.get('/admin/fuel-expense', { params }),

  getAllUsers: ({ page = 1, limit = 10, search = "", role } = {}) =>
    axios.get("/admin/getalluser", {
      params: { page, limit, search, role },
    }),

  getMySalespersons: ({ managerId, page = 1 }) =>
    axios.get("/admin/mysaleperson", { params: { managerId, page } }),

  getAdminManagers: () => axios.get("/admin/admin-manager"),

  getLeaveList: (params = {}) =>
    axios.get("/admin/get-leave-list", { params }),

  getUserLeave: (userId) =>
    axios.get("/admin/user-leave", { params: { userId } }),

  approveLeave: (data) =>
    axios.patch("/admin/approved-leave", data),

  getExpenses: () => axios.get("/admin/get-expense"),

  getUserExpense: (params) => axios.get("/admin/user-expense", { params }),

  approveExpense: (data) =>
    axios.patch("/admin/approved-expense", data),

  getOwnLeave: () => axios.get("/admin/getown-leave"),
};

export const meetingApi = {
  getUserMeetings: ({ userId, date, page = 1,
    limit = 10,
    search = "",
    timeFilter, empty = false }) => {
    const params = {};

    if (empty) {
      params.empty = true;
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

  getFuelExpenses: (params) => axios.get("/admin/fuel-expense", { params }),

  assignMeeting: (data) =>
    axios.post("/admin/assign-meeting", data),
};

export const clientApi = {
  bulkUploads: (data) => axios.post("/admin/bulk-upload", data),
  createClient: (data) => axios.post("/admin/create-client", data),
};

export const attendanceApi = {
  getAllUsersForAttendance: ({ page = 1, limit = 10 } = {}) =>
    axios.get("/admin/get-attendance", { params: { page, limit } }),

  getUserAttendance: ({ userId, page = 1, limit = 10 }) =>
    axios.get("/admin/user-attendance", { params: { userId, page, limit } }),

  getAttendanceBook: (params = {}) =>
    axios.get("/admin/attendance-book", { params }),
};

export const quotationApi = {

  getQuotationList: (params) => axios.get("/api/quotations", { params }), // Update with your actual list endpoint
  downloadQuotationPdf: (id) => axios.get(`/api/quotations/download/${id}`, { responseType: 'blob' }), // Update with your actual PDF endpoint

  // NEW: Add Invoice / Quotation API from your cURL
  createInvoice: (data) => axios.post("/admin/addinvoice", data),

  getInvoiceList: (params) => axios.get("/admin/getinvoice", { params }),

  // NEW: Client Search API
  searchClients: (params) => axios.get("/admin/get-client", { params }),

  // Fetch the list of quotations
  getQuotationList: async (params) => {
    return await axios.get(`/admin/getquotationlist`, { params });
  },
  createQuotationPdf: (data) => axios.post('/admin/addquotationpdf', data),
  // Download a specific quotation PDF
  downloadQuotationPdf: async (id) => {
    return await axios.get(`/admin/downloadquotationpdf/${id}`, {
      responseType: "blob", // CRITICAL: Required for handling file downloads in Axios
    });
  },

  // Create a new quotation
  addQuotation: (payload) =>
    axios.post("/admin/addquotation", payload),

  // Update existing quotation (e.g., status: 'accepted')
  // Note: Your curl used /api/updatequotation/ instead of /admin/
  updateQuotation: (id, payload) =>
    axios.post(`/api/updatequotation/${id}`, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }),





};

export const expenseApi = {

  // Fetch grouped expenses for the month
  getGroupedFuelExpenses: ({ userId, month, year }) =>
    axios.get("/admin/get-fuel-expense", { params: { userId, month, year } }),

  // Fetch detailed meetings for a specific date range
  getDetailedFuelExpenses: ({ userId, startDate, endDate, page = 1, limit = 50 }) =>
    axios.get("/admin/fuel-expense", { params: { userId, startDate, endDate, page, limit } }),

  // Approve expenses (Assuming you have this endpoint)
  approveExpenses: (payload) =>
    axios.post("/admin/approve-fuel-expense", payload),

}

export const companyApi = {
  // ── Company ──────────────────────────────────────────────────────────────
  addCompany: (payload) =>
    axios.post("/admin/addcompany", payload),

  updateCompany: (id, payload) =>
    axios.patch(`/admin/updatecompany/${id}`, payload),

  // ── Bank Details ─────────────────────────────────────────────────────────
  addBanks: (payload) => axios.post("/admin/add-bank", payload), // <-- NEW ENDPOINT

  getCompanies: (params) =>
    axios.get("/admin/getcompany", { params }),

  getCompanyById: (id) =>
    axios.get(`/admin/getcompany/${id}`),

  // ── Branch ───────────────────────────────────────────────────────────────
  addBranch: (payload) =>
    axios.post("/admin/addbranch", payload),

  getBranches: () =>
    axios.get("/admin/getbranch"),

  // ── Shift ────────────────────────────────────────────────────────────────
  addShift: (payload) =>
    axios.post("/admin/addshift", payload),

  getShifts: () =>
    axios.get("/admin/getshift"),

  getShiftById: (id) =>
    axios.get(`/admin/getshift/${id}`),

  // ── Departments ──────────────────────────────────────────────────────────
  addDepartment: (payload) =>
    axios.post("/admin/adddepartment", payload),

  // ── Leave Types ──────────────────────────────────────────────────────────
  addLeaveType: (payload) =>
    axios.post("/admin/add-leave", payload),

  // ── Holidays ─────────────────────────────────────────────────────────────
  addHoliday: (payload) =>
    axios.post("/admin/addholiday", payload),
};

export const customerApi = {

};

export const invoiceApi = {

  // acceptInvoice: (id) => axios.patch(`/admin/update-client/${id}`),

  // Fetch paginated record sales/invoices with advanced filters
  getRecordSales: ({
    page = 1,
    limit = 10,
    search = "",
    companyName,
    city,
    state,
    status,
    startDate,
    endDate
  }) => {
    // Dynamically build params object to avoid sending undefined values
    const params = { page, limit };
    if (search) params.search = search;
    if (companyName) params.companyName = companyName;
    if (city) params.city = city;
    if (state) params.state = state;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return axios.get("/admin/get-record-sale", { params });
  },

  // Placeholders for future endpoints (e.g., creating or updating a record)
  // createRecordSale: (payload) => axios.post("/admin/create-record-sale", payload),
  // updateRecordSale: (id, payload) => axios.put(`/admin/update-record-sale/${id}`, payload),
  // deleteRecordSale: (id) => axios.delete(`/admin/delete-record-sale/${id}`),
};

export const reportApi = {
  // ... other APIs
  getOutstandingReports: (params) => axios.get("/admin/get-report", { params }),
};

export default { authApi, menuapi, adminApi, clientApi, quotationApi, meetingApi, attendanceApi, companyApi };

