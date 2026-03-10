import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  DollarSign, // Note: You imported this but didn't use it in your snippet, kept it just in case!
  TrendingUp,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

const salesData = [
  { month: "Jan", revenue: 15 },
  { month: "Feb", revenue: 25 },
  { month: "Mar", revenue: 20 },
  { month: "Apr", revenue: 80 },
  { month: "May", revenue: 65 },
  { month: "Jun", revenue: 100 },
  { month: "Jul", revenue: 85 },
  { month: "Aug", revenue: 75 },
  { month: "Sep", revenue: 90 },
  { month: "Oct", revenue: 55 },
  { month: "Nov", revenue: 45 },
  { month: "Dec", revenue: 35 },
];

const meetingTrendsData = [
  { month: "Jan", series1: 20, series2: 30, series3: 10 },
  { month: "Feb", series1: 40, series2: 50, series3: 25 },
  { month: "Mar", series1: 60, series2: 40, series3: 45 },
  { month: "Apr", series1: 50, series2: 70, series3: 40 },
  { month: "May", series1: 80, series2: 60, series3: 70 },
  { month: "Jun", series1: 100, series2: 90, series3: 85 },
  { month: "Jul", series1: 120, series2: 100, series3: 95 },
  { month: "Aug", series1: 110, series2: 115, series3: 105 },
  { month: "Sep", series1: 140, series2: 130, series3: 125 },
  { month: "Oct", series1: 160, series2: 150, series3: 145 },
  { month: "Nov", series1: 180, series2: 165, series3: 170 },
  { month: "Dec", series1: 200, series2: 185, series3: 190 },
];

const revenueDistribution = [
  { name: "In-person Sales", value: 65, color: "#3B82F6" },
  { name: "Online Sales", value: 35, color: "#10B981" },
];

const auditLogs = [
  {
    id: 1,
    type: "Monthly Data",
    generatedBy: "Admin-08",
    date: "09-10-2025",
    status: "Completed",
    action: "Download",
  },
  {
    id: 2,
    type: "Monthly Data",
    generatedBy: "Admin-08",
    date: "09-10-2025",
    status: "Completed",
    action: "Download",
  },
  {
    id: 3,
    type: "Monthly Data",
    generatedBy: "Admin-08",
    date: "09-10-2025",
    status: "Completed",
    action: "Download",
  },
  {
    id: 4,
    type: "Monthly Data",
    generatedBy: "Admin-08",
    date: "09-10-2025",
    status: "Completed",
    action: "Download",
  },
];

// Reusable Recharts Tooltip Style
const customTooltipStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #f1f5f9',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  padding: '12px',
  fontSize: '13px',
  color: '#334155'
};

const StatCard = ({ title, value, change, icon: Icon, subtext }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 font-medium text-sm mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{value}</h3>
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
              change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-xs font-medium text-slate-400">{subtext}</span>
        </div>
      </div>
      <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-100/50">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="py-2 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          Visual KPI Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Monitor your key performance metrics and business growth.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="1,250"
          change={4.5}
          icon={Users}
          subtext="First meeting: 120"
        />
        <StatCard
          title="Total Meetings"
          value="$1.2k"
          change={-12.0} // Changed to negative to showcase the red pill UI based on your subtext
          icon={Calendar}
          subtext="Total decrease: 12%"
        />
        <StatCard
          title="Conversion Rate"
          value="$1.5k"
          change={7.8}
          icon={TrendingUp}
          subtext="Total Increase: 10%"
        />
      </div>

      {/* Visual Analytics */}
      <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-5 mt-10 border-b border-slate-200 pb-2">
        Visual Analytics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Sales Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-6">
            Monthly Sales Revenue
          </h3>
          <div className="-ml-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meeting Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-6">
            Meeting Trends
          </h3>
          <div className="-ml-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={meetingTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip contentStyle={customTooltipStyle} />
                <Line type="monotone" dataKey="series1" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="series2" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="series3" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Revenue Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-2">
            Revenue Distribution
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} itemStyle={{ fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-2">
              {revenueDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-md shadow-sm"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-semibold text-slate-600">
                    {item.name} <span className="text-slate-400 font-medium ml-1">({item.value}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings & Events */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-6">
            Upcoming Meetings & Events
          </h3>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Calendar Widget */}
            <div className="flex-1 max-w-[280px]">
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                  <div key={i} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 35 }, (_, i) => {
                  const dayNum = i - 4;
                  const isValidDay = i >= 5 && dayNum <= 30;
                  const isToday = dayNum === 10; // Hardcoded active day based on your snippet
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                        !isValidDay 
                          ? "text-transparent" 
                          : isToday
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer border border-slate-100"
                      }`}
                    >
                      {isValidDay ? dayNum : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event List */}
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="mt-1 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Client A Demo</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">July 10, 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="mt-1 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Sales Demo</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">July 10, 2:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="mt-1 w-2.5 h-2.5 bg-purple-500 rounded-full shadow-sm"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Weekly Planning</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">July 12, 9:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Reports / Audit Logs */}
      <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-5 mt-10 border-b border-slate-200 pb-2">
        Administration
      </h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800">
            System Reports & Audit Logs
          </h3>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
              <Filter className="w-4 h-4" />
              Filter Logs
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Sr. No</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Report Type</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Generated By</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-4 px-6 text-sm font-semibold text-slate-700">
                    #{log.id.toString().padStart(3, '0')}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-800">
                    {log.type}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {log.generatedBy.substring(0,2).toUpperCase()}
                      </div>
                      {log.generatedBy}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    {log.date}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-700">
                    {log.action}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none">
                      <Download className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;