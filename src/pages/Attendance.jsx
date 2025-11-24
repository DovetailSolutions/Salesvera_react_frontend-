import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi, attendanceApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router";
import { FaAngleLeft } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa";

// Reuse the same auth hook
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userAttendance, setUserAttendance] = useState([]); // from API
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [todayAttendanceMap, setTodayAttendanceMap] = useState({});

  const navigate = useNavigate();

  const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchTodayAttendanceForUsers = async (userList) => {
    const todayStr = toLocalDateString(new Date());
    const attendanceMap = {};

    await Promise.all(
      userList.map(async (user) => {
        try {
          const res = await attendanceApi.getAttendance({ userId: user.id });
          const records = res.data?.data?.attendance || [];
          const todayRecord = records.find((att) => att.date === todayStr);
          if (todayRecord) {
            attendanceMap[user.id] = todayRecord.status; // e.g., "present"
          } else {
            attendanceMap[user.id] = "pending";
          }
        } catch (err) {
          attendanceMap[user.id] = "pending";
        }
      })
    );

    setTodayAttendanceMap(attendanceMap);
  };

  const fetchUsers = async (page = 1, search = "", role = "all") => {
    try {
      setLoading(true);

      if (isManager) {
        const res = await adminApi.getMySalespersons({
          managerId: user.id,
          page: 1,
        });

        const apiData = res.data?.data || res.data;
        if (!apiData || !Array.isArray(apiData.rows)) {
          throw new Error("Invalid response: expected data.rows array");
        }

        const term = search.toLowerCase().trim();
        let filteredRows = apiData.rows;

        if (term) {
          filteredRows = apiData.rows.filter((user) => {
            return (
              (user.firstName && user.firstName.toLowerCase().includes(term)) ||
              (user.lastName && user.lastName.toLowerCase().includes(term)) ||
              (user.email && user.email.toLowerCase().includes(term)) ||
              (user.phone && user.phone.toLowerCase().includes(term))
            );
          });
        }

        setUsers(filteredRows);
        setPagination({
          currentPage: 1,
          totalItems: filteredRows.length,
          totalPages: 1,
          limit: 10,
        });
        fetchTodayAttendanceForUsers(filteredRows); // ✅ Fetch today's attendance
      } else {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (role !== "all") params.role = role;

        const res = await adminApi.getAllUsers(params);
        const data = res.data?.data || res.data;

        if (!data || !Array.isArray(data.finalRows)) {
          throw new Error("Invalid response from all users API");
        }

        setUsers(data.finalRows);
        setPagination({
          currentPage: data.page || page,
          totalItems: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
          limit: data.limit || 10,
        });
        fetchTodayAttendanceForUsers(data.finalRows); // ✅ Fetch today's attendance
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
      setUsers([]);
      setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm, isManager ? "all" : roleFilter);
  }, [isManager, user.id, searchTerm, roleFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchUsers(1, value, isManager ? "all" : roleFilter);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    if (!isManager) {
      fetchUsers(1, searchTerm, value);
    }
  };

  const handleRowClick = async (user) => {
    setSelectedUser(user);
    setSelectedDate(new Date());
    setIsModalOpen(true);
    setLoadingAttendance(true);

    try {
      const res = await attendanceApi.getAttendance({ userId: user.id });
      const data = res.data?.data?.attendance || [];
      setUserAttendance(data);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      toast.error("Failed to load attendance data");
      setUserAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserAttendance([]);
  };

  // ✅ Today's Attendance Column
  const todayColumn = {
    key: "todayAttendance",
    label: "Today",
    render: (row) => {
      const status = todayAttendanceMap[row.id] || "pending";
      let bgColor, text;

      if (status === "present") {
        bgColor = "bg-[#10B981]"; // green
        text = "Present";
      } else if (status === "absent") {
        bgColor = "bg-red-500"; // red
        text = "Absent";
      } else {
        bgColor = "bg-gray-300"; // gray
        text = "Pending";
      }

     return (
  <div
    onClick={() => handleRowClick(row)}
    className="cursor-pointer"
  >
    <div
      className={`${bgColor} text-white text-xs font-medium rounded-full px-3 py-1 w-fit mx-auto`}
      title={text}
    >
      {text}
    </div>
  </div>
);
    },
  };

  // Build base columns including today
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
        <div
          className="break-words max-w-xs cursor-pointer"
          onClick={() => handleRowClick(row)}
        >
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
    todayColumn, // ✅ Added today's status
  ];

  const columns = isManager
    ? baseColumns
    : [
        ...baseColumns.slice(0, -1), // all except todayColumn
        {
          key: "assignedUnder",
          label: "Assigned Under",
          render: (row) => {
            const name = row.creator
              ? `${row.creator.firstName || ""} ${row.creator.lastName || ""}`.trim()
              : "";
            return (
              <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
                {name || <span className="text-gray-400">—</span>}
              </div>
            );
          },
        },
        baseColumns[baseColumns.length - 1], // re-add todayColumn at the end
      ];

  const actions = [];

  return (
    <div className="py-6 relative">
      <Toaster position="top-right" />

      {/* Search & Filter UI */}
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
            className="px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border"
          />

          {!isManager && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-400">Filter by role: </span>
              <select
                value={roleFilter}
                onChange={handleRoleChange}
                className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="sale_person">Salesperson</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-3xl font-semibold">
          {isManager ? "My Team Attendance" : "User Attendance"}
        </h2>
      </div>

      <Table
        columns={columns}
        data={users}
        actions={actions}
        keyField="id"
        emptyMessage="No users found"
        currentPage={pagination.currentPage}
        pageSize={pagination.limit}
        totalCount={pagination.totalItems}
        onPageChange={(page) =>
          fetchUsers(page, searchTerm, isManager ? "all" : roleFilter)
        }
        loading={loading}
      />

      {loading && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          Loading users...
        </div>
      )}

      {/* Modal Popup */}
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
              <span className="text-blue-600 capitalize">
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

                {/* Custom Calendar */}
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
                    while (days.length < 35) {
                      days.push(null);
                    }

                    const handleDateClick = (date) => {
                      if (date) setSelectedDate(date);
                    };

                    const isSameDay = (d1, d2) => {
                      return (
                        d1 &&
                        d2 &&
                        d1.getDate() === d2.getDate() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getFullYear() === d2.getFullYear()
                      );
                    };

                    const prevMonth = () => {
                      setSelectedDate(new Date(year, month - 1, 1));
                    };
                    const nextMonth = () => {
                      setSelectedDate(new Date(year, month + 1, 1));
                    };

                    return (
                      <>
                        {/* Month/Year Header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <button
                            onClick={prevMonth}
                            className="p-2 rounded-full transition hover:bg-gray-100"
                            aria-label="Previous month"
                          >
                            <FaAngleLeft className="text-lg" />
                          </button>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {firstDay.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })}
                          </h4>
                          <button
                            onClick={nextMonth}
                            className="p-2 rounded-full transition hover:bg-gray-100"
                            aria-label="Next month"
                          >
                            <FaAngleRight className="text-lg" />
                          </button>
                        </div>

                        {/* Day Headers */}
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

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {days.slice(0, 35).map((date, i) => {
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());

                            // 🔹 Lookup attendance from API data
                            let attendanceStatus = null;
                            if (date) {
                              const dateStr = toLocalDateString(date);
                              const record = userAttendance.find(
                                (att) => att.date === dateStr
                              );
                              if (record && record.status === "present") {
                                attendanceStatus = "present";
                              }
                              // Note: backend doesn't send "absent", so we only show green for present
                            }

                            let bgColor = "bg-gray-100";
                            let textColor = "text-gray-700";

                            if (date) {
                              if (isSelected) {
                                bgColor = "bg-blue-500";
                                textColor = "text-white font-semibold";
                              } else if (attendanceStatus === "present") {
                                bgColor = "bg-[#10B981]"; // green
                                textColor = "text-white font-semibold";
                              } else if (isToday) {
                                bgColor = "bg-blue-100";
                                textColor = "text-blue-700 font-medium";
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

            {/* Attendance Details */}
{selectedDate && (
  <div>
    <h4 className="text-sm font-semibold text-gray-700 mb-2">
      Attendance Details for {selectedDate.toDateString()}
    </h4>
    {(() => {
      const dateStr = toLocalDateString(selectedDate);
      const record = userAttendance.find(att => att.date === dateStr);

      if (!record) {
        return (
          <p className="text-sm text-gray-500 italic">No attendance record available.</p>
        );
      }

      const formatTime = (isoStr) => {
        if (!isoStr) return "—";
        const dt = new Date(isoStr);
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      return (
        <div className="text-sm space-y-1 grid grid-cols-2">
          <div><span className="text-xs font-medium">Punch In:</span> {formatTime(record.punch_in)}</div>
          <div><span className="text-xs font-medium">Punch Out:</span> {formatTime(record.punch_out)}</div>
          <div><span className="text-xs font-medium">Working Hours:</span> {record.working_hours ? `${record.working_hours.toFixed(2)} hrs` : "—"}</div>
          <div><span className="text-xs font-medium">Late:</span> {record.late ? "Yes" : "No"}</div>
          <div><span className="text-xs font-medium">Overtime:</span> {record.overtime ? `${record.overtime.toFixed(2)} hrs` : "—"}</div>
          <div><span className="text-xs font-medium">Status:</span> {record.status.charAt(0).toUpperCase() + record.status.slice(1)}</div>
        </div>
      );
    })()}
  </div>
)}

            {/* Only Close button */}
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