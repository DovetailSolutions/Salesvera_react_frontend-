import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
    Search, Printer, FileText, IndianRupee, Calendar,
    Building2, User, UserCircle, Plus, Eye
} from "lucide-react";
import ManageInvoiceModal from "../../components/invoice/ManageInvoiceModal";
import CreateInvoiceModal from "../../components/invoice/CreateInvoiceModal";
import { quotationApi } from "../../api";
import { AuthContext } from "../../context/AuthProvider";
import Table from "../../components/Table";
import Loader from "../../components/Loader";

export default function InvoiceList() {
    const { user } = useContext(AuthContext);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalItems, setTotalItems] = useState(0);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchInvoices = async (page = 1, search = "") => {
        try {
            setLoading(true);
            const params = { page, limit: pageSize };
            if (search) params.search = search;

            const res = await quotationApi.getInvoiceList(params);
            // Based on your JSON, the array is directly inside res.data.data
            const rows = res.data?.data.data || [];
            // If API adds pagination later, adjust total extraction here
            const total = res.data?.data.totalItems || rows.length;

            setInvoices(rows);
            setTotalItems(total);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    // ─── Actions ─────────────────────────────────────────────────────────────
    const handlePrintInvoice = (row) => {
        try {
            const printWindow = window.open('', '_blank');
            const invoice = row.invoice || {};
            const grandTotal = invoice.totalValue || 0;
            const items = invoice.items || [];

            // Format status badge color
            const isPaid = row.status === 'paid';
            const badgeBg = isPaid ? '#d1fae5' : '#fef3c7';
            const badgeColor = isPaid ? '#047857' : '#b45309';
            const badgeBorder = isPaid ? '#a7f3d0' : '#fde68a';

            // Build the frontend printable template mirroring ManageInvoiceModal
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice - ${row.invoiceNumber || row.id}</title>
                    <style>
                        body { 
                            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; 
                            padding: 40px; 
                            color: #1e293b; 
                            margin: 0;
                            line-height: 1.5;
                        }
                        .header-container {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            border-bottom: 1px solid #f1f5f9;
                            padding-bottom: 20px;
                            margin-bottom: 24px;
                        }
                        .invoice-title {
                            font-size: 24px;
                            font-weight: 700;
                            color: #1e293b;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            margin: 0 0 4px 0;
                        }
                        .status-badge {
                            padding: 4px 10px;
                            font-size: 10px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            border-radius: 9999px;
                            background-color: ${badgeBg};
                            color: ${badgeColor};
                            border: 1px solid ${badgeBorder};
                        }
                        .meta-text {
                            font-size: 14px;
                            color: #64748b;
                            margin: 0;
                        }
                        
                        /* Grids */
                        .grid-4 {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 16px;
                            background-color: #f8fafc;
                            border: 1px solid #f1f5f9;
                            border-radius: 12px;
                            padding: 16px;
                            margin-bottom: 24px;
                        }
                        .grid-2 {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 24px;
                            margin-bottom: 24px;
                        }
                        
                        /* Boxes */
                        .box {
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            padding: 16px;
                        }
                        .box-title {
                            font-size: 12px;
                            font-weight: 700;
                            color: #4f46e5;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin: 0 0 12px 0;
                        }
                        .label-text {
                            color: #94a3b8;
                            font-weight: 600;
                            font-size: 10px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin: 0 0 4px 0;
                        }
                        .value-text {
                            font-weight: 500;
                            color: #1e293b;
                            font-size: 14px;
                            margin: 0;
                        }
                        
                        /* Table */
                        .table-container {
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            overflow: hidden;
                            margin-bottom: 24px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            text-align: left;
                        }
                        th {
                            background-color: #f8fafc;
                            padding: 12px 16px;
                            font-size: 12px;
                            font-weight: 600;
                            color: #475569;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        td {
                            padding: 12px 16px;
                            font-size: 14px;
                            color: #475569;
                            border-bottom: 1px solid #f1f5f9;
                        }
                        td.item-name {
                            font-weight: 500;
                            color: #1e293b;
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        
                        /* Totals */
                        .totals-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 14px;
                            color: #475569;
                            margin-bottom: 8px;
                        }
                        .grand-total {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-top: 1px solid #e2e8f0;
                            padding-top: 12px;
                            margin-top: 12px;
                            font-weight: 700;
                            color: #1e293b;
                            font-size: 16px;
                        }
                        .grand-total-value {
                            font-size: 18px;
                            color: #4f46e5;
                        }

                        @media print {
                            @page { margin: 0; }
                            body { 
                                margin: 1.6cm; 
                                -webkit-print-color-adjust: exact; 
                                print-color-adjust: exact; 
                            }
                            .box, .grid-4, .table-container { break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div>
                            <h2 class="invoice-title">
                                Invoice #${row.invoiceNumber || 'N/A'}
                                <span class="status-badge">${row.status || 'Draft'}</span>
                            </h2>
                            <p class="meta-text">Quotation Ref: ${row.quotationNumber || invoice.tallyQuotationNumber || "N/A"}</p>
                        </div>
                    </div>

                    <div class="grid-4">
                        <div>
                            <p class="label-text">Date</p>
                            <p class="value-text">${new Date(row.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="label-text">Reference No.</p>
                            <p class="value-text">${invoice.referenceNumber || "N/A"}</p>
                        </div>
                        <div>
                            <p class="label-text">Company</p>
                            <p class="value-text">${invoice.companyName || "N/A"}</p>
                        </div>
                        <div>
                            <p class="label-text">Customer Name</p>
                            <p class="value-text">${row.customerName || "N/A"}</p>
                        </div>
                    </div>

                    <div class="grid-2">
                        <div class="box">
                            <h3 class="box-title">Billed To</h3>
                            <p class="value-text" style="font-weight: 600;">${invoice.billTo?.name || invoice.billToName || row.customerName || "N/A"}</p>
                            <p class="meta-text" style="margin-top: 4px;">${invoice.billTo?.address || invoice.billToAddress || "No address provided"}</p>
                            <p class="meta-text">${[invoice.billTo?.state || invoice.billToState, invoice.billTo?.country || invoice.billToCountry].filter(Boolean).join(", ")} ${invoice.billTo?.pincode ? ` - ${invoice.billTo.pincode}` : ''}</p>
                        </div>
                        <div class="box">
                            <h3 class="box-title">Shipped To</h3>
                            <p class="value-text" style="font-weight: 600;">${invoice.shipTo?.name || invoice.shipToName || row.customerName || "N/A"}</p>
                            <p class="meta-text" style="margin-top: 4px;">${invoice.shipTo?.address || invoice.shipToAddress || "No address provided"}</p>
                            <p class="meta-text">${[invoice.shipTo?.state || invoice.shipToState, invoice.shipTo?.country || invoice.shipToCountry].filter(Boolean).join(", ")} ${invoice.shipTo?.pincode ? ` - ${invoice.shipTo.pincode}` : ''}</p>
                        </div>
                    </div>

                    <div class="box-title" style="margin-bottom: 12px;">Line Items</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Item / Service</th>
                                    <th class="text-center">Qty</th>
                                    <th class="text-right">Rate (₹)</th>
                                    <th class="text-center">GST (%)</th>
                                    <th class="text-right">Discount</th>
                                    <th class="text-right">Value (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.length > 0 ? items.map((item, idx) => `
                                    <tr>
                                        <td>${item.index || idx + 1}</td>
                                        <td class="item-name">${item.itemName || "Unknown Item"}</td>
                                        <td class="text-center">${item.quantity || 1}</td>
                                        <td class="text-right">${item.rate?.toLocaleString('en-IN') || 0}</td>
                                        <td class="text-center">${item.gst || 0}%</td>
                                        <td class="text-right">${item.discountAmt || item.discountAmount || 0}</td>
                                        <td class="text-right item-name">${item.value?.toLocaleString('en-IN') || 0}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="7" class="text-center" style="padding: 24px;">No items found.</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <div class="grid-2">
                        <div class="box">
                            <h3 class="box-title" style="color: #64748b;">Notes & Bank Details</h3>
                            <p class="meta-text" style="color: #334155; margin-bottom: 12px; white-space: pre-wrap;">${invoice.notes || "No notes added."}</p>
                            
                            ${invoice.bankName ? `
                                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
                                    <p class="label-text">Bank Name</p>
                                    <p class="value-text">${invoice.bankName}</p>
                                </div>
                            ` : ''}
                        </div>

                        <div class="box">
                            <div class="totals-row">
                                <span>Sub Total</span>
                                <span>₹${(invoice.pricing?.subTotal || invoice.subTotal || 0).toLocaleString('en-IN')}</span>
                            </div>
                            
                            ${(invoice.pricing?.cgst || invoice.cgst) > 0 ? `
                                <div class="totals-row">
                                    <span>CGST</span>
                                    <span>₹${(invoice.pricing?.cgst || invoice.cgst).toLocaleString('en-IN')}</span>
                                </div>
                            ` : ''}
                            
                            ${(invoice.pricing?.sgst || invoice.sgst) > 0 ? `
                                <div class="totals-row">
                                    <span>SGST</span>
                                    <span>₹${(invoice.pricing?.sgst || invoice.sgst).toLocaleString('en-IN')}</span>
                                </div>
                            ` : ''}

                            ${(invoice.pricing?.igst || invoice.igst) > 0 ? `
                                <div class="totals-row">
                                    <span>IGST</span>
                                    <span>₹${(invoice.pricing?.igst || invoice.igst).toLocaleString('en-IN')}</span>
                                </div>
                            ` : ''}

                            ${(invoice.pricing?.discount || invoice.overallDiscount) > 0 ? `
                                <div class="totals-row" style="color: #ef4444;">
                                    <span>Total Discount</span>
                                    <span>- ₹${(invoice.pricing?.discount || invoice.overallDiscount).toLocaleString('en-IN')}</span>
                                </div>
                            ` : ''}

                            <div class="grand-total">
                                <span>Grand Total</span>
                                <span class="grand-total-value">₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Wait for styles to apply before triggering print
            printWindow.onload = function () {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate printable invoice");
        }
    };

    const handleViewDetails = (row) => {
        setViewData(row);
        setIsViewModalOpen(true);
    };

    const handleUpdateStatus = async (status) => {
        if (!viewData) return;
        const toastId = toast.loading(`Marking as ${status}...`);
        try {
            await invoiceApi.updateInvoiceStatus(viewData.id, { status });
            toast.success(`Invoice marked as ${status}!`, { id: toastId });
            fetchInvoices(currentPage, searchQuery);
            setIsViewModalOpen(false);
        } catch (err) {
            toast.error("Failed to update status", { id: toastId });
        }
    };

    const getGrandTotal = (row) => {
        if (row.invoice?.totalValue !== undefined) return row.invoice.totalValue;
        return 0;
    };

    const getCreatorName = (row) => {
        // Fallback for user name if not present in the new endpoint structure
        return row.customerName || "System";
    };

    // ─── Table Config ────────────────────────────────────────────────────────
    const columns = [
        {
            key: "invoiceNumber",
            label: "Invoice Details",
            sortable: false,
            render: (row) => (
                <div>
                    <span className="font-semibold text flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        #{row.invoiceNumber || "N/A"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(row.createdAt).toLocaleDateString() || "N/A"}
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
                        <Building2 className="w-4 h-4 text" />
                        {row.invoice?.companyName || "Unknown"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate max-w-[200px]">
                        <User className="w-3 h-3" />
                        {row.invoice?.billToName || row.customerName}
                    </p>
                </div>
            ),
        },
        {
            key: "createdBy",
            label: "Customer",
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1.5 text-sm text font-medium">
                    <UserCircle className="w-4 h-4 text" />
                    {getCreatorName(row)}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            sortable: false,
            render: (row) => (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${row.status === "draft" ? "bg-slate-100 text-black border-slate-200 text-gray-700" :
                    row.status === "accepted" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
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
                <div className="flex items-center gap-1 font-bold text">
                    <IndianRupee className="w-4 h-4 text" />
                    {getGrandTotal(row).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
            ),
        },
    ];

    const actions = [
        {
            type: "menu",
            label: "Actions",
            className: "p-1.5 text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            menuItems: [
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                            <Eye className="w-4 h-4" /> Manage
                        </span>
                    ),
                    onClick: (row) => handleViewDetails(row),
                    className: "hover:!bg-indigo-50 dark:hover:!bg-indigo-500/10 cursor-pointer",
                },
                {
                    label: (
                        <span className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                            <Printer className="w-4 h-4" /> Print Invoice
                        </span>
                    ),
                    // Modified to pass the whole row instead of just ID so we have data to print
                    onClick: (row) => handlePrintInvoice(row),
                    className: "hover:!bg-blue-50 dark:hover:!bg-blue-500/10 cursor-pointer",
                }
            ]
        }
    ];

    return (
        <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />
            <div className="translucent p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:translucent transition-all" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 w-full">


                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> Create Invoice
                    </button>
                </div>

            </div>

            <div className="relative flex-1 translucent rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto p-0">
                    <Table
                        columns={columns}
                        data={invoices}
                        actions={actions}
                        keyField="id"
                        emptyMessage="No invoices found"
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalCount={totalItems}
                        onPageChange={setCurrentPage}
                    />
                </div>
                {loading && (
                    <Loader />

                )}
            </div>

            {/* ─── External Modals ─── */}
            <ManageInvoiceModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                data={viewData}
                onUpdateStatus={handleUpdateStatus}
            />

            <CreateInvoiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchInvoices(1, searchQuery)}
            />
        </div>
    );
}