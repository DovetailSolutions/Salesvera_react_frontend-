import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi, attendanceApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { FaAngleLeft } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa";
import { MdOutlineTimer } from "react-icons/md";
import { LiaUserClockSolid } from "react-icons/lia";
import { IoAlertCircleOutline } from "react-icons/io5";
import { PiClockUserLight } from "react-icons/pi";
import { LuCalendarClock } from "react-icons/lu";
import { Calendar } from "lucide-react";
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

  // 👇 NEW: State for leave history view
  const [viewMode, setViewMode] = useState("attendance"); // "attendance" | "leaves"
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveUser, setLeaveUser] = useState(null);

  const openAttendanceRegister = () => {
    setIsRegisterOpen(true);
  };

  const closeRegister = () => {
    setIsRegisterOpen(false);
  };

  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
    label: "Today",
    render: (row) => {
      const status = todayAttendanceMap[row.id] || "absent";
      let bgColor = "bg-red-400",
        text = "Absent";

      if (status === "present") {
        bgColor = "bg-[#10B981]";
        text = "Present";
      }

      return (
        <div onClick={() => handleRowClick(row)} className="cursor-pointer">
          <span
            className={`${bgColor} text-white text-xs font-medium rounded-full px-3 py-1 inline-block`}
            title={text}
          >
            {text}
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
        <div className="cursor-pointer capitalize" onClick={() => handleRowClick(row)}>
          {row.firstName}
        </div>
      ),
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (row) => (
        <div className="cursor-pointer capitalize" onClick={() => handleRowClick(row)}>
          {row.lastName}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <div className="break-words max-w-xs cursor-pointer" onClick={() => handleRowClick(row)}>
          {row.email}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
          {row.phone}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => {
        const displayRole =
          row.role === "sale_person"
            ? "Salesperson"
            : row.role === "manager"
            ? "Manager"
            : row.role.charAt(0).toUpperCase() + row.role.slice(1);
        return (
          <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
            {displayRole}
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
      className: "px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition",
      menuItems: [
        {
          label: "View",
          onClick: (row) => handleRowClick(row),
          icon: <Calendar className="w-4 h-4 text-blue-500" />,
          className: "text-blue-600 hover:bg-blue-50",
        },
        {
          label: "Leaves",
          onClick: (row) => handleViewLeaves(row),
          icon: <Calendar className="w-4 h-4 text-orange-600" />,
          className: "text-orange-600 hover:bg-orange-50",
        },
      ],
    },
  ];

  const columns = baseColumns;

  const leaveColumns = [
  {
    key: "from_date",
    label: "Start Date",
    render: (row) => (row.from_date ? new Date(row.from_date).toLocaleDateString("en-GB") : "—"),
  },
  {
    key: "to_date",
    label: "End Date",
    render: (row) => (row.to_date ? new Date(row.to_date).toLocaleDateString("en-GB") : "—"),
  },
  {
    key: "reason",
    label: "Reason",
    render: (row) => row.reason || "—",
  },
  {
    key: "status",
    label: "Status",
    render: (row) => {
      const status = row.status?.toLowerCase() || "pending";
      let color = "bg-gray-100 text-gray-800";
      if (status === "approved") color = "bg-green-100 text-green-800";
      if (status === "rejected") color = "bg-red-100 text-red-800";
      if (status === "pending") color = "bg-yellow-100 text-yellow-800";

      return (
        <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
];

  return (
    <div className="py-2 relative h-screen">
      <Toaster position="top-right" />

      <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
        {viewMode === "leaves" ? (
          <>
            <h2 className="text-3xl font-semibold">
              Leave History for{" "}
              <span className="capitalize">
                {leaveUser?.firstName} {leaveUser?.lastName}
              </span>
            </h2>
            <button
              onClick={() => setViewMode("attendance")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Back to Attendance
            </button>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-semibold">
              {isManager ? "My Team Attendance" : "User Attendance"}
            </h2>

            <button
              onClick={openAttendanceRegister}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Attendance Register
            </button>
          </>
        )}
      </div>

      {viewMode === "attendance" && (
        <>
          <AttendanceRegister
            isOpen={isRegisterOpen}
            onClose={closeRegister}
          />

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 flex-1 max-w-3xl">
              <input
                type="text"
                placeholder={
                  isManager
                    ? "Search your salespersons by name, email, or phone..."
                    : "Search by name, email or phone number..."
                }
                value={searchTerm}
                onChange={handleSearch}
                className="px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm w-full sm:w-auto flex-1 min-w-[200px]"
              />
            </div>
          </div>
        </>
      )}

      {viewMode === "attendance" ? (
        <Table
          columns={columns}
          data={users}
          actions={actions}
          keyField="id"
          emptyMessage="No users found"
          loading={loading}
        />
      ) : (
        <Table
          columns={leaveColumns}
          data={leaveHistory}
          keyField="id"
          emptyMessage="No leave records found"
          loading={loadingLeaves}
        />
      )}

      {loading && viewMode === "attendance" && (
        <Loader />
      )}

      {loadingLeaves && viewMode === "leaves" && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          <Loader />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <div
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
            >
              ✕
            </div>

            <h3 className="text-xl font-semibold mb-4">
              Attendance for{" "}
              <span className="capitalize">
                {selectedUser.firstName} {selectedUser.lastName}
              </span>
            </h3>

            {loadingAttendance ? (
              <div className="text-center py-4 text-gray-500">Loading attendance...</div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Date
                </label>
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  {(() => {
                    const now = selectedDate;
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startDayIndex = firstDay.getDay(); // 0 = Sunday

                    const days = [];
                    for (let i = 0; i < startDayIndex; i++) {
                      days.push(null);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      days.push(new Date(year, month, day));
                    }
                    while (days.length < 42) {
                      days.push(null);
                    }

                    const handleDateClick = (date) => {
                      if (date) setSelectedDate(date);
                    };

                    const isSameDay = (d1, d2) =>
                      d1 &&
                      d2 &&
                      d1.getDate() === d2.getDate() &&
                      d1.getMonth() === d2.getMonth() &&
                      d1.getFullYear() === d2.getFullYear();

                    const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
                    const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    return (
                      <>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <button onClick={prevMonth} className="!p-2 rounded-full">
                            <FaAngleLeft />
                          </button>
                          <h4 className="text-sm font-semibold">
                            {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                          </h4>
                          <button onClick={nextMonth} className="!p-2 rounded-full">
                            <FaAngleRight />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-2 mb-2">
                          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                            <div
                              key={i}
                              className="text-center text-xs font-semibold text-blue-600 bg-blue-50 py-1 rounded"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {days.map((date, i) => {
                            const isSelected = isSameDay(date, selectedDate);
                            const normalizedDate = date
                              ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
                              : null;
                            const isFuture = normalizedDate && normalizedDate > today;
                            const hasPunchInOnDate = date && !isFuture
                              ? userAttendance.some((att) => {
                                  if (!att.punch_in) return false;
                                  const punchInLocal = toLocalDateString(new Date(att.punch_in));
                                  return punchInLocal === toLocalDateString(date);
                                })
                              : false;

                            let bgColor = "bg-gray-100",
                              textColor = "text-gray-700";

                            if (date) {
                              if (isSelected) {
                                bgColor = "bg-blue-500";
                                textColor = "text-white font-semibold";
                              } else if (isFuture) {
                                bgColor = "bg-gray-100";
                                textColor = "text-gray-500";
                              } else if (hasPunchInOnDate) {
                                bgColor = "bg-[#10B981]";
                                textColor = "text-white font-semibold";
                              } else {
                                bgColor = "bg-red-400";
                                textColor = "text-white font-semibold";
                              }
                            } else {
                              bgColor = "";
                              textColor = "text-gray-300";
                            }

                            return (
                              <div
                                key={i}
                                onClick={() => handleDateClick(date)}
                                className={`aspect-square rounded flex items-center justify-center text-xs cursor-pointer transition ${
                                  date
                                    ? `${bgColor} ${textColor} hover:bg-gray-200`
                                    : "pointer-events-none " + textColor
                                }`}
                              >
                                {date ? date.getDate() : ""}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {selectedDate && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Attendance Details for {selectedDate.toDateString()}
                </h4>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selectedNormalized = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate()
                  );
                  const isFutureDate = selectedNormalized > today;

                  if (isFutureDate) {
                    return (
                      <p className="text-sm text-gray-500 italic">
                        Future date — attendance not applicable.
                      </p>
                    );
                  }

                  const dateStr = toLocalDateString(selectedDate);
                  const record = userAttendance.find((att) => {
                    if (!att.punch_in) return false;
                    const punchInLocal = toLocalDateString(new Date(att.punch_in));
                    return punchInLocal === dateStr;
                  });

                  if (!record) {
                    return (
                      <p className="text-sm text-red-400 italic">
                        No valid attendance record (punch-in missing).
                      </p>
                    );
                  }

                  const formatTime = (isoStr) => {
                    if (!isoStr) return "—";
                    const dt = new Date(isoStr);
                    return isNaN(dt.getTime()) ? "—" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                  };

                  const hasPunchIn = !!record.punch_in;

                  return (
                    <div className="text-sm space-y-1 grid grid-cols-2">
                      <div className="flex items-center gap-1">
                        <LuCalendarClock className={hasPunchIn ? "text-green-600" : "text-red-600"} />
                        <span className="text-xs font-medium">Status:</span>{" "}
                        {hasPunchIn ? "Present" : "Absent"}
                      </div>
                      <div className="flex items-center gap-1">
                        <LiaUserClockSolid className="text-green-600" />
                        <span className="text-xs font-medium">Working Hours:</span>{" "}
                        {record.working_hours ? `${record.working_hours.toFixed(2)} hrs` : "—"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MdOutlineTimer className="text-blue-600" />
                        <span className="text-xs font-medium">Punch In:</span> {formatTime(record.punch_in)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MdOutlineTimer className="text-blue-600" />
                        <span className="text-xs font-medium">Punch Out:</span> {formatTime(record.punch_out)}
                      </div>
                      <div className="flex items-center gap-1">
                        <IoAlertCircleOutline className="text-red-600" />
                        <span className="text-xs font-medium">Late:</span> {record.late ? "Yes" : "No"}
                      </div>
                      <div className="flex items-center gap-1">
                        <PiClockUserLight className="text-red-600" />
                        <span className="text-xs font-medium">Overtime:</span>{" "}
                        {record.overtime ? `${record.overtime.toFixed(2)} hrs` : "—"}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-center mt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
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