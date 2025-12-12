import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { adminApi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { FaCheck, FaEye } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Loader from "../components/Loader";

const ExpenseManagement = () => {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  // ✅ NEW: Add totalRecords state
  const [totalRecords, setTotalRecords] = useState(0);

  const currentUserRole = user?.role;

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchExpenses = async () => {
  if (!user) return;
  try {
    setLoading(true);
    
    // Build params object
    const params = {
      page: currentPage,
      limit: pageSize,
      ...(searchTerm && { search: searchTerm }),
    };

    // ✅ ROLE-SPECIFIC STATUS FILTERING
    if (statusFilter !== "all") {
      if (currentUserRole === "manager") {
        // Manager's view
        if (statusFilter === "approved") {
          params.approvedByAdmin = "accepted";
        } else if (statusFilter === "rejected") {
          params.approvedByAdmin = "rejected";
        } else if (statusFilter === "pending") {
          params.approvedByAdmin = "pending";
        }
      } else if (currentUserRole === "admin") {
        // Admin's view
        if (statusFilter === "approved") {
          params.approvedByAdmin = "accepted";
          params.approvedBySuperAdmin = "accepted";
        } else if (statusFilter === "rejected") {
          // Show if either rejected
          params.rejected = "true"; // or handle via OR logic in backend
        } else if (statusFilter === "pending") {
          // Approved by manager but pending by admin
          params.approvedByAdmin = "accepted";
          params.approvedBySuperAdmin = "pending";
        }
      }
    }

    const response = await adminApi.getExpenses(params);
    if (response.data.success) {
      setExpenses(response.data.data || []);
      setTotalRecords(response.data.pagination?.totalRecords || 0);
    } else {
      setExpenses([]);
      setTotalRecords(0);
    }
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    setExpenses([]);
    setTotalRecords(0);
  } finally {
    setLoading(false);
  }
};

  // ✅ UPDATED: Fetch when dependencies change
  useEffect(() => {
    fetchExpenses();
  }, [user, currentPage, searchTerm, statusFilter]);

  // ✅ Keep: Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getStatus = (row) => {
    const adminStatus = row.approvedByAdmin;
    const superAdminStatus = row.approvedBySuperAdmin;

    if (adminStatus === "rejected" || superAdminStatus === "rejected") {
      return "Rejected";
    }
    if (adminStatus === "accepted" && superAdminStatus === "accepted") {
      return "Approved";
    }
    if (adminStatus === "accepted" && superAdminStatus === "pending") {
      if (currentUserRole === "admin") {
        return "Pending";
      }
      return "Pending by Admin";
    }
    return "Pending";
  };

  // ❌ REMOVED: filteredExpenses (client-side filtering)
  // ❌ REMOVED: paginatedData (client-side pagination)

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-GB");
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "pending by admin":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const openUserExpenseModal = (expense) => {
    setSelectedExpense(expense);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedExpense(null);
  };

  const handleApprove = useCallback(
    async (expense) => {
      const payload = {
        expenseId: expense.id,
        userId: expense.userId,
        role: currentUserRole,
        ...(currentUserRole === "manager"
          ? { approvedByAdmin: "accepted" }
          : { approvedBySuperAdmin: "accepted" }),
      };

      try {
        await adminApi.approveExpense(payload);
        toast.success("Expense approved");
        fetchExpenses(); // Refresh from backend
      } catch (error) {
        console.error("Approve error:", error);
        toast.error("Failed to approve expense");
      }
    },
    [currentUserRole, fetchExpenses]
  );

  const handleReject = useCallback(
    async (expense) => {
      const payload = {
        expenseId: expense.id,
        userId: expense.userId,
        role: currentUserRole,
        ...(currentUserRole === "manager"
          ? { approvedByAdmin: "rejected" }
          : { approvedBySuperAdmin: "rejected" }),
      };

      try {
        await adminApi.approveExpense(payload);
        toast.success("Expense rejected");
        fetchExpenses(); // Refresh
      } catch (error) {
        console.error("Reject error:", error);
        toast.error("Failed to reject expense");
      }
    },
    [currentUserRole, fetchExpenses]
  );

  const columns = [
    {
      key: "user",
      label: "Employee",
      render: (row) =>
        `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() ||
        "—",
    },
    { key: "title", label: "Title" },
    {
      key: "total_amount",
      label: "Amount (₹)",
      render: (row) => (row.total_amount != null ? row.total_amount : "—"),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = getStatus(row);
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const actions = [
    {
      type: "menu",
      label: "Actions",
      className:
        "px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition",
      menuItems: [
        {
          label: "Accept",
          onClick: (row) => handleApprove(row),
          icon: <FaCheck className="text-green-500" />,
          condition: (row) => {
            const status = getStatus(row);
            if (currentUserRole === "manager") return status === "Pending";
            if (currentUserRole === "admin")
              return status === "Pending by Admin";
            return false;
          },
          className: "text-green-600 hover:bg-green-50",
        },
        {
          label: "Reject",
          onClick: (row) => handleReject(row),
          icon: <IoMdClose className="text-red-500" />,
          condition: (row) => {
            const status = getStatus(row);
            if (currentUserRole === "manager") return status === "Pending";
            if (currentUserRole === "admin")
              return status === "Pending by Admin";
            return false;
          },
          className: "text-red-600 hover:bg-red-50",
        },
        {
          label: "View",
          onClick: (row) => openUserExpenseModal(row),
          icon: <FaEye className="text-blue-500" />,
          className: "text-blue-600 hover:bg-blue-50",
        },
      ],
    },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!user) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="py-2 relative h-screen">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-semibold mb-4">Expense Management</h1>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 flex-1 max-w-3xl">
          <input
            type="text"
            placeholder="Search by name, title, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px]"
          />

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">Filter by status: </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm w-full sm:w-auto"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500 flex flex-col items-center just"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>Loading attendance...</div>              
      ) : (
        <Table
          columns={columns}
          data={expenses} // ✅ Use expenses directly (no client-side pagination)
          actions={actions}
          keyField="id"
          emptyMessage="No expenses found."
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalRecords} // ✅ Use backend total
          onPageChange={handlePageChange}
          shadow="shadow-sm"
        />
      )}

      {/* Modal */}
      {modalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 py-10 relative border border-gray-200">
            <div
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close"
            >
              ✕
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Expense Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                For{" "}
                <span className="font-medium text-blue-600">
                  {selectedExpense.user?.firstName}{" "}
                  {selectedExpense.user?.lastName}
                </span>
              </p>
            </div>

            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-800 text-sm capitalize">
                    {selectedExpense.title || "Untitled Expense"}
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {formatDate(selectedExpense.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500">Amount</span>
                    <p className="font-medium text-gray-800">
                      ₹
                      {selectedExpense.total_amount !== null
                        ? selectedExpense.total_amount.toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          getStatus(selectedExpense)
                        )}`}
                      >
                        {getStatus(selectedExpense)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Bill Attachment
                  </p>
                  {Array.isArray(selectedExpense.billImage) &&
                  selectedExpense.billImage.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedExpense.billImage.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-16 h-16 rounded border border-gray-300 overflow-hidden hover:ring-2 hover:ring-blue-400 transition"
                        >
                          <img
                            src={img}
                            alt={`Bill ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M6 2q-.825 0-1.412-.587T4 2V2h16v20H4V2h0Zm0 2v16h16V4H6Zm2 2h1v10H8V6Zm3 0h1v10h-1V6Zm3  0h1v10h-1V6Zm-6 2v6h1V8Zm3 0v6h1V8Zm3 0v6h1V8Z'/%3E";
                              e.target.className =
                                "w-full h-full object-contain bg-gray-100";
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                      No bill attached
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;