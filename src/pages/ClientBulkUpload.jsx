import React, { useState, useEffect, useContext } from "react";
import { Download, UploadCloud, Search, X, Plus, Users } from "lucide-react";
import { clientApi, meetingApi } from "../api";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
import Loader from "../components/Loader";
import FormModal from "../components/FormModal";
import CreateClientModal from "../components/CreateClientModal";

const MEETING_COLUMNS = [
  { key: "id", label: "Client ID", sortable: true },
  { key: "name", label: "Client Name", sortable: true },
  { key: "mobile", label: "Mobile", sortable: true },
  { key: "email", label: "Email", sortable: true },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    render: (val) => new Date(val).toLocaleDateString()
  },
];

// Updated to include all fields from the new API payload
const clientFields = [
  { name: "name", label: "Client Name", required: true, placeholder: "e.g., Ankit" },
  { name: "mobile", label: "Mobile Number", required: false, placeholder: "e.g., 7875345632" },
  { name: "email", label: "Email", type: "email", required: false, placeholder: "e.g., ankit@gmail.com" },
  { name: "companyName", label: "Company Name", required: false, placeholder: "e.g., SkyTech Pvt Ltd" },
  { name: "customerType", label: "Customer Type", required: false, placeholder: "e.g., Business" },
  { name: "status", label: "Status", required: false, placeholder: "e.g., accepted/draft" },
  { name: "address", label: "Address", required: false, placeholder: "e.g., 123 Main St" },
  { name: "city", label: "City", required: false, placeholder: "e.g., Chandigarh" },
  { name: "state", label: "State", required: false, placeholder: "e.g., Punjab" },
  { name: "country", label: "Country", required: false, placeholder: "e.g., India" },
  { name: "pincode", label: "Pincode", required: false, placeholder: "e.g., 140001" },
  { name: "gstNumber", label: "GST Number", required: false, placeholder: "e.g., 22AAAAA1283A1Z5" },
  { name: "panNumber", label: "PAN Number", required: false, placeholder: "e.g., AAAAA1283A" },
];

const transformMeetingForDisplay = (meeting) => {
  const transformed = {};
  for (const col of MEETING_COLUMNS) {
    const rawValue = meeting[col.key];
    if (col.render) {
      transformed[col.key] = col.render(rawValue);
    } else {
      transformed[col.key] = rawValue != null ? String(rawValue) : "—";
    }
  }
  return transformed;
};

// Initial state extracted for easier resetting
const initialClientState = {
  name: "",
  email: "",
  mobile: "",
  companyName: "",
  customerType: "Business", // Defaulted based on payload
  state: "",
  city: "",
  pincode: "",
  status: "draft",       // Defaulted based on payload
  country: "India",         // Defaulted based on payload
  address: "",
  gstNumber: "",
  panNumber: ""
};

function ClientBulkUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [bulkUpload, setBulkUpload] = useState(false);

  const { user } = useContext(AuthContext);
  const isManager = user.role === "manager";

  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState(initialClientState);

  const sampleCSV = `name,mobile,email
dovetail,9988855444,dovetail@gmail.com
bohobliss,8866234555,bohobliss@gmail.com
arena,7875345632,arena@gmail.com`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client_sample_upload.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!validTypes.includes(file.type)) {
        setUploadStatus("error");
        setUploadMessage("Please upload a valid CSV or Excel file.");
        return;
      }
      setSelectedFile(file);
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Toast.error("No file selected.");
      return;
    }

    setUploadStatus("loading");

    const formData = new FormData();
    formData.append("csv", selectedFile);

    try {
      const response = await clientApi.bulkUploads(formData);
      const resData = response.data;

      if (resData?.success) {
        Toast.success(resData.message || "Bulk upload successful!");
        const {
          totalCSV = 0,
          inserted = 0,
          duplicatesSkipped = 0,
        } = resData.data || {};
        if (duplicatesSkipped > 0 || totalCSV !== inserted) {
          const detailMessage = `${totalCSV} record(s) processed. ${inserted} added, ${duplicatesSkipped} duplicates skipped.`;
          Toast.info(detailMessage);
        }

        setBulkUpload(false);
      } else {
        const errorMsg = resData?.message || "Upload failed.";
        Toast.error(errorMsg);
      }

      setSelectedFile(null);
      setUploadStatus(null);
      fetchMeetings(searchTerm, false);
    } catch (error) {
      const errorMsg =
        error.response?.data?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        "Upload failed. Please try again.";
      Toast.error(`Upload failed: ${errorMsg}`);
      setUploadStatus("error");
    }
  };

  const handleAddClient = async () => {
    const { name, mobile, email } = newClient;

    // Adjusted validation: Only Name is strictly required, others are optional but validated if provided
    if (!name) {
      Toast.error("Client Name is required.");
      return;
    }

    if (mobile && !/^\d{10,15}$/.test(mobile)) {
      Toast.error("Please enter a valid mobile number (10–15 digits).");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const response = await clientApi.createClient(newClient);
      if (response.data?.success || response.status === 200 || response.status === 201) {
        Toast.success("Client added successfully!");
        setIsAddClientModalOpen(false);
        resetClientForm();
        fetchMeetings(searchTerm, false);
      } else {
        Toast.error(response.data?.message || "Failed to add client.");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add client. Please try again.";
      Toast.error(`Error: ${errorMsg}`);
    }
  };

  const resetClientForm = () => {
    setNewClient(initialClientState);
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const fetchMeetings = async (search = "", showLoader = true) => {
    if (showLoader) setLoadingMeetings(true);

    try {
      const response = await meetingApi.getUserMeetings({
        empty: true,
        search: search || undefined,
      });

      const result = response.data;
      if (result?.success && Array.isArray(result.data?.rows)) {
        const displayMeetings = result.data.rows.map(transformMeetingForDisplay);
        setMeetings(displayMeetings);
        setTotalCount(result.data.total);
      } else {
        setMeetings([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      setMeetings([]);
      setTotalCount(0);
    } finally {
      if (showLoader) setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings("");
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === "") {
      fetchMeetings("");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeetings(searchTerm);
  };

  const columns = MEETING_COLUMNS.map((col) => ({
    ...col,
    render: (row) => (
      <div className={`text-sm ${col.key === 'name' ? 'font-medium text capitalize' : 'text'}`}>
        {row[col.key] || "—"}
      </div>
    ),
  }));

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">

      {/* Header Section */}
      <div className="translucent p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, email..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full translucent-inner rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:translucent transition-all"
          />
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          {!isManager && (
            <div className="flex flex-wrap items-center gap-3 justify-end w-full">
              <button
                onClick={downloadSampleCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 translucent border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <Download className="w-4 h-4" />
                Sample CSV
              </button>

              <button
                onClick={() => setBulkUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 translucent border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <UploadCloud className="w-4 h-4" />
                Bulk Upload
              </button>

              <div
                onClick={() => setIsAddClientModalOpen(true)}
                className="inline-flex translucent-inner items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="relative flex-1 translucent rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <Table
            columns={columns}
            data={meetings}
            keyField="id"
            emptyMessage={loadingMeetings ? "Loading..." : "No meetings found."}
          />
        </div>

        {loadingMeetings && (
          <Loader />
        )}
      </div>

      {/* Bulk Upload Modal */}
      {!isManager && bulkUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center theblur p-4 animate-in fade-in duration-200"
          onClick={() => setBulkUpload(false)}
        >
          <div
            className="popup-card rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 flex justify-between items-center custom-border-bottom border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-500" />
                  Bulk Upload Clients
                </h3>
              </div>
              <button
                onClick={() => setBulkUpload(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* File Input Area */}
              <div className="w-full">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedFile ? "border-blue-400 bg-blue-50/50" : "border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className={`w-8 h-8 mb-2 ${selectedFile ? "text-blue-500" : "text-slate-400"}`} />
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-1 text-sm text-slate-600 font-medium"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">CSV, XLS, XLSX</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {uploadMessage && uploadStatus === "error" && (
                <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                  {uploadMessage}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === "loading"}
                className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${uploadStatus === "loading" || !selectedFile
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/30"
                  }`}
              >
                {uploadStatus === "loading" ? (
                  <>
                    <Loader />
                    Processing File...
                  </>
                ) : (
                  "Upload Clients"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <CreateClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSuccess={() => fetchMeetings(searchTerm, false)}
      />
    </div>
  );
}

export default ClientBulkUpload;