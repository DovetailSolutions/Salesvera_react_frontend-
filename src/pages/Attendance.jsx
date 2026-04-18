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
import { Calendar, Search, UserCheck, CalendarDays, ArrowLeft, Mail, Phone, UserCircle, Briefcase } from "lucide-react";
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
      setPagination({ currentPage: 1, totalItems: userList.length, totalPages: 1, limit: 1000 });

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

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setSelectedDate(new Date());
    setIsModalOpen(true);
    setUserAttendance(Array.isArray(user.Attendances) ? user.Attendances : []);
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

  // ─── Table Configuration ──────────────────────────────────────────────────
  const todayColumn = {
    key: "todayAttendance",
    label: "Today's Status",
    render: (row) => {
      const status = todayAttendanceMap[row.id] || "absent";
      const isPresent = status === "present";

      return (
        <div onClick={() => handleRowClick(row)} className="cursor-pointer">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center w-fit gap-1.5 ${isPresent ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-500" : "bg-red-500"}`}></span>
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
        <div className="flex items-center gap-2 cursor-pointer font-medium text" onClick={() => handleRowClick(row)}>
          <UserCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="capitalize">{row.firstName}</span>
        </div>
      ),
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (row) => (
        <div className="cursor-pointer capitalize font-medium text" onClick={() => handleRowClick(row)}>
          {row.lastName}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <div className="flex items-center gap-2 break-words max-w-xs cursor-pointer text-sm text-gray-500 dark:text-gray-400" onClick={() => handleRowClick(row)}>
          <Mail className="w-3.5 h-3.5" />
          {row.email}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <div className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 dark:text-gray-400" onClick={() => handleRowClick(row)}>
          <Phone className="w-3.5 h-3.5" />
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
          <div className="flex items-center gap-1.5 cursor-pointer text" onClick={() => handleRowClick(row)}>
            <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium">{displayRole}</span>
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
      className: "p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
      menuItems: [
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-violet-600 dark:text-violet-400">
              <UserCheck className="w-4 h-4" /> View Attendance
            </span>
          ),
          onClick: (row) => handleRowClick(row),
          className: "hover:!bg-violet-50 dark:hover:!bg-violet-500/10 cursor-pointer",
        },
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400">
              <CalendarDays className="w-4 h-4" /> View Leaves
            </span>
          ),
          onClick: (row) => handleViewLeaves(row),
          className: "hover:!bg-orange-50 dark:hover:!bg-orange-500/10 cursor-pointer",
        },
      ],
    },
  ];

  const leaveColumns = [
    {
      key: "from_date",
      label: "Start Date",
      render: (row) => (row.from_date ? <span className="font-medium text flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{new Date(row.from_date).toLocaleDateString("en-GB")}</span> : "—"),
    },
    {
      key: "to_date",
      label: "End Date",
      render: (row) => (row.to_date ? <span className="font-medium text flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{new Date(row.to_date).toLocaleDateString("en-GB")}</span> : "—"),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-sm">{row.reason || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = row.status?.toLowerCase() || "pending";
        let colorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        let dot = "bg-slate-500";
        if (status === "approved") { colorClass = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"; dot = "bg-emerald-500"; }
        if (status === "rejected") { colorClass = "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"; dot = "bg-red-500"; }
        if (status === "pending") { colorClass = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"; dot = "bg-amber-500"; }

        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center w-fit gap-1.5 ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {viewMode === "leaves" ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text tracking-tight flex items-center gap-2">
                Leave History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Viewing records for <span className="capitalize text font-bold">{leaveUser?.firstName} {leaveUser?.lastName}</span>
              </p>
            </div>
            <button
              onClick={() => setViewMode("attendance")}
              className="button flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Attendance
            </button>
          </>
        ) : (
          <>

          </>
        )}
      </div>

      {viewMode === "attendance" && (
        <>
          {isRegisterOpen && (
            <AttendanceRegister isOpen={isRegisterOpen} onClose={closeRegister} />
          )}

          <div className="translucent mb-6 flex items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder={isManager ? "Search sales team..." : "Search users by name, email..."}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 translucent-inner py-2.5 border-none text-sm focus:outline-none focus:ring-4 focus:ring-brandviolet/20 transition-all"
              />
            </div>
            <button onClick={openAttendanceRegister} className="button flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Attendance Register
            </button>
          </div>
        </>
      )}

      {/* Main Table Area */}
      <div className="relative flex-1 overflow-hidden flex flex-col translucent p-0 animate-in fade-in duration-300">
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
          <Loader />
        )}

        {(loadingLeaves && viewMode === "leaves") && (
          <Loader />
        )}
      </div>

      {/* User Attendance Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="popup-card rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200/20 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text">
                  Attendance Record
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
              >
                <IoClose size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">

                {/* Calendar Widget */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Select Date
                  </label>
                  <div className="translucent-inner rounded-xl shadow-sm p-4">
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
                            <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <FaAngleLeft />
                            </button>
                            <h4 className="text-sm font-bold text">
                              {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                            </h4>
                            <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <FaAngleRight />
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                              <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">
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
                                baseClass += "bg-violet-600 text-white shadow-md shadow-violet-500/30";
                              } else if (isFuture) {
                                baseClass += "text-gray-300 dark:text-gray-600 pointer-events-none";
                              } else if (hasPunchInOnDate) {
                                baseClass += "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 cursor-pointer";
                              } else {
                                baseClass += "bg-red-50 text-red-600 hover:bg-red-100 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 cursor-pointer";
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
                  <div className="translucent-inner rounded-xl p-5">
                    <h4 className="text-sm font-bold text mb-4 flex items-center gap-2 border-b border-gray-200/20 pb-2">
                      <CalendarDays className="w-4 h-4 text-violet-500" />
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h4>

                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedNormalized = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

                      if (selectedNormalized > today) {
                        return <div className="text-sm text-gray-500 font-medium py-2 text-center rounded-lg border border-gray-200/20 border-dashed">Future date. No records available yet.</div>;
                      }

                      const dateStr = toLocalDateString(selectedDate);
                      const records = userAttendance.filter((att) => att.punch_in && toLocalDateString(new Date(att.punch_in)) === dateStr);

                      if (records.length === 0) {
                        return (
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium py-2 px-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Absent / No valid punch-in found.
                          </div>
                        );
                      }

                      const totalHours = records.reduce((sum, r) => sum + (r.working_hours || 0), 0);

                      const formatTime = (isoStr) => {
                        if (!isoStr) return "—";
                        const dt = new Date(isoStr);
                        return isNaN(dt.getTime()) ? "—" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      };

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-gray-500 dark:text-gray-400">{records.length} Session{records.length > 1 ? "s" : ""}</span>
                            <span className="font-bold text-violet-600 dark:text-violet-400">Total Hours: {totalHours.toFixed(2)} hrs</span>
                          </div>

                          {records.map((record, idx) => {
                            const hasPunchIn = !!record.punch_in;
                            return (
                              <div key={record.id || idx} className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-200/20 last:border-0 last:pb-0">
                                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase">
                                  Session {idx + 1}
                                </div>
                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><LuCalendarClock className="text-violet-500" /> Status</span>
                                  <span className={`text-sm font-bold ${hasPunchIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{hasPunchIn ? "Present" : "Absent"}</span>
                                </div>

                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><LiaUserClockSolid className="text-violet-500" /> Session Hours</span>
                                  <span className="text-sm font-bold text">{record.working_hours ? `${record.working_hours.toFixed(2)} hrs` : "—"}</span>
                                </div>

                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><MdOutlineTimer className="text-emerald-500" /> Punch In</span>
                                  <span className="text-sm font-bold text">{formatTime(record.punch_in)}</span>
                                </div>

                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><MdOutlineTimer className="text-orange-500" /> Punch Out</span>
                                  <span className="text-sm font-bold text">{formatTime(record.punch_out)}</span>
                                </div>

                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><IoAlertCircleOutline className={record.late ? "text-red-500" : "text-gray-400"} /> Late</span>
                                  <span className={`text-sm font-bold ${record.late ? "text-red-600 dark:text-red-400" : "text"}`}>{record.late ? "Yes" : "No"}</span>
                                </div>

                                <div className="translucent p-3 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><PiClockUserLight className="text-purple-500" /> Overtime</span>
                                  <span className="text-sm font-bold text">{record.overtime ? `${record.overtime.toFixed(2)} hrs` : "—"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200/20 flex justify-end">
              <button
                onClick={closeModal}
                className="button"
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