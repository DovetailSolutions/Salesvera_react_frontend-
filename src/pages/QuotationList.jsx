import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import Loader from "../components/Loader";
import {
    Search, Download, FileText, IndianRupee, Calendar,
    Building2, User, UserCircle, Plus, Eye, FilePlus
} from "lucide-react";
import { AuthContext } from "../context/AuthProvider";
import { quotationApi } from "../api";
import CreateQuotationModal from "../components/CreateQuotationModal";
import ManageQuotationModal from "../components/QuotationModal";

export default function QuotationList() {
    const { user } = useContext(AuthContext);

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalItems, setTotalItems] = useState(0);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    // Invoice Mode States for the Create Modal
    const [isInvoiceMode, setIsInvoiceMode] = useState(false);
    const [invoiceRowData, setInvoiceRowData] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchQuotations = async (page = 1, search = "") => {
        try {
            setLoading(true);
            const params = { page };
            if (search) params.search = search;

            const res = await quotationApi.getQuotationList(params);
            const responseData = res.data?.data || {};
            const rows = responseData.data || [];
            const total = responseData.total || rows.length;

            setQuotations(rows);
            setTotalItems(total);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    // ─── Actions ─────────────────────────────────────────────────────────────
    const handleDownloadPdf = async (id, quotationNumber) => {
        try {
            const loadingToast = toast.loading("Generating PDF...");
            const res = await quotationApi.downloadQuotationPdf(id);

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Quotation_${quotationNumber || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF Downloaded successfully", { id: loadingToast });
        } catch (err) {
            toast.error("Failed to download PDF");
        }
    };

    const handleViewDetails = (row) => {
        setViewData(row);
        setIsViewModalOpen(true);
    };

    const handleOpenInvoiceFlow = (row) => {
        setInvoiceRowData(row);
        setIsInvoiceMode(true);
        setIsViewModalOpen(false); // Close view modal if it was open
        setIsCreateModalOpen(true);
    };

    const handleUpdateStatus = async (status) => {
        if (!viewData) return;
        const toastId = toast.loading(`Marking as ${status}...`);
        try {
            await quotationApi.updateQuotation(viewData.id, { status });
            toast.success(`Quotation successfully marked as ${status}!`, { id: toastId });
            fetchQuotations(currentPage, searchQuery);
            setIsViewModalOpen(false);
        } catch (err) {
            toast.error("Failed to update status", { id: toastId });
        }
    };

    const getGrandTotal = (row) => {
        if (row.quotation?.totalValue !== undefined) return row.quotation.totalValue;
        if (!row.quotation || !row.quotation.items) return 0;
        const subtotal = row.quotation.items.reduce((sum, item) => sum + Number(item.amount || item.value || 0), 0);
        const gstAmount = subtotal * (Number(row.quotation.gstRate || 0) / 100);
        const discount = Number(row.quotation.discount || 0);
        return subtotal + gstAmount - discount;
    };

    const getCreatorName = (row) => {
        if (row.User?.creators?.length > 0) return row.User.creators[0].firstName;
        return row.User?.firstName || "Unknown";
    };

    const columns = [
        {
            key: "quotationNumber",
            label: "Quotation Details",
            sortable: false,
            render: (row) => (
                <div>
                    <span className="font-semibold text flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        #{row.quotation?.quotationNumber || row.quotationNumber || "N/A"}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {row.quotation?.date || new Date(row.createdAt).toLocaleDateString() || "N/A"}
                    </p>
                </div>
            ),
        },
        {
            key: "company",
            label: "Billed To",
            sortable: false,
            render: (row) => (
                <div>
                    <span className="font-medium text flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        {row.quotation?.companyName || row.quotation?.billToName || row.customerName || "Unknown"}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 truncate max-w-[200px]">
                        <User className="w-3 h-3" />
                        {row.quotation?.billToName || row.quotation?.toName || row.customerName}
                    </p>
                </div>
            ),
        },
        // {
        //     key: "createdBy",
        //     label: "Created By",
        //     sortable: false,
        //     render: (row) => (
        //         <div className="flex items-center gap-1.5 text-sm font-medium text">
        //             <UserCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        //             {getCreatorName(row)}
        //         </div>
        //     ),
        // },
        {
            key: "status",
            label: "Status",
            sortable: false,
            render: (row) => (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${row.status === "draft" ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"}`}>
                    {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Unknown"}
                </span>
            ),
        },
        {
            key: "total",
            label: "Grand Total",
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1 font-bold text">
                    <IndianRupee className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {getGrandTotal(row).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
            ),
        },
    ];

    const actions = [
        {
            type: "menu",
            // The trigger button (Three dots)
            label: "Actions",
            className: "p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",

            // The dropdown items
            menuItems: [
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                            <Eye className="w-4 h-4" /> Manage
                        </span>
                    ),
                    onClick: (row) => handleViewDetails(row),
                    // Adding a subtle hover tint specific to this action
                    className: "hover:!bg-indigo-50 dark:hover:!bg-indigo-500/10 cursor-pointer",
                },
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                            <FilePlus className="w-4 h-4" /> Generate Invoice
                        </span>
                    ),
                    onClick: (row) => handleOpenInvoiceFlow(row),
                    className: "hover:!bg-emerald-50 dark:hover:!bg-emerald-500/10 cursor-pointer",
                },
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                            <Download className="w-4 h-4" /> Download PDF
                        </span>
                    ),
                    onClick: (row) => handleDownloadPdf(row.id, row.quotation?.quotationNumber || row.quotationNumber),
                    className: "hover:!bg-blue-50 dark:hover:!bg-blue-500/10 cursor-pointer",
                }
            ]
        }
    ];

    return (
        <div className="py-4 flex flex-col relative">
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />

            {/* Changed from hardcoded white bg to translucent */}
            <div className="translucent mb-6 flex items-center justify-between gap-4">
                <div className="relative w-full md:max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search quotations..."
                        /* Uses the global input styling you setup in CSS, overlaid with translucent */
                        className="w-full pl-10 pr-4 translucent-inner py-2.5 border-none text-sm focus:outline-none focus:ring-4 focus:ring-brandBlue/20 transition-all"
                    />
                </div>
                <button onClick={() => {
                    setInvoiceRowData(null);
                    setIsInvoiceMode(false);
                    setIsCreateModalOpen(true);
                }} className="button flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Quotation
                </button>
            </div>

            {/* Changed from hardcoded white bg to translucent */}
            <div className="relative flex-1 overflow-hidden flex flex-col translucent p-0">
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <Table
                        columns={columns}
                        data={quotations}
                        actions={actions}
                        keyField="id"
                        emptyMessage="No quotations found"
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalCount={totalItems}
                        onPageChange={setCurrentPage}
                    />
                </div>
                {loading && (
                    <div className="absolute inset-0 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
                        <Loader />
                    </div>
                )}
            </div>

            {/* ─── External Modals ─── */}
            <ManageQuotationModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                data={viewData}
                onUpdateStatus={handleUpdateStatus}
                onGenerateInvoice={() => handleOpenInvoiceFlow(viewData)}
            />

            <CreateQuotationModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setIsInvoiceMode(false);
                    setInvoiceRowData(null);
                }}
                onSuccess={() => fetchQuotations(currentPage, searchQuery)}
                invoiceData={invoiceRowData}
                isInvoiceMode={isInvoiceMode}
            />
        </div>
    );
}