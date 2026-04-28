import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { clientApi } from "../api";
import Toast from "./Toast";

const initialClientState = {
    name: "",
    email: "",
    mobile: "",
    companyName: "",
    customerType: "Business",
    state: "",
    city: "",
    pincode: "",
    status: "draft",
    country: "India",
    address: "",
    gstNumber: "",
    panNumber: ""
};

export default function CreateClientModal({ isOpen, onClose, onSuccess }) {
    const [newClient, setNewClient] = useState(initialClientState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setNewClient(initialClientState);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewClient((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        const { name, mobile, email } = newClient;

        if (!name) {
            Toast.error("Client Name is required.");
            return;
        }
        if (mobile && !/^\d{10,15}$/.test(mobile)) {
            Toast.error("Please enter a valid mobile number (10–15 digits).");
            return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Toast.error("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await clientApi.createClient(newClient);
            if (response.data?.success || response.status === 200 || response.status === 201) {
                Toast.success("Client added successfully!");
                onSuccess(); // Trigger parent refresh
                onClose();   // Close modal
            } else {
                Toast.error(response.data?.message || "Failed to add client.");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to add client. Please try again.";
            Toast.error(`Error: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center theblur p-4">
            <div className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 dark:bg-gray-800 bg-gray-100">

                {/* Header */}
                <div className="px-6 py-4 custom-border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Client</h2>
                    <div
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-gray-900">
                    <form id="add-client-form" onSubmit={handleAddClient} className="space-y-6">

                        {/* Basic Information */}
                        <div className="p-5 rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Client Name <span className="text-red-500">*</span></label>
                                    <input required type="text" name="name" value={newClient.name} onChange={handleInputChange} placeholder="e.g., Ankit" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Company Name</label>
                                    <input type="text" name="companyName" value={newClient.companyName} onChange={handleInputChange} placeholder="e.g., SkyTech Pvt Ltd" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input type="text" name="mobile" value={newClient.mobile} onChange={handleInputChange} placeholder="e.g., 7875345632" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Email</label>
                                    <input type="email" name="email" value={newClient.email} onChange={handleInputChange} placeholder="e.g., ankit@gmail.com" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Customer Type</label>
                                    <select name="customerType" value={newClient.customerType} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white">
                                        <option value="Business">Business</option>
                                        <option value="Individual">Individual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Status</label>
                                    <select name="status" value={newClient.status} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white">
                                        <option value="draft">Draft</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="active">Active</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Address & Tax Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Address Details */}
                            <div className="p-5 rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 space-y-4">
                                <h3 className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700 pb-2">Address Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Street Address</label>
                                    <input type="text" name="address" value={newClient.address} onChange={handleInputChange} placeholder="e.g., 123 Main St" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">City</label>
                                        <input type="text" name="city" value={newClient.city} onChange={handleInputChange} placeholder="City" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">State</label>
                                        <input type="text" name="state" value={newClient.state} onChange={handleInputChange} placeholder="State" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Pincode</label>
                                        <input type="text" name="pincode" value={newClient.pincode} onChange={handleInputChange} placeholder="Pincode" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Country</label>
                                        <input type="text" name="country" value={newClient.country} onChange={handleInputChange} placeholder="Country" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Tax Details */}
                            <div className="p-5 rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 space-y-4 h-fit">
                                <h3 className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700 pb-2">Tax Information</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">GST Number</label>
                                    <input type="text" name="gstNumber" value={newClient.gstNumber} onChange={handleInputChange} placeholder="e.g., 22AAAAA1283A1Z5" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm uppercase focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">PAN Number</label>
                                    <input type="text" name="panNumber" value={newClient.panNumber} onChange={handleInputChange} placeholder="e.g., AAAAA1283A" className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-sm uppercase focus:outline-none focus:border-blue-500 dark:text-white" />
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                        Cancel
                    </div>
                    <button
                        type="submit"
                        form="add-client-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        {isSubmitting ? "Creating..." : "Create Client"}
                    </button>
                </div>
            </div>
        </div>
    );
}