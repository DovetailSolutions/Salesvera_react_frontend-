import React from "react";
import { X, IndianRupee, CheckCircle, MapPin, FileText } from "lucide-react";

export default function ManageQuotationModal({
    isOpen,
    onClose,
    data,
    onUpdateStatus,
    onGenerateInvoice
}) {
    if (!isOpen || !data) return null;

    const { quotation } = data;

    // Use API totalValue, fallback to safe calculation if missing
    const grandTotal = quotation?.totalValue || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theblur p-4">
            <div className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 popup-card">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-400 flex items-center gap-2">
                            Quotation #{data.quotationNumber}
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full custom-border ${data.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                {data.status}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Manage quotation status and invoices</p>
                    </div>
                    <div
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm  custom-border border-slate-100 p-4 rounded-xl">
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Date</span>
                            <p className="font-medium text-gray-700 dark:text-gray-400 mt-0.5">{quotation?.date || new Date(data.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Reference No.</span>
                            <p className="font-medium text-gray-700 dark:text-gray-400 mt-0.5">{data.referenceNumber || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Tally Ref No</span>
                            <p className="font-medium text-gray-700 dark:text-gray-400 mt-0.5">{quotation?.tallyQuotationNumber || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Customer Name</span>
                            <p className="font-medium text-gray-700 dark:text-gray-400 mt-0.5">{data.customerName || "N/A"}</p>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="custom-border border-slate-200 rounded-xl p-4 ">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Billed To
                            </h3>
                            <p className="font-semibold text-gray-700 dark:text-gray-400">{quotation?.billTo?.name || quotation?.billToName || data.customerName}</p>
                            <p className="text-sm text mt-1">{quotation?.billTo?.address || quotation?.billToAddress || "No address provided"}</p>
                            <p className="text-sm text">
                                {[quotation?.billTo?.state || quotation?.billToState, quotation?.billTo?.country || quotation?.billToCountry].filter(Boolean).join(", ")}
                                {(quotation?.billTo?.pincode || quotation?.billToPincode) ? ` - ${quotation?.billTo?.pincode || quotation?.billToPincode}` : ''}
                            </p>
                        </div>
                        <div className="custom-border border-slate-200 rounded-xl p-4 ">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Shipped To
                            </h3>
                            <p className="font-semibold text-gray-700 dark:text-gray-400">{quotation?.shipTo?.name || quotation?.shipToName || data.customerName}</p>
                            <p className="text-sm text mt-1">{quotation?.shipTo?.address || quotation?.shipToAddress || "No address provided"}</p>
                            <p className="text-sm text">
                                {[quotation?.shipTo?.state || quotation?.shipToState, quotation?.shipTo?.country || quotation?.shipToCountry].filter(Boolean).join(", ")}
                                {(quotation?.shipTo?.pincode || quotation?.shipToPincode) ? ` - ${quotation?.shipTo?.pincode || quotation?.shipToPincode}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div>
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Line Items</h3>
                        <div className="custom-border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className=" custom-border border-slate-200 text font-semibold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Item / Service</th>
                                        <th className="px-4 py-3 text-center">Qty</th>
                                        <th className="px-4 py-3 text-right">Rate (₹)</th>
                                        <th className="px-4 py-3 text-center">GST (%)</th>
                                        <th className="px-4 py-3 text-right">Discount</th>
                                        <th className="px-4 py-3 text-right">Value (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 ">
                                    {quotation?.items?.length > 0 ? (
                                        quotation.items.map((item, idx) => (
                                            <tr key={idx} className="hover: transition-colors">
                                                <td className="px-4 py-3 text-slate-500">{item.index || idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-400">{item.itemName || "Unknown Item"}</td>
                                                <td className="px-4 py-3 text-center text">{item.quantity || 1}</td>
                                                <td className="px-4 py-3 text-right text">{item.rate?.toLocaleString('en-IN') || 0}</td>
                                                <td className="px-4 py-3 text-center text">{item.gst || 0}%</td>
                                                <td className="px-4 py-3 text-right text">{item.discountAmt || 0}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-400">{item.value?.toLocaleString('en-IN') || 0}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-6 text-center text-slate-400">No items found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financials & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className=" rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes & Bank Details</h3>
                            <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{quotation?.notes || "No notes added."}</p>
                            {quotation?.bankName && (
                                <div className="mt-4 pt-4 custom-border-top">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bank Name</span>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-400 mt-0.5">{quotation.bankName}</p>
                                </div>
                            )}
                        </div>

                        <div className="custom-border border-slate-200  rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm text">
                                <span>Sub Total</span>
                                <span>₹{quotation?.subTotal?.toLocaleString('en-IN') || 0}</span>
                            </div>
                            {quotation?.cgst > 0 && (
                                <div className="flex justify-between text-sm text">
                                    <span>CGST</span>
                                    <span>₹{quotation.cgst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {quotation?.sgst > 0 && (
                                <div className="flex justify-between text-sm text">
                                    <span>SGST</span>
                                    <span>₹{quotation.sgst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {quotation?.igst > 0 && (
                                <div className="flex justify-between text-sm text">
                                    <span>IGST</span>
                                    <span>₹{quotation.igst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {(quotation?.discount > 0) && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Total Discount</span>
                                    <span>- ₹{quotation.discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="pt-3 mt-3 custom-border-top flex justify-between items-center">
                                <span className="text-base font-bold text-gray-700 dark:text-gray-400">Grand Total</span>
                                <span className="text-lg font-bold text-indigo-600 flex items-center">
                                    <IndianRupee className="w-5 h-5 mr-0.5" />
                                    {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Modal Action Footer */}
                <div className="px-6 py-4 custom-border border-slate-100  flex items-center justify-between shrink-0">
                    <div className="flex gap-2.5">
                        {data.status !== 'accepted' && (
                            <button
                                onClick={() => onUpdateStatus('accepted')}
                                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <CheckCircle className="w-4 h-4" /> Accept Quotation
                            </button>
                        )}
                        <button
                            onClick={() => onGenerateInvoice(data)}
                            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <FileText className="w-4 h-4" /> Prepare Invoice
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5  custom-border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover: transition-colors"
                    >
                        <X className="w-4 h-4 mr-1 inline" /> Close
                    </button>
                </div>
            </div>
        </div>
    );
}