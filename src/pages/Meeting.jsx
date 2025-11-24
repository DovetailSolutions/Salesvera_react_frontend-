import React, { useEffect, useMemo, useState } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { FaSearch } from "react-icons/fa";
import { adminApi, meetingApi } from "../api";

export default function MeetingManagement() {
  const [role, setRole] = useState("manager");
  const [globalSearch, setGlobalSearch] = useState("");
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

  const [filteredMeetings, setFilteredMeetings] = useState([]);

  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
const [meetings, setMeetings] = useState([]);
const [meetingsLoading, setMeetingsLoading] = useState(false);

const [meetingPagination, setMeetingPagination] = useState({
  currentPage: 1,
  pageSize: 7, // ✅ Only 7 meetings per page
});

const paginatedMeetings = useMemo(() => {
  const { currentPage, pageSize } = meetingPagination;
  const startIndex = (currentPage - 1) * pageSize;
  return filteredMeetings.slice(startIndex, startIndex + pageSize);
}, [filteredMeetings, meetingPagination]);

const filteredSalespersons = useMemo(() => {
  if (!globalSearch.trim()) return salespersons;
  const term = globalSearch.toLowerCase();
  return salespersons.filter(sp =>
    `${sp.firstName} ${sp.lastName}`.toLowerCase().includes(term) ||
    sp.email.toLowerCase().includes(term) ||
    (sp.phone && sp.phone.includes(term))
  );
}, [salespersons, globalSearch]);

  const fetchManagers = async (search = "") => {
    try {
      const res = await adminApi.getAllUsers({ role, search });
      if (res.data?.success) setManagers(res.data.data?.finalRows || []);
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
  const timeout = setTimeout(() => {
    fetchManagers(globalSearch); 
  }, 500);
  return () => clearTimeout(timeout);
}, [globalSearch]); 

useEffect(() => {
  if (selectedSalesperson) {
    applyMeetingFilter(meetings, activeTab, globalSearch);
  }
}, [globalSearch, activeTab, selectedSalesperson, meetings]);

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

const fetchMeetings = async (userId) => {
  if (!userId) return;

  setMeetingsLoading(true);
  try {
    // Always fetch ALL meetings (no date filter)
    const res = await meetingApi.getUserMeetings({ userId });
    if (res.data?.success) {
      const allMeetings = res.data.data?.rows || [];
      setMeetings(allMeetings);
      // Apply initial filter based on current tab
      applyMeetingFilter(allMeetings, activeTab, globalSearch);
    } else {
      setMeetings([]);
      setFilteredMeetings([]);
    }
  } catch (err) {
    console.error("Meeting fetch error:", err);
    Toast.error("Failed to load meetings");
    setMeetings([]);
    setFilteredMeetings([]);
  } finally {
    setMeetingsLoading(false);
  }
};

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isSameWeek = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const dayDiff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return dayDiff >= 0 && dayDiff <= 6 && d1.getDay() <= d2.getDay();
};

const isSameMonth = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
};

const applyMeetingFilter = (meetings, tab, search = "") => {
  const now = new Date();
  let filtered = meetings;

  // Time-based filtering
  if (tab === "Today") {
    filtered = filtered.filter(m => isSameDay(new Date(m.meetingTimeIn), now));
  } else if (tab === "This Week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    filtered = filtered.filter(m => {
      const meetingDate = new Date(m.meetingTimeIn);
      return meetingDate >= weekStart && meetingDate <= now;
    });
  } else if (tab === "This Month") {
    filtered = filtered.filter(m => isSameMonth(new Date(m.meetingTimeIn), now));
  }

  // Search filtering
  if (search.trim()) {
    const term = search.toLowerCase();
    filtered = filtered.filter(m =>
      (m.companyName && m.companyName.toLowerCase().includes(term)) ||
      (m.personName && m.personName.toLowerCase().includes(term)) ||
      (m.mobileNumber && m.mobileNumber.includes(term)) ||
      (m.companyEmail && m.companyEmail.toLowerCase().includes(term)) ||
      (m.meetingPurpose && m.meetingPurpose.toLowerCase().includes(term))
    );
  }

  setFilteredMeetings(filtered);
};

  return (
    <div className="flex flex-col h-screen overflow-hidden">
  {/* Header: Add padding and remove bottom margin */}
  <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
          Meeting Management
        </h1>
           <div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded">
              + Schedule Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
  <div className="flex flex-col lg:flex-row gap-5 h-full">

       {/* Left Panel */}
<div className="w-full lg:w-[16rem] flex flex-col h-full">
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden p-4">
  <h2 className="text-2xl font-semibold mb-4 flex items-center">
    Managers
  </h2>

  {/* Manager Dropdown */}
  <div className="mb-5 flex flex-col gap-4">
    {/* <label className="block text-sm font-medium text-slate-600 mb-1">
      Manager
    </label> */}
    <select
      value={selectedManager?.id || ""}
      onChange={(e) => {
        const managerId = e.target.value;
        const manager = managers.find((m) => m.id === Number(managerId)) || null;
        setSelectedManager(manager);
        setSelectedSalesperson(null);
        setMeetings([]);
        if (manager) {
          fetchSalespersons(manager.id);
        } else {
          setSalespersons([]);
        }
      }}
      className="w-full rounded-full border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    >
      <option value="" disabled>Select a manager</option>
      {managers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.firstName} {m.lastName}
        </option>
      ))}
    </select>

    <input
  type="text"
  placeholder="Search manager, salesperson or meeting..."
  value={globalSearch}
  onChange={(e) => setGlobalSearch(e.target.value)}
  className="px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border placeholder:text-sm"
