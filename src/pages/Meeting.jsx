import React, { useEffect, useState } from "react";
import { meetingApi } from "../api";
import Table from "../components/Table";
import Toast from "../components/Toast";

export default function Meeting() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    userId: "",
    date: "",
    search: "",
  });

  // ✅ Fetch meetings list
  const fetchMeetings = async (page = 1) => {
    try {
      setLoading(true);
      const res = await meetingApi.getUserMeetings({
        userId: filters.userId,
        date: filters.date,
        search: filters.search,
        page,
      });

      const data = res.data?.data || {};
      const rows = data.rows || data || [];

      setMeetings(rows);
      setPagination({
        currentPage: data.pagination?.currentPage || 1,
        totalItems: data.pagination?.totalItems || rows.length || 0,
        totalPages: data.pagination?.totalPages || 1,
        limit: data.pagination?.limit || 10,
      });
    } catch (err) {
      console.error(err);
      Toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (filters.search.trim() !== "" || filters.date || filters.userId) {
        fetchMeetings(1);
      } else if (filters.search.trim() === "") {
        fetchMeetings(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [filters.search, filters.date, filters.userId]);

  const columns = [
    { key: "companyName", label: "Company" },
    { key: "personName", label: "Person" },
    { key: "mobileNumber", label: "Mobile" },
    { key: "meetingPurpose", label: "Purpose" },
    {
      key: "meetingTimeIn",
      label: "Meeting Time IN",
      render: (row) =>
        row.meetingTimeIn
          ? new Date(row.meetingTimeIn).toLocaleString()
          : "—",
    },
    {
      key: "meetingTimeOut",
      label: "Meeting Time Out",
      render: (row) =>
        row.meetingTimeOut
          ? new Date(row.meetingTimeOut).toLocaleString()
          : "—",
    },
  ];

  return (
    <div className="mx-auto py-4">
   

      {/* ✅ Filters Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 w-full">
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="custom-border rounded px-3 py-2 w-full"
        />
        <input
          type="number"
          placeholder="User ID"
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          className="custom-border rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="custom-border rounded px-3 py-2 w-full"
        />
        <button
          onClick={() => fetchMeetings(1)}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 widthfull"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* ✅ Table */}
      <Table
        columns={columns}
        data={meetings}
        keyField="id"
        emptyMessage="No meetings found"
        currentPage={pagination.currentPage}
        pageSize={pagination.limit}
        totalCount={pagination.totalItems}
        onPageChange={(page) => fetchMeetings(page)}
        shadow="shadow-md"
      />

      {loading && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          Loading...
        </div>
      )}
    </div>
  );
}
