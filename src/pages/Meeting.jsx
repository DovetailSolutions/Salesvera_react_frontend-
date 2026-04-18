import React, { useEffect, useState, useContext } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
import { motion } from "framer-motion";
import { adminApi, meetingApi } from "../api";
import Loader from "../components/Loader";
import {
  CalendarPlus,
  Download,
  Search,
  Users,
  X,
  CalendarClock,
  Building2,
  User,
  Phone,
  Mail,
  ChevronRight
} from "lucide-react";
import { Toaster } from "react-hot-toast";

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
  const pageSize = 9; // fixed limit

  // Schedule Meeting Modal State (unchanged)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    meetingId: "",
    scheduledTime: "",
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [availableMeetings, setAvailableMeetings] = useState([]);
  const [meetingsForDropdownLoading, setMeetingsForDropdownLoading] = useState(false);

  const filteredSalespersons = salespersons.filter(sp => {
    if (!globalSearch.trim()) return true;
    const term = globalSearch.toLowerCase();
    return (
      `${sp.firstName} ${sp.lastName}`.toLowerCase().includes(term) ||
      sp.email.toLowerCase().includes(term) ||
      (sp.phone && sp.phone.includes(term))
    );
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

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

  // ✅ Fetch meetings with backend pagination + filters
  const fetchMeetings = async (userId, page = 1, search = "", tab = "All Time") => {
    if (!userId) return;
    setMeetingsLoading(true);
    try {
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

  // Export meetings to CSV
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
        // ✅ Just refetch by "refreshing" the current state
        // Option A (recommended): Reset to page 1 to see new meeting
        setCurrentPage(1);
        // OR
        // Option B: Keep current page — but risk missing if new meeting pushes total
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

  // Initialize user data
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      fetchManagers();
    } else if (user.role === "manager") {
      fetchSalespersons(user.id);
    }
  }, [user]);

  // Fetch meetings when dependencies change
  useEffect(() => {
    if (selectedSalesperson) {
      setMeetings([]); // ✅ Clear immediately
      fetchMeetings(selectedSalesperson.id, currentPage, globalSearch, activeTab);
    } else {
      setMeetings([]);
      setTotalMeetings(0);
    }
  }, [selectedSalesperson, currentPage, globalSearch, activeTab]);

  // Reset to page 1 on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, activeTab]);

  // Fetch available meetings for modal
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

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 py-4">

        <div className="flex flex-wrap items-center gap-3">
          {selectedSalesperson && totalMeetings > 0 && (
            <div
              onClick={handleExportMeetings}
              className="inline-flex items-center gap-2 px-4 py-2.5 translucentcustom-borderborder-slate-200 text rounded-xl text-sm font-semibold hover:translucent transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </div>
          )}
          <button
            onClick={() => {
              if (!selectedSalesperson) {
                Toast.error("Please select a salesperson first.");
                return;
              }
              setIsScheduleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-violet-violet hover:bg-violet-700 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm"
          >
            <CalendarPlus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">

        {/* Left Panel: Team List */}
        <div className="w-full lg:w-[300px] flex flex-col h-[40vh] lg:h-full translucent rounded-2xl shadow-smcustom-borderborder-slate-200 overflow-hidden shrink-0">

          <div className="p-4 custom-border-bottom border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text mb-4">
              {isAdmin ? "Select Team Member" : "My Team"}
            </h2>

            {isAdmin && (
              <div className="mb-4">
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
                  className="w-full pl-3 pr-8 py-2.5 translucent-inner custom-borderborder-slate-200 rounded-xl text-sm font-medium text appearance-none focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>Select a Manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">

              <input
                type="text"
                placeholder="Search team..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 translucent-inner custom-border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <Loader />
            ) : filteredSalespersons.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filteredSalespersons.map((sp) => {
                  const isSelected = selectedSalesperson?.id === sp.id;
                  return (
                    <div
                      key={sp.id}
                      onClick={() => {
                        setSelectedSalesperson(sp);
                        setCurrentPage(1);
                        fetchMeetings(sp.id, 1, globalSearch, activeTab);
                      }}
                      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                        ? "translucent custom-border border-violet-200"
                        : "custom-border border-transparent hover:translucent hover:border-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-500/30" : "custom-border"
                          }`}>
                          {sp.firstName?.charAt(0)}{sp.lastName?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate capitalize ${isSelected ? "text" : "text"}`}>
                            {sp.firstName} {sp.lastName}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-violet-600" : "text"}`}>
                            {sp.email}
                          </p>
                        </div>
                      </div>
                      {isSelected && <ChevronRight className="w-4 h-4 text-violet-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
                <Users className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text">
                  {isAdmin
                    ? (selectedManager ? "No team members found." : "Select a manager first.")
                    : "No team members found."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats Footer */}
          <div className="p-4 custom-border-top flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">Team Size</span>
              <span className="text-lg font-black text">{filteredSalespersons.length}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Meetings</span>
              <span className="text-lg font-black text-violet-600">{totalMeetings}</span>
            </div>
          </div>

        </div>

        {/* Right Panel: Meetings Table */}
        <div className="flex-1 flex flex-col translucent rounded-2xl shadow-smcustom-borderborder-slate-200 overflow-hidden relative">

          {selectedSalesperson ? (
            <>
              {/* Right Panel Header */}
              <div className="p-5custom-border-bottom border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 text-violet-600 rounded-xl custom-border">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text">
                      <span className="capitalize">{selectedSalesperson.firstName} {selectedSalesperson.lastName}</span>'s Meetings
                    </h3>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 rounded-xl justify-center items-center">
                  {["All Time", "Today", "This Week", "This Month"].map((tab) => (
                    <div
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                        ? "text-white shadow-sm bg-violet-600 px-4 py-2"
                        : "text hover:text hover:bg-slate-200/50"
                        }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto custom-scrollbar p-0 relative">
                <Table
                  columns={[
                    {
                      key: "companyName",
                      label: "Company",
                      render: (row) => (
                        <div className="font-medium text flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {row.name || "—"}
                        </div>
                      )
                    },
                    {
                      key: "personName",
                      label: "Contact",
                      render: (row) => (
                        <div className="capitalize flex items-center gap-2 text">
                          <User className="w-4 h-4 text-slate-400" />
                          {row.mobile || "—"}
                        </div>
                      )
                    },
                    {
                      key: "mobileNumber",
                      label: "Mobile",
                      render: (row) => (
                        <div className="flex items-center gap-2 text">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {row.mobile || "—"}
                        </div>
                      )
                    },
                    {
                      key: "companyEmail",
                      label: "Email",
                      render: (row) => (
                        <div className="break-words flex items-center gap-2 text">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]" title={row.email}>{row.email || "—"}</span>
                        </div>
                      )
                    },
                    {
                      key: "meetingTimeIn",
                      label: "Check-in",
                      render: (row) =>
                        row.meetingTimeIn ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold translucent text">
                            {new Date(row.meetingTimeIn).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        ) : "—",
                    },
                    {
                      key: "meetingTimeOut",
                      label: "Check-out",
                      render: (row) =>
                        row.meetingTimeOut ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold translucent text">
                            {new Date(row.meetingTimeOut).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        ) : "—",
                    },
                  ]}
                  data={meetings}
                  keyField="id"
                  emptyMessage="No meetings found for this filter."
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={totalMeetings}
                  onPageChange={setCurrentPage}
                />

                {/* Loading Overlay */}
                {meetingsLoading && (
                  <Loader />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4 custom-border">
              <div className="w-20 h-20 translucent rounded-full flex items-center justify-center shadow-smcustom-borderborder-slate-100 mb-4">
                <Users className="w-10 h-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text mb-2">No Team Member Selected</h3>
              <p className="text-sm font-medium text max-w-sm">
                {isAdmin
                  ? "Select a manager, then select a salesperson from the left panel to view and manage their meetings."
                  : "Select a salesperson from the left panel to view their assigned meetings and schedule."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 theblur p-4 animate-in fade-in duration-200 ">
          <div className="rounded-2xl shadow-2xl max-w-xl w-full relative overflow-hidden animate-in zoom-in-95 duration-200 popup-card">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 custom-border-bottom custom-border">
              <h2 className="text-lg font-bold text flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-violet-500" />
                Schedule Meeting
              </h2>
              <div
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="p-2 text-slate-400 hover:text hover:translucent rounded-full transition-colors focus:outline-none"
              >
                <X size={20} />
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* Selected Assignee Badge */}
              {selectedSalesperson && (
                <div className="custom-border border-violet-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">
                    {selectedSalesperson.firstName?.charAt(0)}{selectedSalesperson.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-0.5">Assigning To</p>
                    <p className="text-sm font-bold text-violet-900 capitalize">
                      {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                    </p>
                  </div>
                </div>
              )}

              {/* Select Meeting */}
              <div>
                <label className="block text-sm font-semibold text mb-1.5">
                  Select Client / Meeting <span className="text-red-500">*</span>
                </label>
                {meetingsForDropdownLoading ? (
                  <div className="w-full flex justify-center items-center">Loading Clients</div>
                ) : availableMeetings.length === 0 ? (
                  <div className="w-full px-4 py-3custom-borderborder-slate-200 rounded-xl translucent text text-sm font-medium">
                    No available clients found.
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="meetingId"
                      value={scheduleForm.meetingId}
                      onChange={handleScheduleInputChange}
                      className="w-full pl-10 pr-10 py-3 translucentcustom-borderborder-slate-200 rounded-xl text-sm font-medium text appearance-none focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a client meeting</option>
                      {availableMeetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.name || "Unnamed Company"}
                          {meeting.personName ? ` - ${meeting.personName}` : ""}
                        </option>
                      ))}
                    </select>
                    {/* Custom Select Arrow */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 dark:text-slate-400 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Time */}
              <div>
                <label className="block text-sm font-semibold text mb-1.5">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={scheduleForm.scheduledTime}
                    onChange={handleScheduleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 custom-border rounded-2xl flex justify-end gap-3">
              <div
                type="div"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="px-5 py-2.5 text-sm font-semibold text translucent custom-border rounded-xl hover:translucent transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </div>
              <button
                type="div"
                onClick={handleScheduleMeeting}
                disabled={scheduleLoading || !scheduleForm.meetingId || !scheduleForm.scheduledTime}
                className="px-5 py-2.5 text-sm font-semibold bg-violet-600 rounded-xl hover:bg-violet-700 disabled:bg-slate-300 disabled:text disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                {scheduleLoading ? (
                  <>
                    Please wait ...
                  </>
                ) : (
                  "Schedule Meeting"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}