/>
  </div>

  {/* Salesperson List */}
  <div className="flex-1 overflow-hidden mt-2">
  <h3 className="text-sm font-medium text-slate-600 mb-2">Team Members</h3>
  <div className="flex flex-col gap-2 overflow-y-auto pr-1 pt-2 h-full">
    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1 pt-2">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm">Loading team...</p>
        </div>
      ) : salespersons.length > 0 ? (
       filteredSalespersons.map((sp) => (
          <div
            key={sp.id}
            onClick={() => {
              setSelectedSalesperson(sp);
              fetchMeetings(sp.id);
            }}
            className={`relative rounded-3xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
              selectedSalesperson?.id === sp.id
                ? "border-[var(--primary-blue)] bg-[var(--primary-blue)]"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className={`font-medium text-slate-800 capitalize ${selectedSalesperson?.id === sp.id ? "text-white" : "text-black"}`}>
              {sp.firstName} {sp.lastName}
            </div>
            <div className={`text-xs text-slate-600 line-clamp-1 ${selectedSalesperson?.id === sp.id ? "text-white" : "text-black"}`}>
               {sp.email}
            </div>
            <div className={`text-xs text-slate-600 ${selectedSalesperson?.id === sp.id ? "text-white" : "text-black"}`}>
               {sp.phone || "—"}
            </div>
            {/* <div className="mt-1">
              <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded capitalize">
                {sp.role || "salesperson"}
              </span>
            </div> */}
          </div>
        ))
      ) : selectedManager ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          <p>No team members found.</p>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">
          <p className="mb-1">Select a manager</p>
          <p>to view their sales team</p>
        </div>
      )}
    </div>
  </div>
  </div>
</div>
</div>

        {/* Right Panel */}
<div className="flex-1 flex flex-col h-full">
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
  {selectedManager ? (
    <>
      {/* Manager Header */}
      <div className="px-4 pt-4 border-slate-200">
        <h2 className="text-2xl font-semibold">
          Manager : {selectedManager.firstName} {selectedManager.lastName}
        </h2>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          {["All Time", "Today", "This Week", "This Month"].map((tab) => (
            <div
              key={tab}
              // In your tab click handler
onClick={() => {
  setActiveTab(tab);
  if (selectedSalesperson) {
    applyMeetingFilter(meetings, tab);
  }
}}
              className={`px-4 py-2 rounded-lg text-sm font-thin cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[var(--primary-blue)] text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Content Area (only this part changes based on selection) */}
      <div className="flex-1 overflow-hidden px-4">
  {selectedSalesperson ? (
          <>
            {/* <h3 className="text-lg font-medium mb-3">
              Meetings: {selectedSalesperson.firstName} {selectedSalesperson.lastName}
            </h3> */}
          <Table
  columns={[
    { key: "companyName", label: "Company", render: (row) => row.companyName || "N/A" },
    { key: "personName", label: "Contact", render: (row) => row.personName || "N/A" },
    { key: "mobileNumber", label: "Mobile", render: (row) => row.mobileNumber || "N/A" },
    {
  key: "companyEmail",
  label: "Email",
  render: (row) => (
    <span className="break-words">{row.companyEmail || "N/A"}</span>
  ),
},
    {
      key: "meetingTimeIn",
      label: "Check-in",
      render: (row) =>
        row.meetingTimeIn ? new Date(row.meetingTimeIn).toLocaleString() : "N/A",
    },
    {
      key: "meetingTimeOut",
      label: "Check-out",
      render: (row) =>
        row.meetingTimeOut ? new Date(row.meetingTimeOut).toLocaleString() : "—",
    },
    {
      key: "meetingPurpose",
      label: "Purpose",
      render: (row) => (
        <span className="line-clamp-1">{row.meetingPurpose || "N/A"}</span>
      ),
    },
  ]}
  data={paginatedMeetings}
  keyField="id"
  emptyMessage="No meetings found"
  currentPage={meetingPagination.currentPage}
  pageSize={meetingPagination.pageSize}
  totalCount={filteredMeetings.length}
  onPageChange={(page) =>
    setMeetingPagination((prev) => ({ ...prev, currentPage: page }))
  }
/>
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

  <div className="flex items-center justify-start gap-2 mx-4 mb-4">
    <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
    <span className="text-4xl font-bold">{filteredSalespersons.length} </span> Total Members
  </div>
  <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
    <span className="text-4xl font-bold">{meetings.length} </span> Total Meetings
  </div>
</div>
</div>

</div>
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