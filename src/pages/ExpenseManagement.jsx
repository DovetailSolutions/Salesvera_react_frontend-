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
import { Search, Filter, ReceiptText, CalendarDays, IndianRupee, MapPin, Tag, FileText } from "lucide-react";
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

  // Resolve the display amount — prefer total_amount if set, else fall back to amount
  const resolveAmount = (row) => {
    if (row.total_amount != null) return parseFloat(row.total_amount);
    if (row.amount != null) return parseFloat(row.amount);
    return null;
  };

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
        const expUser = expense.user || {};
        const amount = resolveAmount(expense);
        return (
          (expUser.firstName && expUser.firstName.toLowerCase().includes(term)) ||
          (expUser.lastName && expUser.lastName.toLowerCase().includes(term)) ||
          (expense.title && expense.title.toLowerCase().includes(term)) ||
          (expense.category && expense.category.toLowerCase().includes(term)) ||
          (expense.location && expense.location.toLowerCase().includes(term)) ||
          (amount != null && amount.toString().includes(term))
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

  const renderStatusBadge = (status) => {
    const normalized = status.toLowerCase();
    let color = "card-popup custom-border-100 text";
    let dot = "card-popup custom-border-500";

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

  // Category color mapping
  const getCategoryBadge = (category) => {
    if (!category) return null;
    const map = {
      Travel: "bg-purple-100 text-purple-700",
      Food: "bg-orange-100 text-orange-700",
      Accommodation: "bg-teal-100 text-teal-700",
      Office: "bg-blue-100 text-blue-700",
    };
    const cls = map[category] || "card-popup custom-border-100 text";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
        {category}
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
      // Determine the new statuses based on who is approving
      const newAdminStatus = currentUserRole === "manager" ? "accepted" : (expense.approvedByAdmin || "pending");
      const newSuperAdminStatus = currentUserRole === "admin" ? "accepted" : (expense.approvedBySuperAdmin || "pending");

      const updatedExpense = {
        ...expense,
        approvedByAdmin: newAdminStatus,
        approvedBySuperAdmin: newSuperAdminStatus,
      };

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expense.id ? updatedExpense : exp))
      );

      // Exact payload structure expected by the API
      const payload = {
        userId: expense.userId,
        role: currentUserRole,
        approvedBySuperAdmin: newSuperAdminStatus,
        approvedByAdmin: newAdminStatus,
        expenseId: expense.id,
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
      // Determine the new statuses based on who is rejecting
      const newAdminStatus = currentUserRole === "manager" ? "rejected" : (expense.approvedByAdmin || "pending");
      const newSuperAdminStatus = currentUserRole === "admin" ? "rejected" : (expense.approvedBySuperAdmin || "pending");

      const updatedExpense = {
        ...expense,
        approvedByAdmin: newAdminStatus,
        approvedBySuperAdmin: newSuperAdminStatus,
      };

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expense.id ? updatedExpense : exp))
      );

      // Exact payload structure expected by the API
      const payload = {
        userId: expense.userId,
        role: currentUserRole,
        approvedBySuperAdmin: newSuperAdminStatus,
        approvedByAdmin: newAdminStatus,
        expenseId: expense.id,
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
        <div className="font-medium text capitalize">
          {`${row.user?.firstName || ""} ${row.user?.lastName || ""}`.trim() || "—"}
        </div>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <div className="text capitalize">{row.title || "Untitled"}</div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => getCategoryBadge(row.category) || <span className="text">—</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => {
        const amt = resolveAmount(row);
        return (
          <div className="font-semibold text">
            {amt != null ? `₹${amt.toLocaleString("en-IN")}` : "—"}
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        // Prefer the explicit `date` field; fall back to createdAt
        <div className="text">{formatDate(row.date || row.createdAt)}</div>
      ),
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
        menuItems: [
          {
            label: "Accept",
            onClick: (row) => handleApprove(row),
            icon: <FaCheck className="text-emerald-500 w-3.5 h-3.5" />,
            condition: (row) => {
              const adminStatus = row.approvedByAdmin || "pending";
              const superStatus = row.approvedBySuperAdmin || "pending";

              // Manager can act if it's still pending for them
              if (currentUserRole === "manager") return adminStatus === "pending";
              // Admin (SuperAdmin) can act if Manager accepted it, but it's still pending for Admin
              if (currentUserRole === "admin") return adminStatus === "accepted" && superStatus === "pending";

              return false;
            },
            className: "text-emerald-700 hover:bg-emerald-50 font-medium",
          },
          {
            label: "Reject",
            onClick: (row) => handleReject(row),
            icon: <IoMdClose className="text-red-500 w-4 h-4" />,
            condition: (row) => {
              const adminStatus = row.approvedByAdmin || "pending";
              const superStatus = row.approvedBySuperAdmin || "pending";

              // Manager can act if it's still pending for them
              if (currentUserRole === "manager") return adminStatus === "pending";
              // Admin (SuperAdmin) can act if Manager accepted it, but it's still pending for Admin
              if (currentUserRole === "admin") return adminStatus === "accepted" && superStatus === "pending";

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
    [currentUserRole, handleApprove, handleReject, openUserExpenseModal]
  );
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <Loader />
    );
  }

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />

      {/* Search & Filter */}
      <div className=" custom-border  p-4 rounded-2xl shadow-smcustom-border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by name, title, category, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full  custom-border -inner pl-10 pr-4 py-2.5 card-popup custom-border-50custom-borderborder-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus: custom-border  transition-all"
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full  custom-border -inner pl-10 pr-8 py-2.5 card-popup custom-border-50custom-borderborder-slate-200 rounded-xl text-sm font-medium text appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus: custom-border  transition-all cursor-pointer"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative flex-1  custom-border  rounded-2xl shadow-smcustom-borderborder-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
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

        {loading && (
          <Loader />
        )}
      </div>

      {/* Expense Details Modal */}
      {modalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center theblur p-4 animate-in fade-in duration-200">
          <div className="popup-card w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-5 custom-border flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-blue-500" />
                  Expense Details
                </h3>
                <p className="text-sm font-medium text mt-0.5">
                  Submitted by{" "}
                  <span className="text font-bold capitalize">
                    {selectedExpense.user?.firstName} {selectedExpense.user?.lastName}
                  </span>
                </p>
              </div>
              <div
                onClick={closeModal}
                className="p-2 text hover:text hover:card-popup custom-border-100 rounded-full transition-colors focus:outline-none"
              >
                <IoMdClose size={22} />
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1  custom-border  space-y-6">

              {/* Primary Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Title */}
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text">Expense Title</span>
                  <span className="text-sm font-bold text capitalize">
                    {selectedExpense.title || "Untitled Expense"}
                  </span>
                </div>

                {/* Category */}
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-purple-500" /> Category
                  </span>
                  {getCategoryBadge(selectedExpense.category) || (
                    <span className="text-sm font-bold text">—</span>
                  )}
                </div>

                {/* Amount */}
                <div className=" custom-border  p-4 rounded-2xlcustom-borderborder-blue-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3 text-blue-600" /> Amount
                  </span>
                  <span className="text-xl font-black text-blue-700">
                    ₹{resolveAmount(selectedExpense) != null
                      ? resolveAmount(selectedExpense).toLocaleString("en-IN")
                      : "0"}
                  </span>
                </div>

                {/* Status */}
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col items-start gap-2 justify-center">
                  <span className="text-[10px] uppercase font-bold text">Current Status</span>
                  {renderStatusBadge(getStatus(selectedExpense))}
                </div>

                {/* Expense Date */}
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3 text-blue-500" /> Expense Date
                  </span>
                  <span className="text-sm font-bold text">
                    {formatDate(selectedExpense.date || selectedExpense.createdAt)}
                  </span>
                </div>

                {/* Location */}
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-rose-500" /> Location
                  </span>
                  <span className="text-sm font-bold text capitalize">
                    {selectedExpense.location || "—"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedExpense.description && (
                <div className=" custom-border  custom-border-50 p-4 rounded-2xlcustom-borderborder-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text" /> Description
                  </span>
                  <p className="text-sm text leading-relaxed">{selectedExpense.description}</p>
                </div>
              )}

              {/* Bill Attachments */}
              <div>
                <h4 className="text-sm font-bold text mb-3 custom-border-bottom border-slate-100 pb-2">
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
                        className="group relative aspect-square rounded-xl custom-border border-slate-200 overflow-hidden  custom-border  custom-border shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500 hover:ring-offset-2"
                      >
                        <img
                          src={img}
                          alt={`Bill ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 card-popup custom-border-900/0 group-hover:card-popup custom-border-900/10 transition-colors flex items-center justify-center">
                          <FaEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-5 h-5" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full py-10  rounded-2xl card-popup custom-border">
                    <ReceiptText className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="text-sm font-medium text">No bills attached to this expense.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 custom-border-top border-slate-100 card-popup custom-border-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm font-semibold text  custom-border  custom-border border-slate-300 rounded-xl hover:card-popup custom-border-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
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