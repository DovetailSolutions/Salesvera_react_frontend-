import React, { useState, useEffect, useContext } from "react";
import { FaDownload, FaFileUpload, FaSearch, FaTimes } from "react-icons/fa";
import { clientApi, meetingApi } from "../api";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
import Loader from "../components/Loader";
import FormModal from "../components/FormModal";

const MEETING_COLUMNS = [
  { key: "id", label: "Meeting ID", sortable: true },
  { key: "companyName", label: "Company", sortable: true },
  { key: "personName", label: "Contact Person", sortable: true },
  { key: "mobileNumber", label: "Mobile", sortable: true },
  { key: "companyEmail", label: "Email", sortable: true },
];

// Inside ClientBulkUpload function, after useState declarations:
const clientFields = [
  {
    name: "companyName",
    label: "Company Name",
    required: true,
    placeholder: "e.g., Arena",
  },
  {
    name: "personName",
    label: "Contact Person",
    required: true,
    placeholder: "e.g., Ankit",
  },
  {
    name: "mobileNumber",
    label: "Mobile Number",
    required: true,
    placeholder: "e.g., 7875345632",
  },
  {
    name: "companyEmail",
    label: "Company Email",
    type: "email",
    required: true,
    placeholder: "e.g., arena@gmail.com",
  },
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
  const [newClient, setNewClient] = useState({
    companyName: "",
    personName: "",
    mobileNumber: "",
    companyEmail: "",
  });

  const sampleCSV = `companyName,personName,mobileNumber,companyEmail
dovetail,vishu,9988855444,dovetail@gmail.com
bohobliss,anuj,8866234555,bohobliss@gmail.com
arena,ankit,7875345632,arena@gmail.com`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client_sample_upload.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(()=>{
    window.scrollTo(0,0);
  },[])

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
    const { companyName, personName, mobileNumber, companyEmail } = newClient;

    if (!companyName || !personName || !mobileNumber || !companyEmail) {
      Toast.error("Please fill all fields.");
      return;
    }

    // Basic mobile validation (10-15 digits)
    if (!/^\d{10,15}$/.test(mobileNumber)) {
      Toast.error("Please enter a valid mobile number (10–15 digits).");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      Toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const response = await clientApi.createClient(newClient);
      if (response.data?.success) {
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
    setNewClient({
      companyName: "",
      personName: "",
      mobileNumber: "",
      companyEmail: "",
    });
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

  return (
    <div className="w-full py-2 h-screen">
      <h1 className="text-3xl font-semibold mb-6">Client Management</h1>

      {!isManager && (
        <div className="flex justify-between items-center w-full mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition"
            >
              <FaDownload /> Download Sample CSV
            </button>

            {!isManager && (
              <>
                <button
                  onClick={() => setBulkUpload(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition"
                >
                  <FaFileUpload /> Bulk Upload
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded flex items-center gap-1"
          >
            + Add Client
          </button>
        </div>
      )}

{/*Bulk Upload Popup*/}
{!isManager && bulkUpload && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={() => setBulkUpload(false)} // close on outside click
  >
    <div
      className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 relative"
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FaFileUpload className="text-blue-600" />
          Upload Clients CSV/Excel
        </h2>
        <button
          onClick={() => setBulkUpload(false)}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 file:cursor-pointer"
          />
        </div>

        {selectedFile && (
          <p className="text-sm text-gray-600 mb-3">
            Selected: <span className="font-medium">{selectedFile.name}</span>
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadStatus === "loading"}
          className={`w-full py-2.5 px-4 rounded-md text-white font-medium text-sm flex items-center justify-center gap-2 ${
            uploadStatus === "loading"
              ? "bg-gray-400 cursor-not-allowed"
              : selectedFile
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {uploadStatus === "loading" ? "Uploading..." : "Upload File"}
        </button>
      </div>
    </div>
  </div>
)}

      <div className="mt-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search meetings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </form>
      </div>

      <div className="mt-6">
        {loadingMeetings ? (
          <Loader />
        ) : meetings.length > 0 ? (
          <Table
            columns={MEETING_COLUMNS.map((col) => ({
              ...col,
              render: undefined,
            }))}
            data={meetings}
            keyField="id"
            emptyMessage="No meetings found."
            shadow="shadow-md"
          />
        ) : (
          <div className="text-center py-6 text-gray-500">
            No meetings found.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
<FormModal
  isOpen={isAddClientModalOpen}
  onClose={() => {
    setIsAddClientModalOpen(false);
    resetClientForm();
  }}
  title="Add New Client"
  fields={clientFields}
  values={newClient}
  onChange={handleClientInputChange}
  onSubmit={handleAddClient}
  submitLabel="Add Client"
/>
    </div>
  );
}

export default ClientBulkUpload;
