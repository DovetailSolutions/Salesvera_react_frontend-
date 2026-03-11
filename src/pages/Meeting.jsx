import React, { useEffect, useState, useContext } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
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

  useEffect(()=>{
    window.scrollTo(0,0);
  },[])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Meeting Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Schedule and track meetings for your sales team.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {selectedSalesperson && totalMeetings > 0 && (
            <div
              onClick={handleExportMeetings}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </div>
          )}
          <div
            onClick={() => {
              if (!selectedSalesperson) {
                Toast.error("Please select a salesperson first.");
                return;
              }
              setIsScheduleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm"
          >
            <CalendarPlus className="w-4 h-4" />
            Schedule Meeting
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        
        {/* Left Panel: Team List */}
        <div className="w-full lg:w-[300px] flex flex-col h-[40vh] lg:h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
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
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search team..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Loader />
              </div>
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
                      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-50/80 border border-blue-200"
                          : "bg-white border border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-100 text-slate-600"
                        }`}>
                          {sp.firstName?.charAt(0)}{sp.lastName?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate capitalize ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                            {sp.firstName} {sp.lastName}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-blue-600" : "text-slate-500"}`}>
                            {sp.email}
                          </p>
                        </div>
                      </div>
                      {isSelected && <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
                <Users className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  {isAdmin 
                    ? (selectedManager ? "No team members found." : "Select a manager first.")
                    : "No team members found."
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Quick Stats Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">Team Size</span>
              <span className="text-lg font-black text-slate-800">{filteredSalespersons.length}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Meetings</span>
              <span className="text-lg font-black text-blue-600">{totalMeetings}</span>
            </div>
          </div>

        </div>

        {/* Right Panel: Meetings Table */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          
          {selectedSalesperson ? (
            <>
              {/* Right Panel Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      <span className="capitalize">{selectedSalesperson.firstName} {selectedSalesperson.lastName}</span>'s Meetings
                    </h3>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {["All Time", "Today", "This Week", "This Month"].map((tab) => (
                    <div
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === tab
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
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
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {row.companyName || "—"}
                        </div>
                      ) 
                    },
                    { 
                      key: "personName", 
                      label: "Contact", 
                      render: (row) => (
                        <div className="capitalize flex items-center gap-2 text-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                          {row.personName || "—"}
                        </div>
                      ) 
                    },
                    { 
                      key: "mobileNumber", 
                      label: "Mobile", 
                      render: (row) => (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {row.mobileNumber || "—"}
                        </div>
                      ) 
                    },
                    { 
                      key: "companyEmail", 
                      label: "Email", 
                      render: (row) => (
                        <div className="break-words flex items-center gap-2 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]" title={row.companyEmail}>{row.companyEmail || "—"}</span>
                        </div>
                      ) 
                    },
                    {
                      key: "meetingTimeIn",
                      label: "Check-in",
                      render: (row) =>
                        row.meetingTimeIn ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                            {new Date(row.meetingTimeIn).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        ) : "—",
                    },
                    {
                      key: "meetingTimeOut",
                      label: "Check-out",
                      render: (row) =>
                        row.meetingTimeOut ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
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
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                      <Loader /> <span className="text-sm font-semibold text-slate-600">Fetching meetings...</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4 bg-slate-50/50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Team Member Selected</h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm">
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-blue-500" />
                Schedule Meeting
              </h2>
              <div
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <X size={20} />
              </div>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Selected Assignee Badge */}
              {selectedSalesperson && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {selectedSalesperson.firstName?.charAt(0)}{selectedSalesperson.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">Assigning To</p>
                    <p className="text-sm font-bold text-blue-900 capitalize">
                      {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                    </p>
                  </div>
                </div>
              )}

              {/* Select Meeting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Select Client / Meeting <span className="text-red-500">*</span>
                </label>
                {meetingsForDropdownLoading ? (
                  <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm font-medium flex items-center gap-2">
                    <Loader /> Loading clients...
                  </div>
                ) : availableMeetings.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm font-medium">
                    No available clients found.
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="meetingId"
                      value={scheduleForm.meetingId}
                      onChange={handleScheduleInputChange}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select a client meeting</option>
                      {availableMeetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.companyName || "Unnamed Company"}
                          {meeting.personName ? ` - ${meeting.personName}` : ""}
                        </option>
                      ))}
                    </select>
                    {/* Custom Select Arrow */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={scheduleForm.scheduledTime}
                    onChange={handleScheduleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <div
                type="div"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleForm();
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </div>
              <div
                type="div"
                onClick={handleScheduleMeeting}
                disabled={scheduleLoading || !scheduleForm.meetingId || !scheduleForm.scheduledTime}
                className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                {scheduleLoading ? (
                  <>
                    <Loader />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Meeting"
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}