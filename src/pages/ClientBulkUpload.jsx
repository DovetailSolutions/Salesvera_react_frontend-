import React, { useState, useEffect, useContext } from 'react';
import { FaDownload, FaFileUpload, FaSearch, FaTimes } from 'react-icons/fa';
import { clientApi, meetingApi } from '../api';
import Table from '../components/Table';
import Toast from "../components/Toast";
import { AuthContext } from '../context/AuthProvider'; 

const MEETING_COLUMNS = [
  { key: 'id', label: 'Meeting ID', sortable: true },
  { key: 'companyName', label: 'Company', sortable: true },
  { key: 'personName', label: 'Contact Person', sortable: true },
  { key: 'mobileNumber', label: 'Mobile', sortable: true },
  { key: 'companyEmail', label: 'Email', sortable: true },
];

const transformMeetingForDisplay = (meeting) => {
  const transformed = {};
  for (const col of MEETING_COLUMNS) {
    const rawValue = meeting[col.key];
    if (col.render) {
      transformed[col.key] = col.render(rawValue);
    } else {
      transformed[col.key] = rawValue != null ? String(rawValue) : '—';
    }
  }
  return transformed;
};

function ClientBulkUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const { user } = useContext(AuthContext); 
  const isManager = user.role === "manager";

  const [meetings, setMeetings] = useState([]); 
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // ✨ Add Client Modal State
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    companyName: '',
    personName: '',
    mobileNumber: '',
    companyEmail: '',
  });

  const sampleCSV = `companyName,personName,mobileNumber,companyEmail
dovetail,vishu,9988855444,dovetail@gmail.com
bohobliss,anuj,8866234555,bohobliss@gmail.com
arena,ankit,7875345632,arena@gmail.com`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client_sample_upload.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!validTypes.includes(file.type)) {
        setUploadStatus('error');
        setUploadMessage('Please upload a valid CSV or Excel file.');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Toast.error('No file selected.');
      return;
    }

    setUploadStatus('loading');

    const formData = new FormData();
    formData.append('csv', selectedFile);

    try {
      const response = await clientApi.bulkUploads(formData);
      const resData = response.data;

      if (resData?.success) {
        Toast.success(resData.message || 'Bulk upload successful!');
        const { totalCSV = 0, inserted = 0, duplicatesSkipped = 0 } = resData.data || {};
        if (duplicatesSkipped > 0 || totalCSV !== inserted) {
          const detailMessage = `${totalCSV} record(s) processed. ${inserted} added, ${duplicatesSkipped} duplicates skipped.`;
          Toast.info(detailMessage);
        }
      } else {
        const errorMsg = resData?.message || 'Upload failed.';
        Toast.error(errorMsg);
      }

      setSelectedFile(null);
      setUploadStatus(null);
      fetchMeetings(searchTerm);

    } catch (error) {
      const errorMsg =
        error.response?.data?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        'Upload failed. Please try again.';
      Toast.error(`Upload failed: ${errorMsg}`);
      setUploadStatus('error');
    }
  };

  // ✨ Handle Add Single Client
  const handleAddClient = async () => {
    const { companyName, personName, mobileNumber, companyEmail } = newClient;

    if (!companyName || !personName || !mobileNumber || !companyEmail) {
      Toast.error('Please fill all fields.');
      return;
    }

    // Basic mobile validation (10-15 digits)
    if (!/^\d{10,15}$/.test(mobileNumber)) {
      Toast.error('Please enter a valid mobile number (10–15 digits).');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      Toast.error('Please enter a valid email address.');
      return;
    }

    try {
      const response = await clientApi.createClient(newClient);
      if (response.data?.success) {
        Toast.success('Client added successfully!');
        setIsAddClientModalOpen(false);
        resetClientForm();
        fetchMeetings(searchTerm); // refresh list
      } else {
        Toast.error(response.data?.message || 'Failed to add client.');
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to add client. Please try again.';
      Toast.error(`Error: ${errorMsg}`);
    }
  };

  const resetClientForm = () => {
    setNewClient({
      companyName: '',
      personName: '',
      mobileNumber: '',
      companyEmail: '',
    });
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const fetchMeetings = async (search = '') => {
    setLoadingMeetings(true);
    try {
      const response = await meetingApi.getUserMeetings({ 
        empty: true,
        search: search || undefined
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
      console.error('Failed to fetch meetings:', error);
      setMeetings([]);
      setTotalCount(0);
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings('');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') {
      fetchMeetings('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeetings(searchTerm);
  };

  return (
    <div className="w-full py-6 h-screen">
      <h1 className="text-3xl font-semibold mb-6">Client Management</h1>
      
      {!isManager && (
        <div className='flex justify-between items-center w-full mb-6'>
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition"
          >
            <FaDownload /> Download Sample CSV
          </button>
          
          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded flex items-center gap-1"
          >
            + Add Client
          </button>
        </div>
      )}

      {!isManager && (
        <div className="mt-2 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaFileUpload /> Upload Clients CSV/Excel
          </h3>

          <div className="mb-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
            />
          </div>

          {selectedFile && (
            <p className="text-sm text-gray-600 mb-3">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === 'loading'}
            className={`w-full py-2.5 px-4 rounded-md text-white font-medium text-sm flex items-center justify-center gap-2 ${
              uploadStatus === 'loading'
                ? 'bg-gray-400 cursor-not-allowed'
                : selectedFile
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {uploadStatus === 'loading' ? 'Uploading...' : 'Upload File'}
          </button>
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
          <div className="text-center py-4 text-gray-500">Loading meetings...</div>
        ) : meetings.length > 0 ? (
          <Table
            columns={MEETING_COLUMNS.map(col => ({
              ...col,
              render: undefined 
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

{isAddClientModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-bold">Add New Client</h2>
        <button
          onClick={() => {
            setIsAddClientModalOpen(false);
            resetClientForm();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            name="companyName"
            value={newClient.companyName}
            onChange={handleClientInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="e.g., Arena"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person *
          </label>
          <input
            type="text"
            name="personName"
            value={newClient.personName}
            onChange={handleClientInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="e.g., Ankit"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number *
          </label>
          <input
            type="text"
            name="mobileNumber"
            value={newClient.mobileNumber}
            onChange={handleClientInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="e.g., 7875345632"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Email *
          </label>
          <input
            type="email"
            name="companyEmail"
            value={newClient.companyEmail}
            onChange={handleClientInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="e.g., arena@gmail.com"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 p-4">
        <button
          type="button"
          onClick={() => {
            setIsAddClientModalOpen(false);
            resetClientForm();
          }}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAddClient}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Client
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default ClientBulkUpload;