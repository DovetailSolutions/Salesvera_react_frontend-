import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { menuapi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import Loader from "../components/Loader";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  FolderTree 
} from "lucide-react";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      // ✅ Do NOT set global loading here
      await menuapi.createCategory(formData);
      toast.success("Category added successfully");
      setIsAddModalOpen(false);
      setTempCategoryName("");
      // ✅ Refetch without showing full-page loader
      await fetchCategories(currentPage, searchQuery);
    } catch (err) {
      console.error("Add error:", err);
      toast.error("Error adding category");
    }
    // ❌ Remove finally setLoading(false)
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
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <input
                type="text"
                value={inlineEditValue}
                onChange={(e) => setInlineEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveInlineEdit();
                  if (e.key === "Escape") cancelInlineEdit();
                }}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm w-48 sm:w-64 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                autoFocus
              />
              <button
                onClick={saveInlineEdit}
                className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelInlineEdit}
                className="p-1.5 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return <span className="font-medium text-slate-800">{row.category_name}</span>;
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
          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          aria-label="Edit"
          title="Edit Category"
        >
          <Edit2 className="w-4.5 h-4.5" />
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
          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          aria-label="Delete"
          title="Delete Category"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </div>
      ),
    },
  ];

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium hidden sm:block">
            Organize and manage your product categories.
          </p>
        </div>

        {!isManager && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Search Bar Container */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Table Area */}
      <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <Table
            columns={columns}
            data={categories}
            actions={isManager ? [] : actions}
            keyField="id"
            emptyMessage="No categories found"
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalItems}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Loader /> <span className="text-sm font-semibold text-slate-600">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-500" />
                  Add New Category
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setTempCategoryName("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tempCategoryName}
                onChange={(e) => setTempCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                }}
                placeholder="e.g., Enterprise Software"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all mb-6"
                autoFocus
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setTempCategoryName("");
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={loading || !tempCategoryName.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  Create Category
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}