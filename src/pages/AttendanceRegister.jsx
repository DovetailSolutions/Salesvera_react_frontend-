import React, { useState, useEffect, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, Calendar, Users, X, Filter, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { attendanceApi } from '../api';

const AttendanceRegister = ({ isOpen, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState(''); // ✅ Replaces selectedEmployee
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const [apiUsers, setApiUsers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  const fetchAttendance = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await attendanceApi.getAttendanceBook({ year, month });

      const users = response.data.data.users || [];
      setApiUsers(users);

      const transformedAttendance = {};
      users.forEach(user => {
        const mappedDays = {};
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const dayStr = String(day);
          const apiStatus = user.days?.[dayStr];

          const date = new Date(year, month - 1, day);
          const dayOfWeek = date.getDay();

          if (dayOfWeek === 0 || dayOfWeek === 6) {
            mappedDays[day] = 'OFF';
          } else if (apiStatus === 'present') {
            mappedDays[day] = 'P';
          } else if (apiStatus === 'leaveApproved') {
            mappedDays[day] = 'L';
          } else {
            mappedDays[day] = 'A';
          }
        }
        transformedAttendance[user.id] = mappedDays;
      });

      setAttendanceData(transformedAttendance);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, currentMonth]);

  const employees = useMemo(() => {
    return apiUsers.map(user => ({
      id: user.id,
      name: user.name,
      category: user.role === 'sale_person' ? 'Sales' : 'Manager',
      role: user.role,
    }));
  }, [apiUsers]);

  const categories = useMemo(() => {
    const roles = [...new Set(employees.map(e => e.category))];
    return ['all', ...roles];
  }, [employees]);

  // ✅ Updated: Now filters by search term + category
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(emp => {
      const matchesSearch = 
        term === '' || 
        emp.name.toLowerCase().includes(term) || 
        emp.id.toString().includes(term);
      const matchesCategory = selectedCategory === 'all' || emp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [employees, searchTerm, selectedCategory]);

  const getDaysInMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  };

  const getDayName = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'P': 'bg-green-50 text-green-700',
      'A': 'bg-red-50 text-red-700',
      'OFF': 'bg-gray-100 text-gray-600',
      'L': 'bg-blue-50 text-blue-700',
      '-': 'bg-white text-gray-400'
    };
    return colors[status] || 'bg-white';
  };

  const calculateStats = (empId) => {
    const days = attendanceData[empId] || {};
    const present = Object.values(days).filter(s => s === 'P').length;
    const absent = Object.values(days).filter(s => s === 'A').length;
    const leave = Object.values(days).filter(s => s === 'L').length;
    const total = present + absent + leave;
    return { present, absent, leave, total };
  };

  const getTodaysDayInCurrentMonth = () => {
    const now = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    if (now.getFullYear() === currentYear && now.getMonth() === currentMonthIndex) {
      return now.getDate();
    }
    return null;
  };

  const calculateOverallStats = () => {
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalDays = 0;
    let todayAbsent = 0;

    const todaysDay = getTodaysDayInCurrentMonth();

    filteredEmployees.forEach(emp => {
      const stats = calculateStats(emp.id);
      totalPresent += stats.present;
      totalAbsent += stats.absent;
      totalLeave += stats.leave;
      totalDays += stats.total;

      if (todaysDay !== null) {
        const statusToday = attendanceData[emp.id]?.[todaysDay];
        if (statusToday === 'A') {
          todayAbsent++;
        }
      }
    });

    return { totalPresent, totalAbsent, totalLeave, totalDays, todayAbsent };
  };

  const exportToExcel = () => {
    const daysInMonth = getDaysInMonth();
    const headers = ['Employee ID', 'Name', 'Category'];
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(`${day} ${getDayName(day)}`);
    }
    headers.push('Present', 'Absent', 'Leave', 'Total Days');

    const data = filteredEmployees.map(emp => {
      const stats = calculateStats(emp.id);
      const row = [emp.id, emp.name, emp.category];
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(attendanceData[emp.id]?.[day] || 'A');
      }
      row.push(stats.present, stats.absent, stats.leave, stats.total);
      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    XLSX.writeFile(wb, `Attendance_${monthName}.xlsx`);
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const overallStats = calculateOverallStats();
  const todaysDay = getTodaysDayInCurrentMonth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="w-full h-screen max-h-screen bg-white rounded shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Register</h1>
                <p className="text-sm text-gray-500">{monthName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <div
                onClick={onClose}
                className="w-9 h-9 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-4 text-gray-600">
            Loading attendance data...
          </div>
        )}

        {/* Stats Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Total Present</div>
              <div className="text-2xl font-semibold text-gray-900">{overallStats.totalPresent}</div>
            </div>
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">
                {todaysDay !== null ? 'Absent Today' : 'Absent (N/A)'}
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {todaysDay !== null ? overallStats.todayAbsent : '—'}
              </div>
            </div>
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">On Leave</div>
              <div className="text-2xl font-semibold text-gray-900">{overallStats.totalLeave}</div>
            </div>
            <div className="bg-white rounded p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Employees</div>
              <div className="text-2xl font-semibold text-gray-900">{filteredEmployees.length}</div>
            </div>
          </div>
        </div>

        {/* Filters & Navigation */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* ✅ Search Bar Instead of Dropdown */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </div>
              <div
                onClick={() => changeMonth(1)}
                className="w-8 h-8 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-8 h-8 bg-green-50 border border-green-200 rounded flex items-center justify-center text-green-700 font-medium">P</span>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-8 h-8 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-700 font-medium">A</span>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-8 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-600 font-medium">OFF</span>
              <span>Off Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-8 h-8 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-700 font-medium">L</span>
              <span>Leave</span>
            </div>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="flex-1 bg-gray-50 p-6">
          {filteredEmployees.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No employees found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
              <div className="overflow-auto max-h-[calc(100vh-320px)]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-40 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Emp
                      </th>
                      {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const dayName = getDayName(day);
                        const isWeekend = dayName === 'Sat' || dayName === 'Sun';
                        return (
                          <th
                            key={day}
                            className={`sticky top-0 z-30 px-2 py-3 text-center text-xs font-semibold ${
                              isWeekend ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div>{day}</div>
                            <div className="text-[10px] font-normal mt-0.5">{dayName}</div>
                          </th>
                        );
                      })}
                      <th className="sticky right-0 top-0 z-40 bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((emp) => {
                      const stats = calculateStats(emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-30 bg-white px-4 py-3 border-r border-gray-200">
                            <div className="font-medium text-gray-900">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.id} • {emp.category}</div>
                          </td>
                          {[...Array(daysInMonth)].map((_, i) => {
                            const day = i + 1;
                            const status = attendanceData[emp.id]?.[day] || 'A';
                            return (
                              <td key={day} className="px-2 py-3 text-center">
                                <div
                                  className={`w-12 h-12 rounded font-medium text-sm flex justify-center items-center ${getStatusColor(status)}`}
                                >
                                  {status}
                                </div>
                              </td>
                            );
                          })}
                          <td className="sticky right-0 z-30 bg-white px-4 py-3 border-l border-gray-200">
                            <div className="text-xs space-y-1.5 min-w-[100px]">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Present:</span>
                                <span className="font-semibold text-gray-900">{stats.present}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Absent:</span>
                                <span className="font-semibold text-gray-900">{stats.absent}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Leave:</span>
                                <span className="font-semibold text-gray-900">{stats.leave}</span>
                              </div>
                              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold text-gray-900">{stats.total}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceRegister;