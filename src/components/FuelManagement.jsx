import React, { useState, useEffect } from "react";
import { ArrowLeft, Car, MapPin, IndianRupee, Calendar, ExternalLink, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import Table from "./Table";
import { expenseApi } from "../api";
import Loader from "./Loader";

export default function FuelExpensesView({ user, onBack }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expensesData, setExpensesData] = useState([]);
    const [summary, setSummary] = useState({ totalMeetings: 0, totalDistance: 0, totalAmount: 0 });
    const [mainLoading, setMainLoading] = useState(false);

    // Modal State
    const [selectedDayDetails, setSelectedDayDetails] = useState(null);
    const [selectedMeetingsToApprove, setSelectedMeetingsToApprove] = useState([]);

    // --- 1. Fetch Grouped Data (Main Table) ---
    const fetchExpensesData = async (month, year) => {
        setMainLoading(true);
        try {
            const res = await expenseApi.getGroupedFuelExpenses({
                userId: user.id,
                month,
                year
            });

            if (res.data?.success) {
                const data = res.data.data || [];
                setExpensesData(data);

                // Calculate Summary directly from the data
                let totalDist = 0;
                let totalMeet = 0;

                data.forEach(item => {
                    totalDist += parseFloat(item.totalDistance || 0);
                    totalMeet += parseInt(item.totalRecords || 0, 10);
                });

                // Calculation: 10 Rupees per KM
                const totalAmt = totalDist * 10; // Assuming 10 Rs/Km based on your table render logic

                setSummary({
                    totalMeetings: totalMeet,
                    totalDistance: totalDist.toFixed(2),
                    totalAmount: totalAmt.toFixed(2)
                });
            } else {
                setExpensesData([]);
                setSummary({ totalMeetings: 0, totalDistance: 0, totalAmount: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
            toast.error("Failed to load monthly expenses.");
        } finally {
            setMainLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchExpensesData(selectedMonth, selectedYear);
        }
    }, [selectedMonth, selectedYear, user?.id]);

    // --- 2. Fetch Detailed Data (Modal) ---
    const handleViewDetails = async (row) => {
        // Set initial state to show loading modal immediately
        setSelectedDayDetails({ date: row.date, loading: true, meetings: [] });
        setSelectedMeetingsToApprove([]);

        try {
            const startDate = row.date;

            // Calculate endDate (next day)
            const dateObj = new Date(row.date);
            dateObj.setDate(dateObj.getDate() + 1);
            const endDate = dateObj.toISOString().split('T')[0];

            const res = await expenseApi.getDetailedFuelExpenses({
                userId: user.id,
                startDate: startDate,
                endDate: endDate,
                limit: 100 // Fetching all for the day
            });

            if (res.data?.success) {
                const fetchedMeetings = res.data.data.meetings || [];
                setSelectedDayDetails({
                    date: row.date,
                    loading: false,
                    meetings: fetchedMeetings
                });

                // ✅ Auto-select all pending meetings by default
                const pendingIds = fetchedMeetings
                    .filter(m => m.status !== "approved")
                    .map(m => m.id);
                setSelectedMeetingsToApprove(pendingIds);

            } else {
                toast.error(res.data?.message || "Failed to load details.");
                setSelectedDayDetails(null);
            }
        } catch (error) {
            console.error("Failed to fetch daily details:", error);
            toast.error("Error loading daily details.");
            setSelectedDayDetails(null);
        }
    };

    // Main Table Columns
    const columns = [
        { key: "date", label: "Date", render: (row) => <span className="font-medium text">{row.date}</span> },
        { key: "totalRecords", label: "Meetings", render: (row) => <span className="text-slate-600 font-semibold">{row.totalRecords}</span> },
        { key: "totalDistance", label: "Distance (KM)", render: (row) => <span className="text-slate-600">{parseFloat(row.totalDistance || 0).toFixed(2)} km</span> },
        {
            key: "estimatedAmount",
            label: "Est. Amount",
            render: (row) => <span className="font-bold text-slate-700">₹{(parseFloat(row.totalDistance || 0) * 10).toFixed(2)}</span>
        },
    ];

    const actions = [
        {
            type: "button",
            render: (row) => (
                <button
                    onClick={() => handleViewDetails(row)}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    View Details
                </button>
            )
        }
    ];

    // Modal Table Columns 
    const modalColumns = [
        {
            key: "select",
            label: "",
            render: (row) => (
                <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    // The row is checked if its ID is in our array OR if it's already approved in the DB
                    checked={selectedMeetingsToApprove.includes(row.id) || row.status === "approved"}
                    disabled={row.status === "approved"}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedMeetingsToApprove(prev => [...prev, row.id]);
                        } else {
                            setSelectedMeetingsToApprove(prev => prev.filter(id => id !== row.id));
                        }
                    }}
                />
            )
        },
        {
            key: "from",
            label: "Check-in Location",
            render: (row) => {
                if (!row.latitude_in || !row.longitude_in) return <span className="text-slate-400 text-xs">Not logged</span>;
                return (
                    <a
                        href={`https://www.google.com/maps?q=${row.latitude_in},${row.longitude_in}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-xs"
                    >
                        View Map <ExternalLink className="w-3 h-3" />
                    </a>
                )
            }
        },
        {
            key: "to",
            label: "Check-out Location",
            render: (row) => {
                if (!row.latitude_out || !row.longitude_out) return <span className="text-slate-400 text-xs">Not logged</span>;
                return (
                    <a
                        href={`https://www.google.com/maps?q=${row.latitude_out},${row.longitude_out}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 font-medium text hover:text-blue-600 transition-colors text-xs"
                    >
                        View Map <ExternalLink className="w-3 h-3" />
                    </a>
                )
            }
        },
        {
            key: "legDistance",
            label: "Distance",
            // FIXED: Using row.legDistance instead of row.totalDistance
            render: (row) => <span className="text-slate-600 font-medium">{row.legDistance ? `${parseFloat(row.legDistance).toFixed(2)} km` : "0 km"}</span>
        },
        {
            key: "status",
            label: "Status",
            render: (row) => {
                const isApproved = row.status === 'approved';
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {row.status}
                    </span>
                )
            }
        },
    ];

    const handleApproveExpenses = async () => {
        if (selectedMeetingsToApprove.length === 0) {
            toast.error("Please select at least one pending meeting to approve.");
            return;
        }

        try {
            // Uncomment and configure when backend logic is ready
            // await expenseApi.approveExpenses({ meetingIds: selectedMeetingsToApprove });
            toast.success(`Approved ${selectedMeetingsToApprove.length} meeting(s) successfully!`);

            // Update Local State manually to reflect approval immediately
            const updatedDetails = { ...selectedDayDetails };
            updatedDetails.meetings = updatedDetails.meetings.map(m =>
                selectedMeetingsToApprove.includes(m.id) ? { ...m, status: "approved" } : m
            );
            setSelectedDayDetails(updatedDetails);
            setSelectedMeetingsToApprove([]);

        } catch (error) {
            toast.error("Failed to approve expenses.");
        }
    };

    return (
        <div className="py-4 h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-300">
            {/* Header & Back Button */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 translucent border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text tracking-tight">
                        Fuel Expenses
                    </h1>
                    <p className="text-sm text mt-1 capitalize">
                        Viewing records for <span className="font-semibold text-slate-700">{user.firstName} {user.lastName}</span>
                    </p>
                </div>
            </div>

            {/* Top Controls: Summary & Dropdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                {/* Month/Year Selection */}
                <div className=" translucent p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <label className="text-xs font-semibold text mb-2 uppercase tracking-wide">Select Period</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full translucent-inner px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            {Array.from({ length: 12 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full translucent-inner px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className=" translucent p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 custom-border text-indigo-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text">Total Meetings</p>
                        <p className="text-2xl font-bold text">{summary.totalMeetings}</p>
                    </div>
                </div>

                <div className=" translucent p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 custom-border text-emerald-600 rounded-xl">
                        <Car className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text">Total Distance</p>
                        <p className="text-2xl font-bold text">{summary.totalDistance} km</p>
                    </div>
                </div>

                <div className=" translucent p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 custom-border text-amber-600 rounded-xl">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text">Total Amount</p>
                        <p className="text-2xl font-bold text">₹{summary.totalAmount}</p>
                    </div>
                </div>
            </div>

            {/* Main Table container */}
            <div className="relative flex-1 translucent rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <Table
                        columns={columns}
                        data={expensesData}
                        actions={actions}
                        keyField="date"
                        emptyMessage={mainLoading ? "Loading expenses..." : "No expenses recorded for this month."}
                        currentPage={1}
                        pageSize={100}
                        totalCount={expensesData.length}
                        onPageChange={() => { }}
                    />
                </div>
                {mainLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader />
                    </div>
                )}
            </div>

            {/* Modal Popup for Details */}
            {selectedDayDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className=" translucent rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Meeting Details - {selectedDayDetails.date}
                                </h3>
                                <p className="text-sm text mt-0.5">Deselect the meetings you do not want to approve.</p>
                            </div>
                            <button
                                onClick={() => setSelectedDayDetails(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body: Table */}
                        <div className="flex-1 overflow-auto translucent p-0 relative">
                            <Table
                                columns={modalColumns}
                                data={selectedDayDetails.meetings || []}
                                actions={[]}
                                keyField="id"
                                emptyMessage={selectedDayDetails.loading ? "Fetching details..." : "No meetings logged for this day."}
                                currentPage={1}
                                pageSize={100}
                                totalCount={selectedDayDetails.meetings?.length || 0}
                                onPageChange={() => { }}
                            />
                            {selectedDayDetails.loading && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                    <Loader />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <p className="text-sm font-medium text">
                                Selected: <span className="text font-bold">{selectedMeetingsToApprove.length}</span> pending items
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedDayDetails(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 translucent border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApproveExpenses}
                                    disabled={selectedMeetingsToApprove.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Update Expenses
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}