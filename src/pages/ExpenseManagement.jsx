import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { adminApi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { FaCheck, FaEye } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Search, Filter, ReceiptText, CalendarDays, IndianRupee } from "lucide-react";
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

  const currentUserRole = user?.role;

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const filteredExpenses = useMemo(() => {
    if (!currentUserRole) return [];

    let visibleExpenses = expenses.filter((expense) => {
      if (currentUserRole === "manager") return true;
      if (currentUserRole === "admin")
        return expense.approvedByAdmin === "accepted";
      return false;
    });

    if (statusFilter !== "all") {
      visibleExpenses = visibleExpenses.filter((expense) => {
        const currentStatus = getStatus(expense);
        if (statusFilter === "approved") {
          return (
            currentStatus === "Approved" || currentStatus === "Pending by Admin"
          );
        } else {
          return currentStatus.toLowerCase() === statusFilter;
        }
      });
    }

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      visibleExpenses = visibleExpenses.filter((expense) => {
        const user = expense.user || {};
        return (
          (user.firstName && user.firstName.toLowerCase().includes(term)) ||
          (user.lastName && user.lastName.toLowerCase().includes(term)) ||
          (expense.title && expense.title.toLowerCase().includes(term)) ||
          expense.total_amount?.toString().includes(term)
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

  // Modernized Status Badge Renderer
  const renderStatusBadge = (status) => {
    const normalized = status.toLowerCase();
    let color = "bg-slate-100 text-slate-700";
    let dot = "bg-slate-500";

    if (normalized === "approved") {
      color = "bg-emerald-100 text-emerald-700";
      dot = "bg-emerald-500";
    } else if (normalized === "rejected") {
      color = "bg-red-100 text-red-700";
      dot = "bg-red-500";
    } else if (normalized === "pending") {
      color = "bg-amber-100 text-amber-700";
      dot = "bg-amber-500";
    } else if (normalized === "pending by admin") {
      color = "bg-blue-100 text-blue-700";
      dot = "bg-blue-500";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
        {status}
      </span>
    );
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
        fetchExpenses(); 
      } catch (error) {
        console.error("Approve error:", error);
        toast.error("Failed to approve expense");
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === expense.id ? expense : exp))
        );
      }
    },
    [currentUserRole, fetchExpenses]
  );

  const handleReject = useCallback(
    async (expense) => {
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
        fetchExpenses();
      } catch (error) {
        console.error("Reject error:", error);
        toast.error("Failed to reject expense");
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === expense.id ? expense : exp))
        );
      }
    },
    [currentUserRole, fetchExpenses]
  );

  const columns = [
    {
      key: "user",
      label: "Employee",
      render: (row) => (
        <div className="font-medium text-slate-800 capitalize">
          {`${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() || "—"}
        </div>
      )
    },
    { 
      key: "title", 
      label: "Title",
      render: (row) => <div className="text-slate-700 capitalize">{row.title || "—"}</div>
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (row) => (
        <div className="font-semibold text-slate-800 flex items-center">
          ₹{row.total_amount != null ? row.total_amount.toLocaleString('en-IN') : "—"}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => <div className="text-slate-600">{formatDate(row.createdAt)}</div>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => renderStatusBadge(getStatus(row)),
    },
  ];

  const actions = useMemo(
    () => [
      {
        type: "menu",
        label: "Actions",
        className:
          "px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm",
        menuItems: [
          {
            label: "Accept",
            onClick: (row) => handleApprove(row),
            icon: <FaCheck className="text-emerald-500 w-3.5 h-3.5" />,
            condition: (row) => {
              const status = getStatus(row);
              if (currentUserRole === "manager") return status === "Pending";
              if (currentUserRole === "admin")
                return status === "Pending by Admin";
              return false;
            },
            className: "text-emerald-700 hover:bg-emerald-50 font-medium",
          },
          {
            label: "Reject",
            onClick: (row) => handleReject(row),
            icon: <IoMdClose className="text-red-500 w-4 h-4" />,
            condition: (row) => {
              const status = getStatus(row);
              if (currentUserRole === "manager") return status === "Pending";
              if (currentUserRole === "admin")
                return status === "Pending by Admin";
              return false;
            },
            className: "text-red-700 hover:bg-red-50 font-medium",
          },
          {
            label: "View Details",
            onClick: (row) => openUserExpenseModal(row),
            icon: <FaEye className="text-blue-500 w-3.5 h-3.5" />,
            className: "text-blue-700 hover:bg-blue-50 font-medium",
          },
        ],
      },
    ],
    [
      currentUserRole,
      handleApprove,
      handleReject,
      openUserExpenseModal,
      getStatus,
    ]
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          Expense Management
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Review, approve, and track employee expense claims.
        </p>
      </div>

      {/* Search & Controls Container */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, title, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {/* Custom Select Arrow */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Area */}
      <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <Table
            columns={columns}
            data={paginatedData}
            actions={actions}
            keyField="id"
            emptyMessage="No expenses found matching your criteria."
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={filteredExpenses.length}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Loader /> <span className="text-sm font-semibold text-slate-600">Loading expenses...</span>
            </div>
          </div>
        )}
      </div>

      {/* Expense Details Modal */}
      {modalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-blue-500" />
                  Expense Details
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  Submitted by <span className="text-slate-700 font-bold capitalize">{selectedExpense.user?.firstName} {selectedExpense.user?.lastName}</span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <IoMdClose size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Expense Title</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{selectedExpense.title || "Untitled Expense"}</span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-blue-500"/> Date Submitted</span>
                  <span className="text-sm font-bold text-slate-800">{formatDate(selectedExpense.createdAt)}</span>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1.5"><IndianRupee className="w-3 h-3 text-blue-600"/> Total Amount</span>
                  <span className="text-xl font-black text-blue-700">₹{selectedExpense.total_amount !== null ? selectedExpense.total_amount.toLocaleString('en-IN') : "0"}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-start gap-2 justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                  {renderStatusBadge(getStatus(selectedExpense))}
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
                  Bill Attachments
                </h4>
                
                {Array.isArray(selectedExpense.billImage) && selectedExpense.billImage.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {selectedExpense.billImage.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500 hover:ring-offset-2"
                      >
                        <img
                          src={img}
                          alt={`Bill ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M6 2q-.825 0-1.412-.587T4 2V2h16v20H4V2h0Zm0 2v16h16V4H6Zm2 2h1v10H8V6Zm3 0h1v10h-1V6Zm3 0h1v10h-1V6Zm-6 2v6h1V8Zm3 0v6h1V8Zm3 0v6h1V8Z'/%3E";
                            e.target.className = "w-full h-full object-contain p-4 opacity-50";
                          }}
                        />
                        {/* Overlay Icon */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                          <FaEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-5 h-5" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <ReceiptText className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="text-sm font-medium text-slate-500">No bills attached to this expense.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;