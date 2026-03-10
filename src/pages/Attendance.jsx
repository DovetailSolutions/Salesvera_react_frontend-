import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi, attendanceApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";
import { LiaUserClockSolid } from "react-icons/lia";
import { IoAlertCircleOutline, IoClose } from "react-icons/io5";
import { PiClockUserLight } from "react-icons/pi";
import { LuCalendarClock } from "react-icons/lu";
import { Calendar, Search, UserCheck, CalendarDays, ArrowLeft } from "lucide-react";
import AttendanceRegister from "./AttendanceRegister";
import Loader from "../components/Loader";

const useAuth = () => {
  const userData = JSON.parse(localStorage.getItem("user"));
  return {
    user: userData || { role: "admin", id: null },
  };
};

export default function Attendance() {
  const { user } = useAuth();
  const isManager = user.role === "manager";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userAttendance, setUserAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState({});

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Leave history view state
  const [viewMode, setViewMode] = useState("attendance"); // "attendance" | "leaves"
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveUser, setLeaveUser] = useState(null);

  const openAttendanceRegister = () => setIsRegisterOpen(true);
  const closeRegister = () => setIsRegisterOpen(false);

  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchAttendanceAndUsers = async (search = "") => {
    try {
      setLoading(true);
      const res = await attendanceApi.getAllUsersForAttendance({ limit: 1000 });
      let userList = res.data?.data || res.data || [];

      if (!Array.isArray(userList)) {
        throw new Error("Invalid user data");
      }

      const term = search.toLowerCase().trim();
      if (term) {
        userList = userList.filter(
          (u) =>
            (u.firstName || "").toLowerCase().includes(term) ||
            (u.lastName || "").toLowerCase().includes(term) ||
            (u.email || "").toLowerCase().includes(term) ||
            (u.phone || "").toLowerCase().includes(term)
        );
      }

      setUsers(userList);
      setPagination({ currentPage: 1, totalItems: userList.length, totalPages: 1, limit: 10 });

      const todayStr = toLocalDateString(new Date());
      const attendanceMap = {};

      userList.forEach((user) => {
        let isPresent = false;
        for (const att of user.Attendances || []) {
          if (att.punch_in) {
            const punchInDate = new Date(att.punch_in);
            const punchInLocalStr = toLocalDateString(punchInDate);
            if (punchInLocalStr === todayStr) {
              isPresent = true;
              break;
            }
          }
        }
        attendanceMap[user.id] = isPresent ? "present" : "absent";
      });

      setTodayAttendanceMap(attendanceMap);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
      setUsers([]);
      setTodayAttendanceMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceAndUsers();
  }, [user.id]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    fetchAttendanceAndUsers(term);
  };

  const handleRowClick = async (user) => {
    setSelectedUser(user);
    setSelectedDate(new Date());
    setIsModalOpen(true);
    setLoadingAttendance(true);

    try {
      const res = await attendanceApi.getUserAttendance({ userId: user.id, limit: 100 });
      const records = res.data?.data?.attendance || [];
      setUserAttendance(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error("Failed to fetch user attendance:", err);
      toast.error("Failed to load attendance data");
      setUserAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleViewLeaves = async (user) => {
    setLeaveUser(user);
    setLoadingLeaves(true);
    setViewMode("leaves");

    try {
      const res = await adminApi.getUserLeave(user.id);
      const leaves = Array.isArray(res.data?.data?.leave) ? res.data.data.leave : [];
      setLeaveHistory(leaves);
    } catch (err) {
      console.error("Failed to fetch leave history:", err);
      toast.error("Failed to load leave history");
      setLeaveHistory([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserAttendance([]);
  };

  const todayColumn = {
    key: "todayAttendance",
    label: "Today's Status",
    render: (row) => {
      const status = todayAttendanceMap[row.id] || "absent";
      const isPresent = status === "present";

      return (
        <div onClick={() => handleRowClick(row)} className="cursor-pointer">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              isPresent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isPresent ? "bg-emerald-500" : "bg-red-500"}`}></span>
            {isPresent ? "Present" : "Absent"}
          </span>
        </div>
      );
    },
  };

  const baseColumns = [
    {
      key: "firstName",
      label: "First Name",
      render: (row) => (
        <div className="cursor-pointer capitalize font-medium text-slate-800" onClick={() => handleRowClick(row)}>
          {row.firstName}
        </div>
      ),
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (row) => (
        <div className="cursor-pointer capitalize font-medium text-slate-800" onClick={() => handleRowClick(row)}>
          {row.lastName}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <div className="break-words max-w-xs cursor-pointer text-slate-500" onClick={() => handleRowClick(row)}>
          {row.email}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <div className="cursor-pointer text-slate-600" onClick={() => handleRowClick(row)}>
          {row.phone}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => {
        const displayRole = row.role === "sale_person" ? "Salesperson" : row.role === "manager" ? "Manager" : row.role.charAt(0).toUpperCase() + row.role.slice(1);
        return (
          <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {displayRole}
            </span>
          </div>
        );
      },
    },
    todayColumn,
  ];

  const actions = [
    {
      type: "menu",
      label: "Actions",
      className: "px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm",
      menuItems: [
        {
          label: "View Attendance",
          onClick: (row) => handleRowClick(row),
          icon: <UserCheck className="w-4 h-4 text-blue-500" />,
          className: "text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium",
        },
        {
          label: "View Leaves",
          onClick: (row) => handleViewLeaves(row),
          icon: <CalendarDays className="w-4 h-4 text-orange-500" />,
          className: "text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-medium",
        },
      ],
    },
  ];

  const leaveColumns = [
    {
      key: "from_date",
      label: "Start Date",
      render: (row) => (row.from_date ? <span className="font-medium text-slate-700">{new Date(row.from_date).toLocaleDateString("en-GB")}</span> : "—"),
    },
    {
      key: "to_date",
      label: "End Date",
      render: (row) => (row.to_date ? <span className="font-medium text-slate-700">{new Date(row.to_date).toLocaleDateString("en-GB")}</span> : "—"),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => <span className="text-slate-600">{row.reason || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = row.status?.toLowerCase() || "pending";
        let color = "bg-slate-100 text-slate-700";
        let dot = "bg-slate-500";
        if (status === "approved") { color = "bg-emerald-100 text-emerald-700"; dot = "bg-emerald-500"; }
        if (status === "rejected") { color = "bg-red-100 text-red-700"; dot = "bg-red-500"; }
        if (status === "pending") { color = "bg-amber-100 text-amber-700"; dot = "bg-amber-500"; }

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
             <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {viewMode === "leaves" ? (
          <>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Leave History
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Viewing records for <span className="capitalize text-slate-700 font-bold">{leaveUser?.firstName} {leaveUser?.lastName}</span>
              </p>
            </div>
            <button
              onClick={() => setViewMode("attendance")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Attendance
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Team Attendance
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Monitor daily attendance and view historical records.
              </p>
            </div>
            <button
              onClick={openAttendanceRegister}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm"
            >
              <Calendar className="w-4 h-4" />
              Attendance Register
            </button>
          </>
        )}
      </div>

      {/* Search & Controls */}
      {viewMode === "attendance" && (
        <>
          <AttendanceRegister isOpen={isRegisterOpen} onClose={closeRegister} />
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={isManager ? "Search sales team..." : "Search users by name, email..."}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </>
      )}

      {/* Main Table Area */}
      <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          {viewMode === "attendance" ? (
            <Table
              columns={baseColumns}
              data={users}
              actions={actions}
              keyField="id"
              emptyMessage="No users found"
            />
          ) : (
            <Table
              columns={leaveColumns}
              data={leaveHistory}
              keyField="id"
              emptyMessage="No leave records found"
            />
          )}
        </div>

        {/* Loading Overlays */}
        {(loading && viewMode === "attendance") && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Loader /> <span className="text-sm font-semibold text-slate-600">Loading records...</span>
            </div>
          </div>
        )}
        
        {(loadingLeaves && viewMode === "leaves") && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Loader /> <span className="text-sm font-semibold text-slate-600">Loading history...</span>
            </div>
          </div>
        )}
      </div>

      {/* User Attendance Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Attendance Record
                </h3>
                <p className="text-sm font-medium text-slate-500 capitalize mt-0.5">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <IoClose size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {loadingAttendance ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader />
                  <p className="text-sm text-slate-500 mt-3 font-medium">Fetching attendance data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Calendar Widget */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Select Date
                    </label>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      {(() => {
                        const now = selectedDate;
                        const year = now.getFullYear();
                        const month = now.getMonth();
                        const firstDay = new Date(year, month, 1);
                        const lastDay = new Date(year, month + 1, 0);
                        const daysInMonth = lastDay.getDate();
                        const startDayIndex = firstDay.getDay();

                        const days = [];
                        for (let i = 0; i < startDayIndex; i++) days.push(null);
                        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
                        while (days.length < 42) days.push(null);

                        const handleDateClick = (date) => { if (date) setSelectedDate(date); };
                        const isSameDay = (d1, d2) => d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
                        const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
                        const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        return (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <FaAngleLeft />
                              </button>
                              <h4 className="text-sm font-bold text-slate-700">
                                {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                              </h4>
                              <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                <FaAngleRight />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                                <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-7 gap-1">
                              {days.map((date, i) => {
                                const isSelected = isSameDay(date, selectedDate);
                                const normalizedDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
                                const isFuture = normalizedDate && normalizedDate > today;
                                const hasPunchInOnDate = date && !isFuture
                                  ? userAttendance.some((att) => {
                                      if (!att.punch_in) return false;
                                      return toLocalDateString(new Date(att.punch_in)) === toLocalDateString(date);
                                    })
                                  : false;

                                let baseClass = "aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all border border-transparent ";
                                
                                if (!date) {
                                  return <div key={i} className={baseClass + "pointer-events-none"}></div>;
                                }

                                if (isSelected) {
                                  baseClass += "bg-blue-600 text-white shadow-md shadow-blue-500/30";
                                } else if (isFuture) {
                                  baseClass += "text-slate-300 pointer-events-none";
                                } else if (hasPunchInOnDate) {
                                  baseClass += "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 cursor-pointer";
                                } else {
                                  baseClass += "bg-red-50 text-red-600 hover:bg-red-100 border-red-100 cursor-pointer";
                                }

                                return (
                                  <div key={i} onClick={() => handleDateClick(date)} className={baseClass}>
                                    {date.getDate()}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Selected Date Details */}
                  {selectedDate && (
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <CalendarDays className="w-4 h-4 text-blue-500"/> 
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h4>
                      
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedNormalized = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                        
                        if (selectedNormalized > today) {
                          return <div className="text-sm text-slate-500 font-medium py-2 text-center bg-white rounded-lg border border-slate-200 border-dashed">Future date. No records available yet.</div>;
                        }

                        const dateStr = toLocalDateString(selectedDate);
                        const record = userAttendance.find((att) => att.punch_in && toLocalDateString(new Date(att.punch_in)) === dateStr);

                        if (!record) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-red-600 font-medium py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Absent / No valid punch-in found.
                            </div>
                          );
                        }

                        const formatTime = (isoStr) => {
                          if (!isoStr) return "—";
                          const dt = new Date(isoStr);
                          return isNaN(dt.getTime()) ? "—" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        };

                        const hasPunchIn = !!record.punch_in;

                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><LuCalendarClock className="text-blue-500"/> Status</span>
                              <span className={`text-sm font-bold ${hasPunchIn ? "text-emerald-600" : "text-red-600"}`}>{hasPunchIn ? "Present" : "Absent"}</span>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><LiaUserClockSolid className="text-blue-500"/> Total Hours</span>
                              <span className="text-sm font-bold text-slate-700">{record.working_hours ? `${record.working_hours.toFixed(2)} hrs` : "—"}</span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><MdOutlineTimer className="text-emerald-500"/> Punch In</span>
                              <span className="text-sm font-bold text-slate-700">{formatTime(record.punch_in)}</span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><MdOutlineTimer className="text-orange-500"/> Punch Out</span>
                              <span className="text-sm font-bold text-slate-700">{formatTime(record.punch_out)}</span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><IoAlertCircleOutline className={record.late ? "text-red-500" : "text-slate-400"}/> Late</span>
                              <span className={`text-sm font-bold ${record.late ? "text-red-600" : "text-slate-700"}`}>{record.late ? "Yes" : "No"}</span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5"><PiClockUserLight className="text-purple-500"/> Overtime</span>
                              <span className="text-sm font-bold text-slate-700">{record.overtime ? `${record.overtime.toFixed(2)} hrs` : "—"}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}