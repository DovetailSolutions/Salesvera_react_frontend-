import React, { useState, useEffect } from 'react';
import { FaDownload, FaFileUpload, FaSearch } from 'react-icons/fa';
import { clientApi, adminApi } from '../api';
import Table from '../components/Table';

const USER_COLUMNS = [
  { key: 'firstName', label: 'First Name', sortable: true },
  { key: 'lastName', label: 'Last Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
];

function ClientBulkUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  // Table-related state
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
      setUploadStatus('error');
      setUploadMessage('No file selected.');
      return;
    }

    setUploadStatus('loading');
    setUploadMessage('Uploading...');

    const formData = new FormData();
    formData.append('csv', selectedFile);

    try {
      await clientApi.bulkUploads(formData);
      setUploadStatus('success');
      setUploadMessage('File uploaded successfully!');
      setSelectedFile(null);
      fetchClients(currentPage, searchTerm);
    } catch (error) {
      setUploadStatus('error');
      const errorMsg =
        error.response?.data?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        'Upload failed. Please try again.';
      setUploadMessage(`Upload failed: ${errorMsg}`);
    }
  };

  const fetchClients = async (page = 1, search = '') => {
    setLoadingClients(true);
    try {
      const response = await adminApi.getAllUsers({ page, limit: pageSize, search });
      const { rows, total } = response.data.data;
      setClients(rows || []);
      setTotalCount(total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setClients([]);
      setTotalCount(0);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients(1, '');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') {
      fetchClients(1, '');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClients(1, searchTerm);
  };

  return (
    <div className="w-full py-4">
      {/* Direct Download Button */}
      <button
        onClick={downloadSampleCSV} // ✅ Direct download, no modal
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-md text-sm hover:bg-blue-700 transition"
      >
        <FaDownload /> Download Sample CSV
      </button>

      {/* File Upload Section */}
      <div className="mt-2 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaFileUpload /> Upload Clients CSV/Excel
        </h3>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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

        {uploadStatus === 'success' && (
          <p className="mt-3 text-green-600 font-medium">{uploadMessage}</p>
        )}
        {uploadStatus === 'error' && (
          <p className="mt-3 text-red-600 font-medium">{uploadMessage}</p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mt-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </form>
      </div>

      {/* User Table */}
      <div className="mt-6">
        {loadingClients ? (
          <div className="text-center py-4 text-gray-500">Loading users...</div>
        ) : totalCount > 0 || searchTerm ? (
          <Table
            columns={USER_COLUMNS}
            data={clients}
            keyField="id"
            emptyMessage="No users found."
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(page) => fetchClients(page, searchTerm)}
            shadow="shadow-md"
          />
        ) : (
          <div className="text-center py-6 text-gray-500">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientBulkUpload;