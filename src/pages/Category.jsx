import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { menuapi } from "../api";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { AuthContext } from "../context/AuthProvider";
import Loader from "../components/Loader";

export default function Category() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === "manager";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tempCategoryName, setTempCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);

  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  const fetchCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (search) params.search = search;

      const res = await menuapi.categoryList(params);
      const data = res.data?.data || res.data || {};

      // DEBUG: Log to verify structure
      console.log("API Response:", data);

      const rows = data.rows || [];
      // Try multiple possible paths for totalItems
      const total =
        data.pagination?.totalItems ||
        data.totalItems ||
        data.total ||
        data.pagination?.total ||
        rows.length;

      setCategories(rows);
      setTotalItems(total);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load categories");
      setCategories([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Always fetch when currentPage OR searchQuery changes
  useEffect(() => {
    fetchCategories(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleAddCategory = async () => {
    const name = tempCategoryName.trim();
    if (!name) {
      toast.error("Please enter a category name");
      return;
    }

    if (isCategoryNameDuplicate(name)) {
      toast.error("A category with this name already exists");
      return;
    }

    const formData = new URLSearchParams();
    formData.append("category_name", name);

    try {
      setLoading(true);
      await menuapi.createCategory(formData);
      toast.success("Category added successfully");
      setIsAddModalOpen(false);
      setTempCategoryName("");
      fetchCategories(currentPage, searchQuery);
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Error adding category");
    } finally {
      setLoading(false);
    }
  };

  const saveInlineEdit = async () => {
    const name = inlineEditValue.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (isCategoryNameDuplicate(name, inlineEditId)) {
      toast.error("A category with this name already exists");
      return;
    }

    const formData = new URLSearchParams();
    formData.append("category_name", name);

    try {
      setLoading(true);
      await menuapi.updateCategory(inlineEditId, formData);
      toast.success("Category updated");
      setInlineEditId(null);
      setInlineEditValue("");
      fetchCategories(currentPage, searchQuery);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("A category with this name already exists");
    } finally {
      setLoading(false);
    }
  };

  const isCategoryNameDuplicate = (name, excludeId = null) => {
    const inputName = name.trim().toLowerCase();
    return categories.some(
      (cat) =>
        cat.category_name.trim().toLowerCase() === inputName &&
        cat.id !== excludeId
    );
  };

  const startInlineEdit = (row) => {
    setInlineEditId(row.id);
    setInlineEditValue(row.category_name);
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineEditValue("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      setLoading(true);
      await menuapi.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories(currentPage, searchQuery);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "category_name",
      label: "Category Name",
      sortable: false,
      render: (row) => {
        if (inlineEditId === row.id) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inlineEditValue}
                onChange={(e) => setInlineEditValue(e.target.value)}
                className="px-2 py-1 border rounded text-sm w-48 focus:outline-none focus:ring focus:ring-blue-200"
                autoFocus
              />
              <button
                onClick={saveInlineEdit}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={cancelInlineEdit}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          );
        }
        return <span>{row.category_name}</span>;
      },
    },
  ];

  const actions = [
    {
      type: "button",
      render: (row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            startInlineEdit(row);
          }}
          className="text-gray-500 hover:text-[var(--primary-green)] p-1.5 rounded transition-colors"
          aria-label="Edit"
        >
          <MdEdit size={18} />
        </div>
      ),
    },
    {
      type: "button",
      render: (row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
          className="text-gray-500 hover:text-red-500 p-1.5 rounded transition-colors"
          aria-label="Delete"
        >
          <MdDelete size={18} />
        </div>
      ),
    },
  ];

  return (
    <div className="py-2 relative h-screen">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-semibold mb-6">Category Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        {!isManager && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ml-4"
          >
            + Add New Category
          </button>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            <input
              type="text"
              value={tempCategoryName}
              onChange={(e) => setTempCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setTempCategoryName("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={categories}
        actions={isManager ? [] : actions}
        keyField="id"
        emptyMessage="No categories found"
        shadow="shadow-md"
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalItems}
        onPageChange={setCurrentPage}
      />

      {loading && <Loader />}
    </div>
  );
}
