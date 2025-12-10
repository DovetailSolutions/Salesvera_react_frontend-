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
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
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

const StatCard = ({ title, value, change, icon: Icon, subtext }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{subtext}</span>
          <span
            className={`text-xs ${
              change >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-blue-500" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen py-2">
      <div className="mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          Visual KPI Overview
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value="1250"
            change={4.5}
            icon={Users}
            subtext="First meeting: 120"
          />
          <StatCard
            title="Total Meetings"
            value="$1.2k"
            change={6.3}
            icon={Calendar}
            subtext="Total decrease: 12%"
          />
          <StatCard
            title="Conversion Rate"
            value="$1.5K"
            change={7.8}
            icon={TrendingUp}
            subtext="Total Increase: 10%"
          />
        </div>

        {/* Visual Analytics */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Visual Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Sales Revenue
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Meeting Trends */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Meeting Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={meetingTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="series1"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="series2"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="series3"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Distribution
            </h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {revenueDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Meetings & Events */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Meetings & Events
            </h3>
            <div className="mb-4">
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
                {Array.from({ length: 35 }, (_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded flex items-center justify-center text-xs ${
                      i === 20
                        ? "bg-blue-500 text-white font-semibold"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < 5 ? "" : i - 4}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">July 10: Client A Demo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Sales Demo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">July 12: Planning</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Reports / Audit Logs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Reports / Audit Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Sr. No
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Report Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Generated By
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.type}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.generatedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-500 hover:text-blue-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Filter by Type
            </button>
            <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Download All CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
