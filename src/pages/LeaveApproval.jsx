import React, { useEffect, useState, useContext } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { AuthContext } from "../context/AuthProvider";
import { Search, CalendarDays } from "lucide-react";
import Loader from "../components/Loader";

export default function LeaveApproval() {
  const { user } = useContext(AuthContext);
  const isNonAdmin = user?.role !== "admin";

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMyLeaves, setLoadingMyLeaves] = useState(false);
  const [showMyLeaves, setShowMyLeaves] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLeaveList({ status: "pending" });
      const users = response.data?.data || [];

      if (!Array.isArray(users)) {
        throw new Error("Unexpected API response format");
      }

      const flattenedLeaves = users.flatMap(user => {
        if (!Array.isArray(user.Leaves) || user.Leaves.length === 0) {
          return [];
        }
        return user.Leaves.map((leave) => ({
          ...leave,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
        }));
      });

      setLeaves(flattenedLeaves);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      toast.info("No pending leave requests found");
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeaves = async () => {
    setLoadingMyLeaves(true);
    try {
      const response = await adminApi.getOwnLeave();
      const leaves = response.data?.data?.leave || [];

      setMyLeaves(Array.isArray(leaves) ? leaves : []);
      setShowMyLeaves(true);
    } catch (err) {
      console.error("Error fetching your leaves:", err);
      if (err.response?.status === 404) {
        setMyLeaves([]);
        setShowMyLeaves(true);
      } else {
        toast("No leave records found for you");
        setMyLeaves([]);
      }
    } finally {
      setLoadingMyLeaves(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (row) => {
    try {
      await adminApi.approveLeave({
        leaveID: row.id,
        employee_id: row.user.id,
        status: "approved"
      });
      toast.success("Leave approved");
      fetchLeaves();
    } catch (err) {
      console.error("Approve error:", err.response || err);
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async (row) => {
    try {
      await adminApi.approveLeave({
        leaveID: row.id,
        employee_id: row.user.id,
        status: "rejected"
      });
      toast.success("Leave rejected");
      fetchLeaves();
    } catch (err) {
      console.error("Reject error:", err.response || err);
      toast.error("Failed to reject leave");
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const user = leave.user || {};
    return (
      (user.firstName && user.firstName.toLowerCase().includes(term)) ||
      (user.lastName && user.lastName.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (leave.reason && leave.reason.toLowerCase().includes(term))
    );
  });

  // Shared status renderer for consistency
  const renderStatusBadge = (statusValue) => {
    const status = (statusValue || "pending").toLowerCase();
    let color = "bg-slate-100 text-slate-700";
    let dot = "bg-slate-500";

    if (status === "approved") {
      color = "bg-emerald-100 text-emerald-700";
      dot = "bg-emerald-500";
    } else if (status === "rejected") {
      color = "bg-red-100 text-red-700";
      dot = "bg-red-500";
    } else if (status === "pending") {
      color = "bg-amber-100 text-amber-700";
      dot = "bg-amber-500";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const mainColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => {
        const user = row.user || {};
        const fullName = (user.firstName || "") + " " + (user.lastName || "");
        return <div className="capitalize font-medium text-slate-800">{fullName.trim() || "—"}</div>;
      },
    },
    { key: "email", label: "Email", render: (row) => <div className="break-words max-w-xs text-slate-500">{row.user?.email || "—"}</div> },
    { key: "from_date", label: "From Date", render: (row) => <div className="font-medium text-slate-700">{row.from_date || "—"}</div> },
    { key: "to_date", label: "To Date", render: (row) => <div className="font-medium text-slate-700">{row.to_date || "—"}</div> },
    { key: "reason", label: "Reason", render: (row) => <div className="text-slate-600">{row.reason || "—"}</div> },
    {
      key: "status",
      label: "Status",
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (row.status?.toLowerCase() !== "pending") {
          return <span className="text-slate-400 italic text-sm">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(row)}
              className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              title="Approve Leave"
            >
              <FaCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleReject(row)}
              className="p-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              title="Reject Leave"
            >
              <IoMdClose className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const myLeavesColumns = [
    { key: "from_date", label: "From Date", render: (row) => <div className="font-medium text-slate-700">{row.from_date || "—"}</div> },
    { key: "to_date", label: "To Date", render: (row) => <div className="font-medium text-slate-700">{row.to_date || "—"}</div> },
    { key: "reason", label: "Reason", render: (row) => <div className="text-slate-600">{row.reason || "—"}</div> },
    {
      key: "status",
      label: "Status",
      render: (row) => renderStatusBadge(row.status),
    },
  ];

  const toggleView = () => {
    if (showMyLeaves) {
      setShowMyLeaves(false);
    } else {
      fetchMyLeaves();
    }
  };

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />

      {/* Header Section (STRICTLY ONE LINE) */}
      <div className="flex flex-row items-center justify-between w-full">

        {isNonAdmin && (
          <button
            onClick={toggleView}
            disabled={loadingMyLeaves}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm whitespace-nowrap disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <CalendarDays className="w-4 h-4" />
            {loadingMyLeaves
              ? "Loading..."
              : showMyLeaves
                ? "View Leave Requests"
                : "View Your Leaves"}
          </button>
        )}
      </div>

      {/* Search Bar Container */}
      {!showMyLeaves && (
        <div className="translucent p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by name, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full translucent-inner pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="relative flex-1 translucent rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          {showMyLeaves ? (
            <Table
              columns={myLeavesColumns}
              data={myLeaves}
              keyField="id"
              emptyMessage={myLeaves.length === 0 ? "You have no leave records." : ""}
            />
          ) : (
            <Table
              columns={mainColumns}
              data={filteredLeaves}
              keyField="id"
              emptyMessage="No pending leave requests"
            />
          )}
        </div>

        {/* Loading Overlays */}
        {(loading && !showMyLeaves) && (
          <Loader />
        )}

        {(loadingMyLeaves && showMyLeaves) && (
          <Loader />
        )}
      </div>

    </div>
  );
}