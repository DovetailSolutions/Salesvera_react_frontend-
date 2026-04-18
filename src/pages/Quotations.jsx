import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { quotationApi, menuapi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import Loader from "../components/Loader";
import {
    Search,
    Download,
    FileText,
    IndianRupee,
    Calendar,
    Building2,
    User,
    UserCircle,
    Plus,
    X,
    Trash2,
    Eye,
    MapPin
} from "lucide-react";

export default function QuotationList() {
    const { user } = useContext(AuthContext);

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalItems, setTotalItems] = useState(0);

    // Modals State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Category & Subcategory Cache State
    const [categories, setCategories] = useState([]);
    const [subcategoriesMap, setSubcategoriesMap] = useState({});

    // Form State
    const initialFormState = {
        companyName: "",
        companyId: 2,
        address: "",
        gstin: "",
        quotationNumber: "",
        date: new Date().toISOString().split('T')[0],
        fromName: "",
        toName: "",
        toAddress: "",
        contactNumber: "",
        gstRate: 18,
        discount: 0,
        notes: "",
        items: [{ category: "", service: "", amount: "" }]
    };
    const [formData, setFormData] = useState(initialFormState);

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
            setQuotations([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    // Fetch Categories when create modal opens
    useEffect(() => {
        if (isModalOpen && categories.length === 0) {
            const fetchCats = async () => {
                try {
                    const res = await menuapi.categoryList({ limit: 1000 });
                    const data = res.data?.data || res.data || {};
                    setCategories(data.rows || []);
                } catch (err) {
                    console.error("Failed to fetch categories", err);
                    toast.error("Failed to load categories for the form");
                }
            };
            fetchCats();
        }
    }, [isModalOpen, categories.length]);

    // ─── Form Handlers ──────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === "category") {
            newItems[index].service = "";
            newItems[index].amount = "";
            const selectedCat = categories.find((c) => c.category_name === value);

            if (selectedCat && selectedCat.id && !subcategoriesMap[selectedCat.id]) {
                try {
                    const res = await menuapi.getSubCategory(selectedCat.id);
                    const subs = res.data?.data || res.data || [];
                    setSubcategoriesMap((prev) => ({
                        ...prev,
                        [selectedCat.id]: Array.isArray(subs) ? subs : []
                    }));
                } catch (err) {
                    console.error("Failed to fetch subcategories", err);
                }
            }
        }

        if (field === "service") {
            const catName = newItems[index].category;
            const selectedCat = categories.find((c) => c.category_name === catName);

            if (selectedCat) {
                const subs = subcategoriesMap[selectedCat.id] || selectedCat.subcategories || selectedCat.SubCategories || [];
                const selectedSub = subs.find((s) => s.sub_category_name === value);
                if (selectedSub && selectedSub.amount) {
                    newItems[index].amount = selectedSub.amount;
                }
            }
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { category: "", service: "", amount: "" }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading("Creating Quotation...");

        try {
            const payload = {
                ...formData,
                companyId: Number(formData.companyId),
                gstRate: Number(formData.gstRate),
                discount: Number(formData.discount),
                items: formData.items.map(item => ({
                    ...item,
                    amount: Number(item.amount)
                }))
            };

            await quotationApi.createQuotationPdf(payload);

            toast.success("Quotation created successfully", { id: loadingToast });
            setIsModalOpen(false);
            setFormData(initialFormState);
            fetchQuotations(currentPage, searchQuery);
        } catch (err) {
            console.error("Create error:", err);
            toast.error("Failed to create quotation", { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Table & Action Handlers ───────────────────────────────────────────────
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
            console.error("Download error:", err);
            toast.error("Failed to download PDF");
        }
    };

    const handleViewDetails = (row) => {
        setViewData(row);
        setIsViewModalOpen(true);
    };

    // Uses API totalValue if present, else fallback calculation
    const getGrandTotal = (row) => {
        if (row.quotation?.totalValue !== undefined) {
            return row.quotation.totalValue;
        }
        if (!row.quotation || !row.quotation.items) return 0;
        const subtotal = row.quotation.items.reduce((sum, item) => sum + Number(item.amount || item.value || 0), 0);
        const gstAmount = subtotal * (Number(row.quotation.gstRate || 0) / 100);
        const discount = Number(row.quotation.discount || 0);
        return subtotal + gstAmount - discount;
    };

    const getCreatorName = (row) => {
        if (row.User?.creators && row.User.creators.length > 0) {
            return row.User.creators[0].firstName;
        }
        return row.User?.firstName || "Unknown";
    };

    // ─── Table config ────────────────────────────────────────────────────────
    const columns = [
        {
            key: "quotationNumber",
            label: "Quotation Details",
            sortable: false,
            render: (row) => (
                <div>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        #{row.quotation?.quotationNumber || row.quotationNumber || "N/A"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
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
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {row.quotation?.companyName || row.quotation?.billToName || row.customerName || "Unknown"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate max-w-[200px]">
                        <User className="w-3 h-3" />
                        {row.quotation?.billToName || row.quotation?.toName || row.customerName}
                    </p>
                </div>
            ),
        },
        {
            key: "createdBy",
            label: "Created By",
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    {getCreatorName(row)}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            sortable: false,
            render: (row) => (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${row.status === "draft"
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                    {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Unknown"}
                </span>
            ),
        },
        {
            key: "total",
            label: "Grand Total",
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1 font-bold text-slate-700">
                    <IndianRupee className="w-4 h-4 text-slate-400" />
                    {getGrandTotal(row).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
            ),
        },
    ];

    const actions = [
        {
            type: "button",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(row);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                        View
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPdf(row.id, row.quotation?.quotationNumber || row.quotationNumber);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                        Quotations
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium hidden sm:block">
                        View and download generated quotation PDFs.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Quotation
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search quotations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto p-0">
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
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                            <Loader />
                            <span className="text-sm font-semibold text-slate-600">Processing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── View Quotation Details Modal ────────────────────────────────────── */}
            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    Quotation #{viewData.quotationNumber}
                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${viewData.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
                                        {viewData.status}
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Ref: {viewData.referenceNumber || viewData.quotation?.referenceNumber || "N/A"}</p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Meta Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                <div>
                                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Date</span>
                                    <p className="font-medium text-slate-800 mt-0.5">{viewData.quotation?.date || new Date(viewData.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Created By</span>
                                    <p className="font-medium text-slate-800 mt-0.5">{getCreatorName(viewData)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Tally Ref No</span>
                                    <p className="font-medium text-slate-800 mt-0.5">{viewData.quotation?.tallyQuotationNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Company</span>
                                    <p className="font-medium text-slate-800 mt-0.5">{viewData.quotation?.companyName || "N/A"}</p>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-slate-200 rounded-xl p-4">
                                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Billed To
                                    </h3>
                                    <p className="font-semibold text-slate-800">{viewData.quotation?.billToName || viewData.customerName}</p>
                                    <p className="text-sm text-slate-600 mt-1">{viewData.quotation?.billToAddress || "No address provided"}</p>
                                    <p className="text-sm text-slate-600">
                                        {viewData.quotation?.billToState} {viewData.quotation?.billToCountry} - {viewData.quotation?.billToPincode}
                                    </p>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-4">
                                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Shipped To
                                    </h3>
                                    <p className="font-semibold text-slate-800">{viewData.quotation?.shipToName || viewData.customerName}</p>
                                    <p className="text-sm text-slate-600 mt-1">{viewData.quotation?.shipToAddress || "No address provided"}</p>
                                    <p className="text-sm text-slate-600">
                                        {viewData.quotation?.shipToState} {viewData.quotation?.shipToCountry} - {viewData.quotation?.shipToPincode}
                                    </p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div>
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Line Items</h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">#</th>
                                                <th className="px-4 py-3">Item / Service</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Rate (₹)</th>
                                                <th className="px-4 py-3 text-center">GST (%)</th>
                                                <th className="px-4 py-3 text-right">Discount</th>
                                                <th className="px-4 py-3 text-right">Total Value (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewData.quotation?.items?.length > 0 ? (
                                                viewData.quotation.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-slate-500">{item.index || idx + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-800">{item.itemName || item.service || "Unknown Item"}</td>
                                                        <td className="px-4 py-3 text-center text-slate-600">{item.quantity || 1}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{item.rate?.toLocaleString('en-IN') || item.amount || 0}</td>
                                                        <td className="px-4 py-3 text-center text-slate-600">{item.gst || 0}%</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">{item.discountAmt || item.discount || 0}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-800">{item.value?.toLocaleString('en-IN') || 0}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-4 py-6 text-center text-slate-400">No items found for this quotation.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financials & Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes & Bank Details</h3>
                                    <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{viewData.quotation?.notes || "No notes added."}</p>
                                    {viewData.quotation?.bankName && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bank Name</span>
                                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{viewData.quotation.bankName}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Sub Total</span>
                                        <span>₹{viewData.quotation?.subTotal?.toLocaleString('en-IN') || 0}</span>
                                    </div>
                                    {viewData.quotation?.cgst > 0 && (
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>CGST</span>
                                            <span>₹{viewData.quotation.cgst.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {viewData.quotation?.sgst > 0 && (
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>SGST</span>
                                            <span>₹{viewData.quotation.sgst.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {viewData.quotation?.igst > 0 && (
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>IGST</span>
                                            <span>₹{viewData.quotation.igst.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-red-500">
                                        <span>Discount</span>
                                        <span>- ₹{viewData.quotation?.discount?.toLocaleString('en-IN') || 0}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-base font-bold text-slate-800">Grand Total</span>
                                        <span className="text-lg font-bold text-indigo-600">₹{getGrandTotal(viewData).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ─── Create Quotation Modal ────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Create New Quotation</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="quotation-form" onSubmit={handleCreateSubmit} className="space-y-6">

                                {/* Section: Basic Details */}
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wider">Company Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                            <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. ABC Pvt Ltd" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                                            <input required type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 22AAAAA0000A1Z5" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Address</label>
                                            <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Delhi, India" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Quotation Info */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wider">Quotation Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Quotation Number</label>
                                            <input required type="text" name="quotationNumber" value={formData.quotationNumber} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Q-101" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
                                            <input required type="text" name="fromName" value={formData.fromName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Vishupal" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Client Details */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wider">Client Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Billed To (Name)</label>
                                            <input required type="text" name="toName" value={formData.toName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Client Name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                            <input required type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Phone Number" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Client Address</label>
                                            <input required type="text" name="toAddress" value={formData.toAddress} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Client Address" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Items */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Line Items</h3>
                                        <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.items.map((item, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-start sm:items-center">

                                                {/* Dynamic Category Dropdown */}
                                                <div className="w-full sm:w-1/3">
                                                    <select
                                                        required
                                                        value={item.category}
                                                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                                                    >
                                                        <option value="" disabled>Select Category</option>
                                                        {categories.map((c) => (
                                                            <option key={c.id} value={c.category_name}>{c.category_name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Dynamic Service Dropdown */}
                                                <div className="w-full sm:w-1/3">
                                                    <select
                                                        required
                                                        value={item.service}
                                                        onChange={(e) => handleItemChange(index, 'service', e.target.value)}
                                                        disabled={!item.category}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                                                    >
                                                        <option value="" disabled>Select Service</option>
                                                        {(() => {
                                                            const selectedCat = categories.find(c => c.category_name === item.category);
                                                            if (!selectedCat) return null;

                                                            const subs = subcategoriesMap[selectedCat.id] || selectedCat.subcategories || selectedCat.SubCategories || [];

                                                            return subs.map((s) => (
                                                                <option key={s.id} value={s.sub_category_name}>
                                                                    {s.sub_category_name}
                                                                </option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </div>

                                                <div className="w-full sm:w-1/3 flex items-center gap-2">
                                                    <div className="relative w-full">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                        <input required type="number" min="0" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(index, 'amount', e.target.value)} className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                                                    </div>
                                                    {formData.items.length > 1 && (
                                                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove Item">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Totals & Notes */}
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Terms</label>
                                            <textarea rows={3} name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Thank you for your business..." />
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-700">GST Rate (%)</label>
                                            <input type="number" min="0" max="100" name="gstRate" value={formData.gstRate} onChange={handleInputChange} className="w-24 px-3 py-1.5 text-right bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-700">Discount (₹)</label>
                                            <input type="number" min="0" name="discount" value={formData.discount} onChange={handleInputChange} className="w-32 px-3 py-1.5 text-right bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="quotation-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader className="w-4 h-4 border-2 border-white/20 border-t-white" /> Saving...</>
                                ) : "Create Quotation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}