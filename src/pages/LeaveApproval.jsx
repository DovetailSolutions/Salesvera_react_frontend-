import React, { useEffect, useState, useContext } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { AuthContext } from "../context/AuthProvider";

export default function LeaveApproval() {
  const { user } = useContext(AuthContext);
  const isNonAdmin = user?.role !== "admin";

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingMyLeaves, setLoadingMyLeaves] = useState(false);
  const [showMyLeaves, setShowMyLeaves] = useState(false);

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
        return user.Leaves.map(leave => ({
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
      toast.error("Failed to load leave requests");
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
      toast.error("Failed to load your leave records");
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

  const mainColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => {
        const user = row.user || {};
        const fullName = (user.firstName || "") + " " + (user.lastName || "");
        return <div className="capitalize">{fullName.trim() || "—"}</div>;
      },
    },
    { key: "email", label: "Email", render: (row) => <div className="break-words max-w-xs">{row.user?.email || "—"}</div> },
    { key: "from_date", label: "From Date", render: (row) => <div>{row.from_date || "—"}</div> },
    { key: "to_date", label: "To Date", render: (row) => <div>{row.to_date || "—"}</div> },
    { key: "reason", label: "Reason", render: (row) => <div>{row.reason || "—"}</div> },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        let bgColor = "bg-gray-200";
        let textColor = "text-gray-800";
        if (status === "approved") { bgColor = "bg-green-100"; textColor = "text-green-800"; }
        else if (status === "rejected") { bgColor = "bg-red-100"; textColor = "text-red-800"; }
        else if (status === "pending") { bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; }

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (row.status?.toLowerCase() !== "pending") {
          return <span className="text-gray-500 italic">—</span>;
        }
        return (
          <div className="flex gap-2">
            <div
              onClick={() => handleApprove(row)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer"
            >
              <FaCheck />
            </div>
            <div
              onClick={() => handleReject(row)}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 cursor-pointer"
            >
              <IoMdClose />
            </div>
          </div>
        );
      },
    },
  ];

  const myLeavesColumns = [
    { key: "from_date", label: "From Date", render: (row) => <div>{row.from_date || "—"}</div> },
    { key: "to_date", label: "To Date", render: (row) => <div>{row.to_date || "—"}</div> },
    { key: "reason", label: "Reason", render: (row) => <div>{row.reason || "—"}</div> },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        let bgColor = "bg-gray-200";
        let textColor = "text-gray-800";
        if (status === "approved") { bgColor = "bg-green-100"; textColor = "text-green-800"; }
        else if (status === "rejected") { bgColor = "bg-red-100"; textColor = "text-red-800"; }
        else if (status === "pending") { bgColor = "bg-yellow-100"; textColor = "text-yellow-800"; }

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
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
    <div className="py-6 h-screen">
      <Toaster position="top-right" />

      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-semibold">
          {showMyLeaves ? "Your Leave Records" : "Leave Requests"}
        </h1>

        {isNonAdmin && (
          <button
            onClick={toggleView}
            disabled={loadingMyLeaves}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-medium transition disabled:opacity-70"
          >
            {loadingMyLeaves
              ? "Loading..."
              : showMyLeaves
              ? "View Leave Requests"
              : "View Your Leaves"}
          </button>
        )}
      </div>

      {!showMyLeaves && (
        <div className="mb-6 max-w-2xl">
          <input
            type="text"
            placeholder="Search by name, email, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>
      )}

      {/* Render only one table at a time */}
      {showMyLeaves ? (
        <Table
          columns={myLeavesColumns}
          data={myLeaves}
          keyField="id"
          emptyMessage={myLeaves.length === 0 ? "You have no leave records." : ""}
          loading={loadingMyLeaves}
        />
      ) : (
        <Table
          columns={mainColumns}
          data={filteredLeaves}
          keyField="id"
          emptyMessage="No pending leave requests"
          loading={loading}
        />
      )}
    </div>
  );
}