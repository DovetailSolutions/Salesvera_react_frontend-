import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Plus, Trash2, Search, Copy } from "lucide-react";
import { menuapi, quotationApi, authApi } from "../../api";
import Loader from "../Loader";

export default function CreateQuotationModal({
    isOpen,
    onClose,
    onSuccess,
    invoiceData = null,
    isInvoiceMode = false
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategoriesMap, setSubcategoriesMap] = useState({});

    // Profile & Bank Data State
    const [companyBanks, setCompanyBanks] = useState([]);
    const [companyId, setCompanyId] = useState(1);

    // Client Search State
    const [clients, setClients] = useState([]);
    const [isSearchingClient, setIsSearchingClient] = useState(false);

    // Discount Type State
    const [overallDiscountType, setOverallDiscountType] = useState("amount");

    const initialFormState = {
        type: "item",
        tallyInvoiceNumber: "",
        QuotationNumber: "",
        referenceNumber: "",
        companyName: "",
        date: new Date().toISOString().split('T')[0],
        status: "draft",
        customerName: "",
        customerAddress: "",

        billToName: "",
        billToEmail: "",
        billToMobile: "",
        billToAddress: "",
        billToCity: "",
        billToState: "",
        billToCountry: "India",
        billToPincode: "",
        billToGstNumber: "",
        billToPanNumber: "",

        shipToName: "",
        shipToEmail: "",
        shipToMobile: "",
        shipToAddress: "",
        shipToCity: "",
        shipToState: "",
        shipToCountry: "India",
        shipToPincode: "",
        shipToGstNumber: "",
        shipToPanNumber: "",

        bankName: "",
        notes: "Thank you for your business",
        overallDiscount: 0,
        items: [
            { category: "", itemName: "", quantity: 1, rate: 0, gst: 18, discount: 0 }
        ]
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (!isOpen) return;

        if (isInvoiceMode && invoiceData) {
            const rootData = invoiceData;
            const qt = invoiceData.quotation || {};

            setFormData({
                type: qt.type || "item",
                tallyInvoiceNumber: qt.tallyQuotationNumber || "",
                tallyInvoiceNumber: (() => {
                    const now = new Date();
                    const pad = (n) => String(n).padStart(2, "0");
                    const datePart =
                        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
                        `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                    return `${datePart}${nanoid(6).toUpperCase()}`;
                })(),
                QuotationNumber: rootData.quotationNumber || qt.quotationNumber || "",
                referenceNumber: qt.referenceNumber || rootData.referenceNumber || "",
                companyName: qt.companyName || "",
                date: new Date().toISOString().split('T')[0],
                status: "draft",
                customerName: qt.customerName || rootData.customerName || "",
                customerAddress: qt.customerAddress || "",

                billToName: qt.billToName || rootData.customerName || "",
                billToEmail: qt.billToEmail || "",
                billToMobile: qt.billToMobile || "",
                billToAddress: qt.billToAddress || "",
                billToCity: qt.billToCity || "",
                billToState: qt.billToState || "",
                billToCountry: qt.billToCountry || "India",
                billToPincode: qt.billToPincode || "",
                billToGstNumber: qt.billToGstNumber || "",
                billToPanNumber: qt.billToPanNumber || "",

                shipToName: qt.shipToName || rootData.customerName || "",
                shipToEmail: qt.shipToEmail || "",
                shipToMobile: qt.shipToMobile || "",
                shipToAddress: qt.shipToAddress || "",
                shipToCity: qt.shipToCity || "",
                shipToState: qt.shipToState || "",
                shipToCountry: qt.shipToCountry || "India",
                shipToPincode: qt.shipToPincode || "",
                shipToGstNumber: qt.shipToGstNumber || "",
                shipToPanNumber: qt.shipToPanNumber || "",

                bankName: qt.bankName || "",
                notes: qt.notes || "Thank you for your business",
                overallDiscount: Math.abs(qt.discount || 0),

                items: Array.isArray(qt.items) ? qt.items.map(item => ({
                    category: item.category || "",
                    itemName: item.itemName || item.service || "",
                    quantity: item.quantity || 1,
                    rate: item.rate || item.amount || 0,
                    gst: item.gst || 18,
                    discount: item.discount || 0,
                    originalQuantity: item.quantity || 1, // Store max limit
                })) : [{ category: "", itemName: "", quantity: 1, rate: 0, gst: 18, discount: 0, originalQuantity: 1 }]
            });

            if (rootData.companyId) setCompanyId(rootData.companyId);

        } else {
            if (categories.length === 0) {
                const fetchCats = async () => {
                    try {
                        const res = await menuapi.categoryList({ limit: 1000 });
                        setCategories(res.data?.data?.rows || res.data?.rows || []);
                    } catch (err) {
                        toast.error("Failed to load categories");
                    }
                };
                fetchCats();
            }

            const fetchProfile = async () => {
                try {
                    const res = await authApi.getProfile();
                    const profileData = res.data?.data || res.data;

                    if (profileData) {
                        const fetchedCompanyName = profileData.firstName || profileData.lastName || "Default Company";
                        const fetchedBanks = profileData.company?.companyBanks || [];

                        setCompanyBanks(fetchedBanks);
                        if (fetchedBanks.length > 0 && fetchedBanks[0].companyId) {
                            setCompanyId(fetchedBanks[0].companyId);
                        }

                        setFormData(prev => ({
                            ...prev,
                            companyName: fetchedCompanyName,
                            bankName: fetchedBanks.length > 0 ? fetchedBanks[0].bankName : ""
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load profile details", err);
                    toast.error("Failed to load company details.");
                }
            };
            fetchProfile();
        }
    }, [isOpen, isInvoiceMode, invoiceData]);

    if (!isOpen) return null;

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientSearch = async (e) => {
        const query = e.target.value;
        handleInputChange(e);

        if (query.length > 2) {
            setIsSearchingClient(true);
            try {
                const res = await quotationApi.searchClients({ search: query });
                setClients(res.data?.data?.data || []);
            } catch (error) {
                console.error("Client search failed", error);
            } finally {
                setIsSearchingClient(false);
            }
        } else {
            setClients([]);
        }
    };

    const selectClient = (client) => {
        setFormData(prev => ({
            ...prev,
            customerName: client.companyName || client.name || "",
            customerAddress: client.address || "",

            billToName: client.companyName || client.name || "",
            billToEmail: client.email || "",
            billToMobile: client.mobile || "",
            billToAddress: client.address || "",
            billToCity: client.city || "",
            billToState: client.state || "",
            billToCountry: client.country || "India",
            billToPincode: client.pincode || "",
            billToGstNumber: client.gstNumber || "",
            billToPanNumber: client.panNumber || ""
        }));
        setClients([]);
    };

    const copyBillToShip = () => {
        setFormData(prev => ({
            ...prev,
            shipToName: prev.billToName,
            shipToEmail: prev.billToEmail,
            shipToMobile: prev.billToMobile,
            shipToAddress: prev.billToAddress,
            shipToCity: prev.billToCity,
            shipToState: prev.billToState,
            shipToCountry: prev.billToCountry,
            shipToPincode: prev.billToPincode,
            shipToGstNumber: prev.billToGstNumber,
            shipToPanNumber: prev.billToPanNumber
        }));
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...formData.items];

        // Handle Quantity Capping in Invoice Mode
        if (field === 'quantity') {
            let val = Number(value);
            if (isInvoiceMode && newItems[index].originalQuantity !== undefined) {
                if (val > newItems[index].originalQuantity) {
                    toast.error(`Quantity cannot exceed the original quotation (${newItems[index].originalQuantity})`);
                    val = newItems[index].originalQuantity;
                }
            }
            newItems[index][field] = val;
        } else {
            newItems[index][field] = value;
        }

        if (field === "category") {
            newItems[index].itemName = "";
            newItems[index].rate = 0;
            const selectedCat = categories.find((c) => c.category_name === value);

            if (selectedCat?.id && !subcategoriesMap[selectedCat.id]) {
                try {
                    const res = await menuapi.getSubCategory(selectedCat.id);
                    const subs = res.data?.data || res.data || [];
                    setSubcategoriesMap(prev => ({ ...prev, [selectedCat.id]: Array.isArray(subs) ? subs : [] }));
                } catch (err) {
                    console.error("Failed to fetch subcategories", err);
                }
            }
        }

        if (field === "itemName") {
            const catName = newItems[index].category;
            const selectedCat = categories.find((c) => c.category_name === catName);
            if (selectedCat) {
                const subs = subcategoriesMap[selectedCat.id] || selectedCat.subcategories || selectedCat.SubCategories || [];
                const selectedSub = subs.find((s) => s.sub_category_name === value);
                if (selectedSub && selectedSub.amount) {
                    newItems[index].rate = selectedSub.amount;
                }
            }
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { category: "", itemName: "", quantity: 1, rate: 0, gst: 18, discount: 0 }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // ─── Calculations ───────────────────────────────────────────────────────
    const calculateTotals = () => {
        let subTotal = 0;
        let totalGst = 0;
        let processedItems = [];

        formData.items.forEach((item, index) => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            const gstPct = Number(item.gst) || 0;
            const discPct = Number(item.discount) || 0;

            const base = qty * rate;
            const discountAmt = base * (discPct / 100);
            const valueAfterDisc = base - discountAmt;
            const itemGst = valueAfterDisc * (gstPct / 100);
            const totalValue = valueAfterDisc;

            subTotal += valueAfterDisc;
            totalGst += itemGst;

            processedItems.push({
                index: index + 1,
                itemName: item.itemName,
                category: item.category,
                quantity: qty,
                rate: rate,
                gst: gstPct,
                discount: discPct,
                discountAmt: discountAmt,
                value: totalValue
            });
        });

        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        const igst = 0;

        const rawDiscountValue = Number(formData.overallDiscount) || 0;
        let calculatedOverallDiscount = 0;

        if (overallDiscountType === "percentage") {
            calculatedOverallDiscount = (subTotal + totalGst) * (rawDiscountValue / 100);
        } else {
            calculatedOverallDiscount = rawDiscountValue;
        }

        const totalValue = subTotal + totalGst - calculatedOverallDiscount;

        return { subTotal, cgst, sgst, igst, totalValue, calculatedOverallDiscount, processedItems };
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading(isInvoiceMode ? "Generating Invoice..." : "Creating Quotation...");

        try {
            const totals = calculateTotals();

            if (isInvoiceMode) {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, "0");
                const datePart =
                    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
                    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

                const invoicePayload = {
                    quotationId: invoiceData.id || invoiceData._id,
                    type: formData.type || "item",
                    tallyInvoiceNumber: `${datePart}${nanoid(6).toUpperCase()}`,
                    QuotationNumber: invoiceData.quotation?.quotationNumber || invoiceData.quotationNumber || "",
                    QuotationDate: invoiceData.quotation?.date || invoiceData.createdAt?.split('T')[0] || "",
                    referenceNumber: formData.referenceNumber || invoiceData.referenceNumber || invoiceData.quotation?.referenceNumber || "",
                    companyName: formData.companyName || "",
                    date: formData.date || new Date().toISOString().split('T')[0],
                    status: "draft",
                    customerName: formData.customerName || invoiceData.customerName || invoiceData.quotation?.customerName || "",
                    customerAddress: formData.customerAddress || invoiceData.quotation?.customerAddress || "",

                    billToName: formData.billToName || "",
                    billToAddress: formData.billToAddress || "",
                    billToState: formData.billToState || "",
                    billToCountry: formData.billToCountry || "",
                    billToPincode: formData.billToPincode || "",

                    shipToName: formData.shipToName || "",
                    shipToAddress: formData.shipToAddress || "",
                    shipToState: formData.shipToState || "",
                    shipToCountry: formData.shipToCountry || "",
                    shipToPincode: formData.shipToPincode || "",

                    subTotal: totals.subTotal,
                    cgst: totals.cgst,
                    sgst: totals.sgst,
                    igst: totals.igst,
                    discount: totals.calculatedOverallDiscount,   // ← "discount", not "overallDiscount"
                    totalValue: totals.totalValue,

                    bankName: formData.bankName || "",
                    notes: formData.notes || "",

                    items: totals.processedItems.map((item) => ({
                        index: item.index,
                        itemName: item.itemName,
                        quantity: item.quantity,
                        rate: item.rate,
                        gst: item.gst,
                        discount: item.discount,
                        discountAmt: item.discountAmt,
                        value: item.value
                        // Note: categoryId / subCategoryId intentionally excluded for invoice
                    }))
                };

                await quotationApi.createInvoice(invoicePayload);
                toast.success("Invoice prepared successfully", { id: loadingToast });
            } else {
                // Exact Payload mapped to quotationApi.addQuotation structure
                const payload = {
                    companyId: companyId,
                    type: formData.type,
                    tallyQuotationNumber: formData.tallyInvoiceNumber,
                    referenceNumber: formData.referenceNumber,
                    companyName: formData.companyName,
                    date: formData.date,
                    customerName: formData.customerName,
                    customerAddress: formData.customerAddress,
                    billTo: {
                        name: formData.billToName,
                        email: formData.billToEmail,
                        mobile: formData.billToMobile,
                        address: formData.billToAddress,
                        city: formData.billToCity,
                        state: formData.billToState,
                        country: formData.billToCountry,
                        pincode: formData.billToPincode,
                        gstNumber: formData.billToGstNumber,
                        panNumber: formData.billToPanNumber
                    },
                    shipTo: {
                        name: formData.shipToName,
                        email: formData.shipToEmail,
                        mobile: formData.shipToMobile,
                        address: formData.shipToAddress,
                        city: formData.shipToCity,
                        state: formData.shipToState,
                        country: formData.shipToCountry,
                        pincode: formData.shipToPincode,
                        gstNumber: formData.shipToGstNumber,
                        panNumber: formData.shipToPanNumber
                    },
                    pricing: {
                        subTotal: totals.subTotal,
                        cgst: totals.cgst,
                        sgst: totals.sgst,
                        igst: totals.igst,
                        discount: totals.calculatedOverallDiscount,
                        totalValue: totals.totalValue
                    },
                    bankName: formData.bankName,
                    notes: formData.notes,
                    items: totals.processedItems.map((item) => ({
                        index: item.index,
                        itemName: item.itemName,
                        category: item.category,
                        quantity: item.quantity,
                        rate: item.rate,
                        gst: item.gst,
                        discount: item.discount,
                        discountAmount: item.discountAmt,
                        value: item.value
                    }))
                };
                await quotationApi.createInvoice(payload);
                toast.success("Invoice created successfully", { id: loadingToast });
            }

            setFormData(initialFormState);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Create error:", err);
            toast.error(err.response?.data?.message || (isInvoiceMode ? "Failed to prepare invoice" : "Failed to create quotation"), { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theblur p-4">
            <div className="popup-card rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 custom- custom-border-bottomottom flex items-center justify-between card-popup/50">
                    <h2 className="text-xl font-bold text">
                        {isInvoiceMode ? "Prepare Invoice" : "Create New Quotation"}
                    </h2>
                    <div onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 popup-card">
                    <form id="invoice-form" onSubmit={handleCreateSubmit} className="space-y-8">
                        {/* Reference Details */}
                        <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Reference Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                    <input disabled={isInvoiceMode} required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tally Ref No.</label>
                                    <input disabled={isInvoiceMode} type="text" name="tallyInvoiceNumber" value={formData.tallyInvoiceNumber} onChange={handleInputChange} className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
                                    <input disabled={isInvoiceMode} type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input disabled={isInvoiceMode} required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                                </div>
                            </div>
                        </div>

                        {/* Client Search */}
                        <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Search className="w-4 h-4" /> Client Search
                            </h3>
                            <div className="relative">
                                <input disabled={isInvoiceMode} required type="text" name="customerName" value={formData.customerName} onChange={handleClientSearch} autoComplete="off" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60" placeholder="Type to search clients..." />

                                {clients.length > 0 && !isInvoiceMode && (
                                    <ul className="absolute z-10 w-full mt-1 custom-border custom-border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {clients.map(c => (
                                            <li key={c.id} onClick={() => selectClient(c)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer  custom-border-bottom border-slate-100 last:border-0">
                                                <p className="font-medium text text-sm">{c.companyName || c.name}</p>
                                                <p className="text-xs text-slate-500">{c.address ? `${c.address}, ${c.city}` : 'No address'}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Extended Bill To / Ship To Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Bill To */}
                            <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm space-y-4">
                                <h4 className="font-semibold text text-sm  custom-border-bottom pb-2">Bill To Details</h4>
                                <input disabled={isInvoiceMode} required type="text" name="billToName" value={formData.billToName} onChange={handleInputChange} placeholder="Company / Individual Name" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="email" name="billToEmail" value={formData.billToEmail} onChange={handleInputChange} placeholder="Email" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="billToMobile" value={formData.billToMobile} onChange={handleInputChange} placeholder="Mobile" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <input disabled={isInvoiceMode} required type="text" name="billToAddress" value={formData.billToAddress} onChange={handleInputChange} placeholder="Address Line" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="text" name="billToCity" value={formData.billToCity} onChange={handleInputChange} placeholder="City" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} required type="text" name="billToState" value={formData.billToState} onChange={handleInputChange} placeholder="State" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} required type="text" name="billToPincode" value={formData.billToPincode} onChange={handleInputChange} placeholder="Pincode" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="billToCountry" value={formData.billToCountry} onChange={handleInputChange} placeholder="Country" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="text" name="billToGstNumber" value={formData.billToGstNumber} onChange={handleInputChange} placeholder="GST Number" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm uppercase disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="billToPanNumber" value={formData.billToPanNumber} onChange={handleInputChange} placeholder="PAN Number" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm uppercase disabled:opacity-60" />
                                </div>
                            </div>

                            {/* Ship To */}
                            <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center  custom-border-bottom pb-2">
                                    <h4 className="font-semibold text text-sm">Ship To Details</h4>
                                    {!isInvoiceMode && (
                                        <div onClick={copyBillToShip} className="text-xs font-medium text-indigo-600 flex items-center gap-1 hover:text-indigo-800 cursor-pointer">
                                            <Copy className="w-3 h-3" /> Same as Bill To
                                        </div>
                                    )}
                                </div>
                                <input disabled={isInvoiceMode} required type="text" name="shipToName" value={formData.shipToName} onChange={handleInputChange} placeholder="Company / Individual Name" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="email" name="shipToEmail" value={formData.shipToEmail} onChange={handleInputChange} placeholder="Email" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="shipToMobile" value={formData.shipToMobile} onChange={handleInputChange} placeholder="Mobile" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <input disabled={isInvoiceMode} required type="text" name="shipToAddress" value={formData.shipToAddress} onChange={handleInputChange} placeholder="Address Line" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="text" name="shipToCity" value={formData.shipToCity} onChange={handleInputChange} placeholder="City" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} required type="text" name="shipToState" value={formData.shipToState} onChange={handleInputChange} placeholder="State" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} required type="text" name="shipToPincode" value={formData.shipToPincode} onChange={handleInputChange} placeholder="Pincode" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="shipToCountry" value={formData.shipToCountry} onChange={handleInputChange} placeholder="Country" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input disabled={isInvoiceMode} type="text" name="shipToGstNumber" value={formData.shipToGstNumber} onChange={handleInputChange} placeholder="GST Number" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm uppercase disabled:opacity-60" />
                                    <input disabled={isInvoiceMode} type="text" name="shipToPanNumber" value={formData.shipToPanNumber} onChange={handleInputChange} placeholder="PAN Number" className="w-full px-3 py-2 card-popup custom-border border-slate-200 rounded-lg text-sm uppercase disabled:opacity-60" />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Line Items</h3>
                                {!isInvoiceMode && (
                                    <div onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 cursor-pointer">
                                        <Plus className="w-4 h-4" /> Add Item
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="p-4 card-popup rounded-xl custom-border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">

                                        <div className="sm:col-span-3">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                                            {isInvoiceMode ? (
                                                <input disabled value={item.category || "N/A"} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                            ) : (
                                                <select required value={item.category} onChange={(e) => handleItemChange(index, 'category', e.target.value)} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm">
                                                    <option value="" disabled>Select Category</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.category_name}>{c.category_name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Item / Service</label>
                                            {isInvoiceMode ? (
                                                <input disabled value={item.itemName || ""} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                            ) : (
                                                <select required value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} disabled={!item.category} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-50">
                                                    <option value="" disabled>Select Item</option>
                                                    {(() => {
                                                        const selectedCat = categories.find(c => c.category_name === item.category);
                                                        if (!selectedCat) return null;
                                                        const subs = subcategoriesMap[selectedCat.id] || selectedCat.subcategories || selectedCat.SubCategories || [];
                                                        return subs.map((s) => <option key={s.id} value={s.sub_category_name}>{s.sub_category_name}</option>);
                                                    })()}
                                                </select>
                                            )}
                                        </div>

                                        {/* QUANTITY — only editable field in invoice mode, capped at originalQuantity */}
                                        <div className="sm:col-span-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Qty
                                                {isInvoiceMode && item.originalQuantity !== undefined && (
                                                    <span className="ml-1 text-slate-400">/ {item.originalQuantity}</span>
                                                )}
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                max={isInvoiceMode ? item.originalQuantity : undefined}
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className={`w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 ${isInvoiceMode ? "font-semibold text-indigo-700" : ""}`}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Rate (₹)</label>
                                            <input disabled={isInvoiceMode} required type="number" min="0" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                        </div>

                                        <div className="sm:col-span-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">GST(%)</label>
                                            <input disabled={isInvoiceMode} required type="number" min="0" value={item.gst} onChange={(e) => handleItemChange(index, 'gst', e.target.value)} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                        </div>

                                        <div className="sm:col-span-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Disc(%)</label>
                                            <input disabled={isInvoiceMode} type="number" min="0" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm disabled:opacity-60" />
                                        </div>

                                        <div className="sm:col-span-1 flex justify-end">
                                            {!isInvoiceMode && formData.items.length > 1 && (
                                                <div onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5 cursor-pointer">
                                                    <Trash2 className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                    <select
                                        disabled={isInvoiceMode}
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                    >
                                        <option value="" disabled>Select Bank</option>
                                        {companyBanks.length > 0 ? (
                                            companyBanks.map((bank, i) => (
                                                <option key={i} value={bank.bankName}>{bank.bankName} ({bank.bankAccountNumber})</option>
                                            ))
                                        ) : (
                                            <option value={formData.bankName || ""} disabled>{formData.bankName || "No banks found in profile"}</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Terms</label>
                                    <textarea disabled={isInvoiceMode} rows={3} name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 custom-border custom-border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-60" />
                                </div>
                            </div>

                            <div className="custom-border p-5 rounded-xl custom-border border-slate-200 shadow-sm space-y-3">
                                <h3 className="font-semibold text text-sm  custom-border-bottom pb-2 mb-3">Financial Summary</h3>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Sub Total (Pre-Tax)</span>
                                    <span>₹{totals.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>CGST</span>
                                    <span>₹{totals.cgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>SGST</span>
                                    <span>₹{totals.sgst.toFixed(2)}</span>
                                </div>

                                {/* Dynamic Overall Discount */}
                                <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
                                    <span>Overall Discount</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            disabled={isInvoiceMode}
                                            value={overallDiscountType}
                                            onChange={(e) => setOverallDiscountType(e.target.value)}
                                            className="px-2 py-1 card-popup custom-border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                        >
                                            <option value="amount">₹ (Amt)</option>
                                            <option value="percentage">% (Pct)</option>
                                        </select>
                                        <input
                                            disabled={isInvoiceMode}
                                            type="number"
                                            name="overallDiscount"
                                            value={formData.overallDiscount}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="w-24 px-2 py-1 text-right card-popup custom-border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                        />
                                    </div>
                                </div>
                                {overallDiscountType === 'percentage' && totals.calculatedOverallDiscount > 0 && (
                                    <div className="flex justify-end text-xs text-emerald-600 mt-1">
                                        - ₹{totals.calculatedOverallDiscount.toFixed(2)}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3  custom-border-top border-slate-100 mt-2">
                                    <span className="font-bold text">Grand Total</span>
                                    <span className="text-xl font-bold text-indigo-600">₹{totals.totalValue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4  custom-border-top border-slate-100 card-popup/50 flex justify-end gap-3">
                    <div onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 custom-border custom-border border-slate-200 rounded-xl hover:card-popup cursor-pointer">
                        Cancel
                    </div>
                    <button type="submit" form="invoice-form" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                        {isSubmitting ? <><Loader className="w-4 h-4 border-2 border-white/20  custom-border-top-white" /> Saving...</> : isInvoiceMode ? "Generate Invoice" : "Create Quotation"}
                    </button>
                </div>
            </div>
        </div>
    );
}