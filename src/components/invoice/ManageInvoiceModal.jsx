import React from "react";
import { X, IndianRupee, CheckCircle, MapPin } from "lucide-react";

export default function ManageInvoiceModal({
    isOpen,
    onClose,
    data,
    onUpdateStatus
}) {
    if (!isOpen || !data) return null;

    const { invoice } = data;
    const grandTotal = invoice?.totalValue || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theblur p-4">
            <div className="popup-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between popup-card/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Invoice #{data.invoiceNumber}
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full custom-border-top ${data.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                {data.status}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Quotation Ref: {data.quotationNumber || "N/A"}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm popup-card custom-border-top border-slate-100 p-4 rounded-xl">
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Date</span>
                            <p className="font-medium text-slate-800 mt-0.5">{new Date(data.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Reference No.</span>
                            <p className="font-medium text-slate-800 mt-0.5">{invoice?.referenceNumber || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Company</span>
                            <p className="font-medium text-slate-800 mt-0.5">{invoice?.companyName || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">Customer Name</span>
                            <p className="font-medium text-slate-800 mt-0.5">{data.customerName || "N/A"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-200 rounded-xl p-4 translucent-inner ">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Billed To
                            </h3>
                            <p className="font-semibold text-slate-800">{invoice?.billToName || data.customerName}</p>
                            <p className="text-sm text-slate-600 mt-1">{invoice?.billToAddress || "No address provided"}</p>
                            <p className="text-sm text-slate-600">
                                {[invoice?.billToState, invoice?.billToCountry].filter(Boolean).join(", ")}
                                {invoice?.billToPincode ? ` - ${invoice.billToPincode}` : ''}
                            </p>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-4 translucent-inner ">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Shipped To
                            </h3>
                            <p className="font-semibold text-slate-800">{invoice?.shipToName || data.customerName}</p>
                            <p className="text-sm text-slate-600 mt-1">{invoice?.shipToAddress || "No address provided"}</p>
                            <p className="text-sm text-slate-600">
                                {[invoice?.shipToState, invoice?.shipToCountry].filter(Boolean).join(", ")}
                                {invoice?.shipToPincode ? ` - ${invoice.shipToPincode}` : ''}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Line Items</h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="popup-card border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
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
                                <tbody className="divide-y divide-slate-100 translucent-inner ">
                                    {invoice?.items?.length > 0 ? (
                                        invoice.items.map((item, idx) => (
                                            <tr key={idx} className="hover:popup-card transition-colors">
                                                <td className="px-4 py-3 text-slate-500">{item.index || idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{item.itemName || "Unknown Item"}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{item.quantity || 1}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{item.rate?.toLocaleString('en-IN') || 0}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{item.gst || 0}%</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{item.discountAmt || 0}</td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800">{item.value?.toLocaleString('en-IN') || 0}</td>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-slate-200 popup-card rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes & Bank Details</h3>
                            <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{invoice?.notes || "No notes added."}</p>
                            {invoice?.bankName && (
                                <div className="mt-4 pt-4  custom-border-top border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bank Name</span>
                                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{invoice.bankName}</p>
                                </div>
                            )}
                        </div>

                        <div className="border border-slate-200 translucent-inner  rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Sub Total</span>
                                <span>₹{invoice?.subTotal?.toLocaleString('en-IN') || 0}</span>
                            </div>
                            {invoice?.cgst > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>CGST</span>
                                    <span>₹{invoice.cgst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {invoice?.sgst > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>SGST</span>
                                    <span>₹{invoice.sgst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {invoice?.igst > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>IGST</span>
                                    <span>₹{invoice.igst.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {(invoice?.discount > 0) && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Total Discount</span>
                                    <span>- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="pt-3 mt-3  custom-border-top border-slate-200 flex justify-between items-center">
                                <span className="text-base font-bold text-slate-800">Grand Total</span>
                                <span className="text-lg font-bold text-indigo-600 flex items-center">
                                    <IndianRupee className="w-5 h-5 mr-0.5" />
                                    {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4  custom-border-top border-slate-100 popup-card flex items-center justify-between shrink-0">
                    <div className="flex gap-2.5">

                    </div>
                    <button onClick={onClose} className="px-5 py-2.5 translucent-inner  custom-border-top border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:popup-card transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}