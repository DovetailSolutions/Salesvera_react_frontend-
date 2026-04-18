import React, { useContext, useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import Loader from "../components/Loader";
import {
    Search,
    Eye,
    IndianRupee,
    Calendar,
    User,
    Clock,
    FileText,
    Filter,
    X,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Hash
} from "lucide-react";
import { AuthContext } from "../context/AuthProvider";
import { reportApi } from "../api";

export default function CurrentOutstanding() {
    const { user } = useContext(AuthContext);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        startDate: "",
        endDate: ""
    });

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchReports = async (page = 1, search = "", currentFilters = filters) => {
        try {
            setLoading(true);
            const res = await reportApi.getOutstandingReports({
                page,
                limit: pageSize,
                search,
                ...currentFilters
            });
            const responseData = res.data?.data || {};

            const rows = responseData.data || [];
            const total = responseData.totalItems || rows.length;

            setReports(rows);
            setTotalItems(total);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load outstanding reports");
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when page or main search changes
    useEffect(() => {
        fetchReports(currentPage, searchQuery, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery]);

    // Handle advanced filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Apply advanced filters
    const applyFilters = () => {
        setCurrentPage(1);
        fetchReports(1, searchQuery, filters);
    };

    // Clear advanced filters
    const clearFilters = () => {
        const resetFilters = { status: "", startDate: "", endDate: "" };
        setFilters(resetFilters);
        setCurrentPage(1);
        fetchReports(1, searchQuery, resetFilters);
    };

    // ─── Analytics Calculations ────────────────────────────────────────────────
    const analytics = useMemo(() => {
        const totalPending = reports.reduce((sum, item) => sum + (Number(item.pendingAmount) || 0), 0);
        const totalOpening = reports.reduce((sum, item) => sum + (Number(item.openingAmount) || 0), 0);
        const overdueAccounts = reports.filter((item) => item.overdueDays > 0).length;

        return {
            totalPending,
            totalOpening,
            overdueAccounts,
            totalCount: reports.length
        };
    }, [reports]);

    // ─── Table Config ──────────────────────────────────────────────────────────
    const columns = [
        {
            key: "customerDetails",
            label: "Customer & Reference",
            sortable: false,
            render: (row) => (
                <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 capitalize">
                        <User className="w-4 h-4 text-brandBlue" />
                        {row.customerName || "Unknown Customer"}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 uppercase">
                        <Hash className="w-3 h-3" />
                        {row.referenceNo || "N/A"}
                    </p>
                </div>
            ),
        },
        {
            key: "amounts",
            label: "Outstanding Balance",
            sortable: false,
            render: (row) => (
                <div>
                    <div className="flex items-center gap-1 font-bold text-red-500 dark:text-red-400">
                        <IndianRupee className="w-4 h-4" />
                        {(Number(row.pendingAmount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        Opening: ₹{(Number(row.openingAmount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                </div>
            ),
        },
        {
            key: "dueDetails",
            label: "Due Details",
            sortable: false,
            render: (row) => (
                <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {row.dueOn ? new Date(row.dueOn).toLocaleDateString('en-GB') : "N/A"}
                    </div>
                    {row.overdueDays > 0 ? (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            Overdue by {row.overdueDays} days
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            On track
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            sortable: false,
            render: (row) => (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex w-fit items-center gap-1 capitalize
          ${row.status === 'accepted'
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                >
                    {row.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {row.status || "Unknown"}
                </span>
            ),
        },
        {
            key: "date",
            label: "Report Date",
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {row.date ? new Date(row.date).toLocaleDateString('en-GB') : "N/A"}
                </div>
            ),
        },
    ];

    const actions = [
        {
            type: "menu",
            label: "Actions",
            className: "p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            menuItems: [
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-brandBlue">
                            <Eye className="w-4 h-4" /> View Details
                        </span>
                    ),
                    onClick: (row) => {
                        console.log("View record:", row);
                        toast.success("View details functionality coming soon!");
                    },
                    className: "hover:!bg-blue-50 dark:hover:!bg-blue-500/10 cursor-pointer",
                },
            ]
        }
    ];

    return (
        <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative overflow-y-auto overflow-x-hidden custom-scrollbar">
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />

            {/* ── Analytics Dashboard ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Pending */}
                <div className="translucent custom-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Outstanding</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-0.5">
                            <IndianRupee className="w-4 h-4" />
                            {analytics.totalPending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </h4>
                    </div>
                </div>

                {/* Total Opening */}
                <div className="translucent custom-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-3 bg-brandBlue/10 rounded-xl shrink-0">
                        <FileText className="w-6 h-6 text-brandBlue" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Opening</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-0.5">
                            <IndianRupee className="w-4 h-4" />
                            {analytics.totalOpening.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </h4>
                    </div>
                </div>

                {/* Overdue Accounts */}
                <div className="translucent custom-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-3 bg-amber-500/10 rounded-xl shrink-0">
                        <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Overdue Accounts</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">
                            {analytics.overdueAccounts} <span className="text-sm text-slate-400 font-medium">/ {analytics.totalCount}</span>
                        </h4>
                    </div>
                </div>

                {/* Total Records */}
                <div className="translucent custom-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-3 bg-indigo-500/10 rounded-xl shrink-0">
                        <Hash className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Records</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white">
                            {totalItems}
                        </h4>
                    </div>
                </div>
            </div>

            {/* ── Controls Section ── */}
            <div className="translucent custom-border mb-4 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl shrink-0">
                <div className="flex w-full md:w-auto items-center gap-3 ml-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all custom-border ${showFilters ? 'bg-brandBlue/10 text-brandBlue' : 'translucent-inner text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>
            </div>

            {/* ── Advanced Filters Panel ── */}
            {showFilters && (
                <div className="translucent custom-border mb-6 p-5 rounded-2xl shrink-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 translucent-inner border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/50 text-slate-800 dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="accepted">Accepted</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 translucent-inner border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/50 text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 translucent-inner border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/50 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/20 dark:border-slate-700/50">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 translucent-inner custom-border rounded-xl hover:opacity-80 transition-opacity"
                        >
                            <X className="w-4 h-4" /> Clear
                        </button>
                        <button
                            onClick={applyFilters}
                            className="button flex items-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" /> Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table Section ── */}
            <div className="relative flex-1 overflow-hidden flex flex-col translucent custom-border p-0 rounded-2xl animate-in fade-in duration-300 min-h-[400px]">
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <Table
                        columns={columns}
                        data={reports}
                        actions={actions}
                        keyField="id"
                        emptyMessage="No outstanding reports found."
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalCount={totalItems}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {loading && (
                    <div className="absolute inset-0 backdrop-blur-[2px] z-50">
                        <Loader />
                    </div>
                )}
            </div>
        </div>
    );
}