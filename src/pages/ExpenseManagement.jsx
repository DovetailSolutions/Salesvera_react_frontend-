import React, { useState, useEffect, useMemo, useContext } from "react";
import { adminApi } from "../api";
import { FaCheck } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { AuthContext } from "../context/AuthProvider";
import toast, { Toaster } from "react-hot-toast";

const ExpenseManagement = () => {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Added search state
  const pageSize = 10;

  const currentUserRole = user?.role;

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "not_clear", label: "Not Clear" },
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getExpenses();
      if (response.data.success) {
        setExpenses(response.data.data || []);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  // ✅ Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getStatus = (row) => {
    const adminStatus = row.approvedByAdmin;
    const superAdminStatus = row.approvedBySuperAdmin;

    if (adminStatus === "rejected" || superAdminStatus === "rejected") return "Rejected";
    if (adminStatus === "not_clear") return "Not Clear";
    if (adminStatus === "accepted" && superAdminStatus === "accepted") return "Approved";
    if (adminStatus === "accepted" && superAdminStatus === "pending") return "Pending";
    return "Pending";
  };

  const filteredExpenses = useMemo(() => {
    if (!currentUserRole) return [];

    // Role-based visibility
    let visibleExpenses = expenses.filter((expense) => {
      if (currentUserRole === "manager") return true;
      if (currentUserRole === "admin") return expense.approvedByAdmin === "accepted";
      return false;
    });

    // Status filter
    if (statusFilter !== "all") {
      visibleExpenses = visibleExpenses.filter((expense) => {
        return getStatus(expense).toLowerCase() === statusFilter;
      });
    }

    // 🔍 Search filter
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      visibleExpenses = visibleExpenses.filter((expense) => {
        const user = expense.user || {};
        return (
          (user.firstName && user.firstName.toLowerCase().includes(term)) ||
          (user.lastName && user.lastName.toLowerCase().includes(term)) ||
          (expense.title && expense.title.toLowerCase().includes(term)) ||
          (expense.total_amount?.toString().includes(term))
        );
      });
    }

    return visibleExpenses;
  }, [expenses, currentUserRole, statusFilter, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-GB");
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      case "not clear": return "text-orange-600 bg-orange-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const handleApprove = async (expense) => {
    const updatedExpense = {
      ...expense,
      ...(currentUserRole === "manager"
        ? { approvedByAdmin: "accepted" }
        : { approvedBySuperAdmin: "accepted" }),
    };

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === expense.id ? updatedExpense : exp))
    );

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
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve expense");
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expense.id ? expense : exp))
      );
    }
  };

  const handleReject = async (expense) => {
    const updatedExpense = {
      ...expense,
      ...(currentUserRole === "manager"
        ? { approvedByAdmin: "rejected" }
        : { approvedBySuperAdmin: "rejected" }),
    };

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === expense.id ? updatedExpense : exp))
    );

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
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject expense");
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expense.id ? expense : exp))
      );
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

  const columns = [
    {
      key: "user",
      label: "Employee",
      render: (row) =>
        `${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() || "—",
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
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const adminStatus = row.approvedByAdmin;
        const superAdminStatus = row.approvedBySuperAdmin;
        const isManager = currentUserRole === "manager";
        const isAdmin = currentUserRole === "admin";

        if (isManager && adminStatus === "pending") {
          return (
            <div className="flex gap-2">
              <div
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                className="py-1 px-3 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm cursor-pointer"
                title="Approve"
              >
                <FaCheck size={12} />
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); handleReject(row); }}
                className="py-1 px-3 bg-red-600 text-white rounded hover:bg-red-700 transition shadow-sm cursor-pointer"
                title="Reject"
              >
                <IoMdClose size={12} />
              </div>
            </div>
          );
        }

        if (isAdmin && adminStatus === "accepted" && superAdminStatus === "pending") {
          return (
            <div className="flex gap-2">
              <div
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                className="py-1 px-3 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm cursor-pointer"
                title="Approve"
              >
                <FaCheck size={12} />
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); handleReject(row); }}
                className="py-1 px-3 bg-red-600 text-white rounded hover:bg-red-700 transition shadow-sm cursor-pointer"
                title="Reject"
              >
                <IoMdClose size={12} />
              </div>
            </div>
          );
        }

        return <span className="text-gray-400 italic text-xs">—</span>;
      },
    },
  ];

  const handleRowClick = (row) => {
    openUserExpenseModal(row);
  };

  if (!user) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="py-6 relative h-screen">
      <Toaster position="top-right absolute" />

      <h1 className="text-3xl font-semibold mb-4">Expense Management</h1>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 flex-1 max-w-3xl">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by name, title, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border`}
          />

          {/* Status Filter Dropdown */}
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

      <div className="w-full paneltheme rounded mt-4 py-2 overflow-x-auto lg:overflow-x-hidden">
        <table className="w-full text-sm border-collapse table-fixed">
          <thead>
            <tr>
              <th className="px-3 py-2 font-semibold text-xs text-left text-black bg-[#3B82F60D] rounded-l-xl">
                Sr No
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-xs text-black font-semibold bg-[#3B82F60D] ${
                    col.align || "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500">
                  Loading expenses...
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => {
                const bgColor = idx % 2 === 0 ? "bg-[#3B82F603]" : "bg-[#3B82F60D]";
                return (
                  <tr
                    key={row.id}
                    className={`${bgColor} cursor-pointer hover:bg-blue-50 transition`}
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="px-3 py-1.5 text-xs text-black">
                      {(currentPage - 1) * pageSize + (idx + 1)}
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-1.5 text-xs text-black">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center text-xs text-black py-3 bg-[#3B82F603]"
                >
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredExpenses.length > pageSize && (
          <div className="py-2 pb-4 pt-5">
            <div className="flex items-center justify-center mt-2 px-2 py-1 relative">
              <span className="text-sm text-gray-600 absolute left-0">
                Page {currentPage} of {Math.ceil(filteredExpenses.length / pageSize)}
              </span>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="!px-3 !py-3 rounded disabled:opacity-50 border border-gray-300 bg-white text-black hover:bg-gray-100"
                >
                  <FaAngleLeft />
                </button>
                {Array.from({ length: Math.ceil(filteredExpenses.length / pageSize) }, (_, i) => i + 1)
                  .filter(
                    (num) =>
                      num <= 3 ||
                      num > Math.ceil(filteredExpenses.length / pageSize) - 2 ||
                      Math.abs(num - currentPage) <= 1
                  )
                  .reduce((acc, num, i, arr) => {
                    if (i > 0 && num - arr[i - 1] > 1) acc.push("ellipsis");
                    acc.push(num);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e-${idx}`} className="px-3 py-1">
                        ...
                      </span>
                    ) : (
                      <div
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`!rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                          currentPage === item
                            ? "!bg-[#10B981] text-white !px-5 !py-1"
                            : "!bg-white !text-black border border-black hover:bg-gray-100 !px-5 !py-1"
                        }`}
                      >
                        {item}
                      </div>
                    )
                  )}
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(filteredExpenses.length / pageSize), p + 1)
                    )
                  }
                  disabled={currentPage === Math.ceil(filteredExpenses.length / pageSize)}
                  className="!px-3 !py-3 rounded disabled:opacity-50 border border-gray-300 bg-white text-black hover:bg-gray-100"
                >
                  <FaAngleRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Fixed Modal: shows only the clicked expense */}
      {modalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative border border-gray-200">
            <div
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close"
            >
              ✕
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Expense Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                For{" "}
                <span className="font-medium text-blue-600">
                  {selectedExpense.user?.firstName} {selectedExpense.user?.lastName}
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
                      ₹{selectedExpense.total_amount !== null ? selectedExpense.total_amount.toLocaleString() : "—"}
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
                  <p className="text-xs font-medium text-gray-600 mb-2">Bill Attachment</p>
                  {Array.isArray(selectedExpense.billImage) && selectedExpense.billImage.length > 0 ? (
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
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M6 2q-.825 0-1.412-.587T4 2V2h16v20H4V2h0Zm0 2v16h16V4H6Zm2 2h1v10H8V6Zm3 0h1v10h-1V6Zm3 0h1v10h-1V6Zm-6 2v6h1V8Zm3 0v6h1V8Zm3 0v6h1V8Z'/%3E";
                              e.target.className = "w-full h-full object-contain bg-gray-100";
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

// Pagination Icons
const FaAngleLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const FaAngleRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default ExpenseManagement;