import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { FaSearch } from "react-icons/fa";
import { adminApi, meetingApi } from "../api";

export default function MeetingManagement() {
  const [role, setRole] = useState("manager");
  const [managerSearch, setManagerSearch] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
const [meetings, setMeetings] = useState([]);
const [meetingsLoading, setMeetingsLoading] = useState(false);

  const fetchManagers = async (search = "") => {
    try {
      const res = await adminApi.getAllUsers({ role, search });
      if (res.data?.success) setManagers(res.data.data?.rows || []);
    } catch (err) {
      console.error(err);
      Toast.error("Failed to fetch managers");
    }
  };

  const fetchSalespersons = async (managerId, page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getMySalespersons({ managerId, page });
      const data = res.data?.data || {};
      setSalespersons(data.rows || []);
      setPagination({
        currentPage: data.page || 1,
        totalItems: data.total || data.rows?.length || 0,
        totalPages: Math.ceil((data.total || 0) / (data.limit || 10)) || 1,
        limit: data.limit || 10,
      });
    } catch (err) {
      console.error(err);
      Toast.error("Failed to load salespersons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers(managerSearch);
  }, [role]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchManagers(managerSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [managerSearch]);

  const columns = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email ID" },
    { key: "phone", label: "Mobile Number" },
    { key: "role", label: "Role" },
  ];

  const getDateForTab = (tab) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  if (tab === "Today") {
    return `${year}-${month}-${day}`;
  } else if (tab === "This Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sunday as start
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  } else if (tab === "This Month") {
    return `${year}-${month}-01`;
  } else {
    // All Time → use today (since API requires date)
    return `${year}-${month}-${day}`;
  }
};

const fetchMeetings = async (userId, tab = activeTab) => {
  if (!userId) return;

  setMeetingsLoading(true);
  try {
    // ✅ Use meetingApi, not adminApi
    const params = tab === "All Time" 
      ? { userId } 
      : { userId, date: getDateForTab(tab) };

    const res = await meetingApi.getUserMeetings(params); // ← FIXED

    if (res.data?.success) {
      setMeetings(res.data.data?.rows || []);
    } else {
      setMeetings([]);
      console.warn("API returned success=false or no data");
    }
  } catch (err) {
    console.error("Meeting fetch error:", err);
    Toast.error("Failed to load meetings");
    setMeetings([]);
  } finally {
    setMeetingsLoading(false);
  }
};

  return (
    <div className="min-h-screen py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text">
          Meeting Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Left Panel */}
       {/* Left Panel */}
<div className="layout rounded shadow-sm custom-border p-5">
  <h2 className="text-lg font-semibold text mb-4">
    Select Manager
  </h2>

  {/* Manager Dropdown */}
  <div className="mb-4">
    <select
      value={selectedManager?.id || ""}
      onChange={(e) => {
        const managerId = e.target.value;
        const manager = managers.find(m => m.id === Number(managerId)) || null;
        setSelectedManager(manager);
        setSelectedSalesperson(null); // reset selection
        setMeetings([]);
        if (manager) {
          fetchSalespersons(manager.id);
        } else {
          setSalespersons([]);
        }
      }}
      className="w-full custom-border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="">-- Choose a Manager --</option>
      {managers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.firstName} {m.lastName}
        </option>
      ))}
    </select>
  </div>

  {/* Salesperson List (only this — no manager list) */}
  <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
    {loading ? (
      <p className="text-slate-500 text-sm text-center py-4">Loading salespersons...</p>
    ) : salespersons.length > 0 ? (
      salespersons.map((sp) => (
        <div
          key={sp.id}
          onClick={() => {
            setSelectedSalesperson(sp);
            fetchMeetings(sp.id);
          }}
          className={`bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 transition cursor-pointer ${
            selectedSalesperson?.id === sp.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
          }`}
        >
          <div className="font-semibold text-slate-800">
            {sp.firstName} {sp.lastName}
          </div>
          <div className="text-sm text-slate-600 mt-1">📧 {sp.email}</div>
          <div className="text-sm text-slate-600">📱 {sp.phone || "N/A"}</div>
          <div className="text-xs text-slate-500 mt-2">
            Role: <span className="capitalize">{sp.role || "salesperson"}</span>
          </div>
        </div>
      ))
    ) : selectedManager ? (
      <p className="text-slate-500 text-sm text-center py-4">
        No salespersons found
      </p>
    ) : (
      <p className="text-slate-500 text-sm text-center py-4">
        Select a manager to view their team
      </p>
    )}
  </div>
</div>

        {/* Right Panel */}
        {/* Right Panel */}
<div className="lg:col-span-3 bg-white rounded shadow-sm custom-border border-slate-200">
  {selectedManager ? (
    <>
      {/* Manager Header */}
      <div className="px-4 pt-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold">
          Manager: {selectedManager.firstName} {selectedManager.lastName}
        </h2>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex gap-2">
          {["All Time", "Today", "This Week", "This Month"].map((tab) => (
            <div
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (selectedSalesperson) {
                  fetchMeetings(selectedSalesperson.id, tab);
                }
              }}
              className={`px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Content Area (only this part changes based on selection) */}
      <div className="px-4 py-4">
        {selectedSalesperson ? (
          <>
            <h3 className="text-lg font-medium mb-3">
              Meetings: {selectedSalesperson.firstName} {selectedSalesperson.lastName}
            </h3>
            {meetingsLoading ? (
              <div className="text-center py-6 text-slate-500">Loading meetings...</div>
            ) : meetings.length > 0 ? (
              <div className="space-y-3">
               {meetings.map((meeting) => (
  <div
    key={meeting.id}
    className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50"
  >
    <div className="font-semibold text-slate-800">
      {meeting.companyName || "N/A"}
    </div>
    <div className="text-sm text-slate-600 mt-1">
      👤 Contact: {meeting.personName || "N/A"}
    </div>
    <div className="text-sm text-slate-600">
      📞 {meeting.mobileNumber || "N/A"} | 📧 {meeting.companyEmail || "N/A"}
    </div>
    <div className="text-sm text-slate-600 mt-1">
      🕒 In: {new Date(meeting.meetingTimeIn).toLocaleString()}
    </div>
    {meeting.meetingTimeOut && (
      <div className="text-sm text-slate-600">
        🕓 Out: {new Date(meeting.meetingTimeOut).toLocaleString()}
      </div>
    )}
    <div className="text-sm text-slate-600 mt-1">
      📌 Purpose: {meeting.meetingPurpose || "N/A"}
    </div>
  </div>
))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No meetings found
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
            <p className="text-lg">Select a salesperson to view their meetings</p>
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
      <svg className="w-20 h-20 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p className="text-slate-500 text-lg font-medium">
        Select a manager to view their team
      </p>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

function SummaryBox({ title, value, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded px-8 py-5 flex flex-col items-center justify-center shadow-sm custom-border border-slate-200 min-w-[160px]`}>
      <span className={`text-3xl font-bold ${textColor} mb-1`}>{value}</span>
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
  );
}