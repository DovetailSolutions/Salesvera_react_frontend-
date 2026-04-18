import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, Minus } from "lucide-react";

const salesData = [
  { month: "Jan", revenue: 48 },
  { month: "Feb", revenue: 62 },
  { month: "Mar", revenue: 75 },
  { month: "Apr", revenue: 70 },
  { month: "May", revenue: 92 },
  { month: "Jun", revenue: 105 },
];

const meetingTrendsData = [
  { week: "W1", meetings: 18 },
  { week: "W2", meetings: 24 },
  { week: "W3", meetings: 20 },
  { week: "W4", meetings: 32 },
  { week: "W5", meetings: 28 },
  { week: "W6", meetings: 37 },
];

const recentActivity = [
  {
    id: 1,
    title: "Enterprise deal progressed",
    desc: "Nexa Health moved to negotiation stage.",
    time: "12 min ago",
  },
  {
    id: 2,
    title: "Attendance synced",
    desc: "Marketing team check-ins updated automatically.",
    time: "42 min ago",
  },
  {
    id: 3,
    title: "Expense approved",
    desc: "Travel reimbursement for Jordan was approved.",
    time: "1 hr ago",
  },
  {
    id: 4,
    title: "Meeting booked",
    desc: "Strategy review added for Olivia and client.",
    time: "3 hr ago",
  },
];

// Custom Tooltip built with Tailwind to respect light/dark classes naturally
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1E2333] border border-slate-200 dark:border-[#334155] rounded-lg p-3 shadow-lg">
        <p className="text-slate-600 dark:text-[#F8FAFC] text-xs font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-slate-800 dark:text-white text-sm font-bold">
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subtext, subtextColorLight, subtextColorDark, icon: Icon, iconBgLight, iconBgDark }) => (
  <div className="bg-white dark:bg-transparent rounded-2xl p-5 shadow-sm dark:shadow-lg border border-slate-100 dark:border-white/5 flex flex-col justify-between h-full transition-colors duration-200">
    <div className="flex justify-between items-start mb-4">
      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{title}</p>
      <div className={`p-2 rounded-full ${iconBgLight} dark:${iconBgDark} bg-opacity-20 dark:bg-opacity-20 flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{value}</h3>
      <p className={`text-xs font-medium ${subtextColorLight} dark:${subtextColorDark}`}>{subtext}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Revenue"
            value="$182.4K"
            subtext="+12.8% vs last month"
            subtextColorLight="text-emerald-600"
            subtextColorDark="text-emerald-400"
            icon={ArrowUpRight}
            iconBgLight="bg-blue-100"
            iconBgDark="bg-blue-500"
          />
          <StatCard
            title="Active Clients"
            value="1,284"
            subtext="+84 new accounts"
            subtextColorLight="text-emerald-600"
            subtextColorDark="text-emerald-400"
            icon={ArrowUpRight}
            iconBgLight="bg-blue-100"
            iconBgDark="bg-blue-500"
          />
          <StatCard
            title="Meetings Booked"
            value="368"
            subtext="+9.2% conversion uplift"
            subtextColorLight="text-emerald-600"
            subtextColorDark="text-emerald-400"
            icon={ArrowUpRight}
            iconBgLight="bg-blue-100"
            iconBgDark="bg-blue-500"
          />
          <StatCard
            title="Pending Approvals"
            value="17"
            subtext="3 require action today"
            subtextColorLight="text-amber-600"
            subtextColorDark="text-amber-400"
            icon={Minus}
            iconBgLight="bg-slate-100"
            iconBgDark="bg-slate-700"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Sales Performance Chart */}
          <div className="bg-white dark:bg-transparent rounded-2xl p-6 border border-slate-100 dark:border-white/5 transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sales Performance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 mt-1">Monthly revenue against target</p>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  {/* Note: In a real app, you might need to sync Recharts axes colors with context, but keeping a neutral gray works for both themes */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 120]}
                    ticks={[0, 30, 60, 90, 120]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#94a3b8', opacity: 0.1 }} />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meeting Momentum Chart */}
          <div className="bg-white dark:bg-transparent rounded-2xl p-6 border border-slate-100 dark:border-white/5 transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Meeting Momentum</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 mt-1">Weekly team meeting trend</p>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={meetingTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 36]}
                    ticks={[0, 9, 18, 27, 36]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="meetings"
                    stroke="#A855F7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#A855F7", strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Calendar Widget */}
          <div className="bg-white dark:bg-transparent rounded-2xl p-6 border border-slate-100 dark:border-white/5 lg:col-span-1 transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">April 2026</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-1">Upcoming team timeline</p>

            <div className="grid grid-cols-7 gap-y-3 mb-6">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const isSelected = day === 7;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-sm w-8 h-8 mx-auto rounded-lg transition-colors ${isSelected
                      ? "bg-indigo-500 text-white font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                      }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-white dark:bg-transparent rounded-xl p-4 border border-slate-100 dark:border-white/5 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Today's Focus</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">4 PM product demo with Nova Retail</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-transparent rounded-2xl p-6 border border-slate-100 dark:border-white/5 lg:col-span-2 transition-colors duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 mt-1">Live operational updates from across the workspace</p>

            <div className="flex flex-col gap-6 mt-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{activity.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{activity.desc}</p>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;