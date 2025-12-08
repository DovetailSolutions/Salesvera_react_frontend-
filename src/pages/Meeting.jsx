import React, { useEffect, useState, useContext } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
import { adminApi, meetingApi } from "../api";
import Loader from "../components/Loader";

export default function MeetingManagement() {
  const { user } = useContext(AuthContext);
  const [globalSearch, setGlobalSearch] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
  
  // ✅ Backend pagination state
  const [meetings, setMeetings] = useState([]); // current page only
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // fixed limit

  // Schedule Meeting Modal State (unchanged)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    meetingId: "",
    scheduledTime: "",
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [availableMeetings, setAvailableMeetings] = useState([]);
  const [meetingsForDropdownLoading, setMeetingsForDropdownLoading] = useState(false);

  // ❌ REMOVED: filteredMeetings, paginatedMeetings, meetingPagination

  const filteredSalespersons = salespersons.filter(sp => {
    if (!globalSearch.trim()) return true;
    const term = globalSearch.toLowerCase();
    return (
      `${sp.firstName} ${sp.lastName}`.toLowerCase().includes(term) ||
      sp.email.toLowerCase().includes(term) ||
      (sp.phone && sp.phone.includes(term))
    );
  });

  // Fetch managers (admin only) - unchanged
  const fetchManagers = async () => {
    try {
      const res = await adminApi.getAdminManagers();
      if (res.data?.success) {
        const managersList = res.data.data?.user?.createdUsers?.filter(
          (user) => user.role === "manager"
        ) || [];
        setManagers(managersList);
      } else {
        setManagers([]);
        Toast.error(res.data?.message || "Failed to load managers");
      }
    } catch (err) {
      console.error("Failed to fetch managers:", err);
      Toast.error("Failed to load managers");
      setManagers([]);
    }
  };

  // Fetch salespersons - unchanged
  const fetchSalespersons = async (managerId) => {
    try {
      setLoading(true);
      const res = await adminApi.getMySalespersons({ managerId, page: 1, limit: 10 });
      const data = res.data?.data || {};
      setSalespersons(data.rows || []);
    } catch (err) {
      console.error("Failed to fetch salespersons:", err);
      Toast.error("Failed to load salespersons");
      setSalespersons([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch meetings with backend pagination + filters
  const fetchMeetings = async (userId, page = 1, search = "", tab = "All Time") => {
    if (!userId) return;
    setMeetingsLoading(true);
    try {
      // Map tab to backend filter value
      let timeFilter = "";
      if (tab === "Today") timeFilter = "today";
      else if (tab === "This Week") timeFilter = "week";
      else if (tab === "This Month") timeFilter = "month";

      const params = {
        userId,
        page,
        limit: pageSize,
        ...(search.trim() && { search: search.trim() }),
        ...(timeFilter && { timeFilter }),
      };

      const res = await meetingApi.getUserMeetings(params);
      if (res.data?.success) {
        const data = res.data.data || {};
        setMeetings(data.rows || []);
        setTotalMeetings(data.pagination?.totalItems || data.total || 0);
      } else {
        setMeetings([]);
        setTotalMeetings(0);
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setMeetings([]);
      setTotalMeetings(0);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Export meetings to CSV - disabled for backend pagination
  const handleExportMeetings = () => {
    Toast.error("Export requires loading all meetings. Not supported with pagination.");
  };

  // Form handlers - unchanged
  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetScheduleForm = () => {
    setScheduleForm({ meetingId: "", scheduledTime: "" });
  };

  const handleScheduleMeeting = async () => {
    if (!selectedSalesperson) {
      Toast.error("Please select a salesperson first.");
      return;
    }

    const { meetingId, scheduledTime } = scheduleForm;
    if (!meetingId || !scheduledTime) {
      Toast.error("Please select a meeting and set a schedule time.");
      return;
    }

    setScheduleLoading(true);
    try {
      const payload = {
        userId: selectedSalesperson.id.toString(),
        meetingId: meetingId,
        scheduledTime,
      };

      const res = await meetingApi.assignMeeting(payload);
      if (res.data?.success) {
        Toast.success("Meeting scheduled successfully!");
        setIsScheduleModalOpen(false);
        resetScheduleForm();
        fetchMeetings(selectedSalesperson.id, currentPage, globalSearch, activeTab);
      } else {
        Toast.error(res.data?.message || "Failed to schedule meeting.");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to schedule meeting. Please try again.";
      Toast.error(`Error: ${errorMsg}`);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Initialize user data - unchanged
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      fetchManagers();
    } else if (user.role === "manager") {
      fetchSalespersons(user.id);
    }
  }, [user]);

  // ✅ Fetch meetings when dependencies change
  useEffect(() => {
    if (selectedSalesperson) {
      fetchMeetings(selectedSalesperson.id, currentPage, globalSearch, activeTab);
    } else {
      setMeetings([]);
      setTotalMeetings(0);
    }
  }, [selectedSalesperson, currentPage, globalSearch, activeTab]);

  // ✅ Reset to page 1 on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, activeTab]);

  // Fetch available meetings for modal - unchanged
  useEffect(() => {
    if (isScheduleModalOpen && selectedSalesperson) {
      setMeetingsForDropdownLoading(true);
      meetingApi
        .getUserMeetings({ empty: true })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data?.rows)) {
            setAvailableMeetings(res.data.data.rows);
          } else {
            setAvailableMeetings([]);
            Toast.error(res.data?.message || "No available meetings found.");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch available meetings:", err);
          Toast.error("Failed to load meeting list.");
          setAvailableMeetings([]);
        })
        .finally(() => {
          setMeetingsForDropdownLoading(false);
        });
    } else {
      setAvailableMeetings([]);
    }
  }, [isScheduleModalOpen, selectedSalesperson]);

  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";

  if (loading) return <Loader variant="dots"/>

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Meeting Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!selectedSalesperson) {
                  Toast.error("Please select a salesperson first.");
                  return;
                }
                setIsScheduleModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
            >
              + Schedule Meeting
            </button>
            {selectedSalesperson && totalMeetings > 0 && (
              <button
                onClick={handleExportMeetings}
                className="bg-green-600 hover:bg-green-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
              >
                Export Meetings (CSV)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal (unchanged) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-bold">Schedule Meeting</h2>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {selectedSalesperson && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    Assigning to: <span className="font-medium">
                      {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Meeting *
                </label>
                {meetingsForDropdownLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500">
                    Loading meetings...
                  </div>
                ) : availableMeetings.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500">
                    No available meetings
                  </div>
                ) : (
                  <select
                    name="meetingId"
                    value={scheduleForm.meetingId}
                    onChange={handleScheduleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a meeting --</option>
                    {availableMeetings.map((meeting) => (
                      <option key={meeting.id} value={meeting.id}>
                        {meeting.companyName || "Unnamed Company"}
                        {meeting.personName ? ` - ${meeting.personName}` : ""}
                        {meeting.mobileNumber ? ` (${meeting.mobileNumber})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledTime"
                  value={scheduleForm.scheduledTime}
                  onChange={handleScheduleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4">
              <button
                type="button"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleMeeting}
                disabled={scheduleLoading}
                className={`px-4 py-2 rounded ${
                  scheduleLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {scheduleLoading ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-5 h-full">
          {/* Left Panel (unchanged) */}
          <div className="w-full lg:w-[16rem] flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden p-4">
              {isAdmin && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Managers</h2>
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
                    className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                placeholder={isManager ? "Search salesperson..." : "Search salesperson or meeting..."}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="px-4 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full text-sm mb-4"
              />

              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-medium text-slate-600 mb-2">
                  {isAdmin ? "Team Members" : "My Team"}
                </h3>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 pt-2 h-full max-h-[60vh]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm">Loading team...</p>
                    </div>
                  ) : filteredSalespersons.length > 0 ? (
                    filteredSalespersons.map((sp) => (
                      <div
                        key={sp.id}
                        onClick={() => {
                          setSelectedSalesperson(sp);
                          setCurrentPage(1); // reset page when selecting new salesperson
                          fetchMeetings(sp.id, 1, globalSearch, activeTab);
                        }}
                        className={`relative rounded-3xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          selectedSalesperson?.id === sp.id
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="font-medium capitalize">
                          {sp.firstName} {sp.lastName}
                        </div>
                        <div className="text-xs line-clamp-1 opacity-90">
                          {sp.email}
                        </div>
                        <div className="text-xs opacity-90">
                          {sp.phone || "—"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      {isAdmin
                        ? (selectedManager ? "No team members found." : "Select a manager to view their team")
                        : "No team members found."
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              {isAdmin && selectedManager ? (
                <div className="px-4 pt-4">
                  <h2 className="text-xl font-semibold">
                    Manager: {selectedManager.firstName} {selectedManager.lastName}
                  </h2>
                </div>
              ) : isManager ? (
                <div className="px-4 pt-4">
                  <h2 className="text-xl font-semibold">My Sales Team</h2>
                </div>
              ) : null}

              {selectedSalesperson && (
                <div className="px-4 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {["All Time", "Today", "This Week", "This Month"].map((tab) => (
                      <div
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          activeTab === tab
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden px-4 pb-4">
                {selectedSalesperson ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Meetings: {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                      </h3>
                    </div>
                    {/* ✅ Backend pagination: pass raw data + total */}
                    <Table
                      columns={[
                        { key: "companyName", label: "Company", render: (row) => row.companyName || "—" },
                        { key: "personName", label: "Contact", render: (row) => row.personName || "—" },
                        { key: "mobileNumber", label: "Mobile", render: (row) => row.mobileNumber || "—" },
                        { 
                          key: "companyEmail", 
                          label: "Email", 
                          render: (row) => <span className="break-words">{row.companyEmail || "—"}</span> 
                        },
                        {
                          key: "meetingTimeIn",
                          label: "Check-in",
                          render: (row) =>
                            row.meetingTimeIn ? new Date(row.meetingTimeIn).toLocaleString() : "—",
                        },
                        {
                          key: "meetingTimeOut",
                          label: "Check-out",
                          render: (row) =>
                            row.meetingTimeOut ? new Date(row.meetingTimeOut).toLocaleString() : "—",
                        },
                      ]}
                      data={meetings} // ✅ only current page from backend
                      keyField="id"
                      emptyMessage="No meetings found"
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalCount={totalMeetings} // ✅ from backend
                      onPageChange={setCurrentPage} // ✅ triggers new fetch
                      loading={meetingsLoading}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-500">
                    <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg">
                      {isAdmin 
                        ? "Select a salesperson to view their meetings"
                        : "No salesperson selected"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-start gap-2 mx-4 mb-4">
                <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
                  <span className="text-4xl font-bold">{filteredSalespersons.length} </span> Total Members
                </div>
                <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
                  <span className="text-4xl font-bold">{totalMeetings} </span> Total Meetings
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}