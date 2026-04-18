import React, { useContext, useEffect, useState, useRef } from "react";
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
  FolderTree,
  Layers,
  IndianRupee,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Percent,
} from "lucide-react";

// ─── Inline confirm dialog (replaces window.confirm) ───────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="popup-card custom-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-red-500/10 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Are you sure?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 translucent-inner custom-border rounded-xl hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-item row ──────────────────────────────────────────────────────────
function SubItem({ sub, index, isNew, onEdit, isEditing }) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group custom-border translucent-inner
        ${isNew ? "ring-2 ring-indigo-500/50" : ""}
        ${isEditing ? "ring-2 ring-brandBlue" : "hover:border-slate-300 dark:hover:border-slate-600"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEditing ? "bg-brandBlue" : "bg-indigo-400"}`} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{sub.sub_category_name}</p>
          {sub.tax != null && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <Percent className="w-3 h-3" /> Tax: {sub.tax}%
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <div className="flex items-center gap-1.5 translucent-inner custom-border px-3 py-1.5 rounded-lg">
          <IndianRupee className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{sub.amount}</span>
        </div>
        <button
          onClick={() => onEdit(sub)}
          className={`p-1.5 rounded-lg transition-colors ${isEditing ? "text-brandBlue bg-brandBlue/10" : "text-slate-400 hover:text-brandBlue hover:bg-brandBlue/10"}`}
          title="Edit Subcategory"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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

  // Subcategory state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subFormData, setSubFormData] = useState({ sub_category_name: "", amount: "", tax: "" });
  const [subFormErrors, setSubFormErrors] = useState({});
  const [subLoading, setSubLoading] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  // Dynamic subcategory fetching & editing
  const [subcategoryList, setSubcategoryList] = useState([]);
  const [fetchingSubs, setFetchingSubs] = useState(false);
  const [editingSubId, setEditingSubId] = useState(null);

  // Delete confirm state
  const [confirmDialog, setConfirmDialog] = useState(null);

  const subNameRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fetchCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (search) params.search = search;

      const res = await menuapi.categoryList(params);
      const data = res.data?.data || res.data || {};
      const rows = data.rows || [];
      const total = data.pagination?.totalItems || data.totalItems || data.total || rows.length;

      setCategories(rows);
      setTotalItems(total);

      if (selectedCategory) {
        const updated = rows.find((r) => r.id === selectedCategory.id);
        if (updated) setSelectedCategory(updated);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load categories");
      setCategories([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      setFetchingSubs(true);
      const res = await menuapi.getSubCategory(categoryId);
      const subs = res.data?.data || res.data || [];
      setSubcategoryList(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error("Fetch subcategories error:", err);
      toast.error("Failed to load subcategories");
      setSubcategoryList([]);
    } finally {
      setFetchingSubs(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  // ── Add Category ──────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    const name = tempCategoryName.trim();
    if (!name) { toast.error("Please enter a category name"); return; }
    if (isCategoryNameDuplicate(name)) { toast.error("A category with this name already exists"); return; }

    const formData = new URLSearchParams();
    formData.append("category_name", name);
    try {
      await menuapi.createCategory(formData);
      toast.success("Category added successfully");
      setIsAddModalOpen(false);
      setTempCategoryName("");
      await fetchCategories(currentPage, searchQuery);
    } catch (err) {
      console.error(err);
      toast.error("Error adding category");
    }
  };

  // ── Subcategory Handlers ──────────────────────────────────────────────────
  const validateSubForm = () => {
    const errors = {};
    if (!subFormData.sub_category_name.trim()) errors.sub_category_name = "Name is required";
    if (!subFormData.amount || Number(subFormData.amount) <= 0) errors.amount = "Enter a valid amount";
    if (subFormData.tax === "" || subFormData.tax === null || subFormData.tax === undefined)
      errors.tax = "Tax is required";
    else if (Number(subFormData.tax) < 0 || Number(subFormData.tax) > 100)
      errors.tax = "Tax must be between 0 and 100";
    setSubFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubFieldChange = (field, value) => {
    setSubFormData((prev) => ({ ...prev, [field]: value }));
    if (subFormErrors[field]) setSubFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEditSubClick = (sub) => {
    setEditingSubId(sub.id);
    setSubFormData({
      sub_category_name: sub.sub_category_name,
      amount: sub.amount,
      tax: sub.tax !== null ? sub.tax : "",
    });
    setSubFormErrors({});
    subNameRef.current?.focus();
  };

  const cancelSubEdit = () => {
    setEditingSubId(null);
    setSubFormData({ sub_category_name: "", amount: "", tax: "" });
    setSubFormErrors({});
  };

  const handleSubmitSubCategory = async () => {
    if (!validateSubForm()) return;

    try {
      setSubLoading(true);

      if (editingSubId) {
        // UPDATE Existing
        const updateData = new URLSearchParams();
        updateData.append("sub_category_name", subFormData.sub_category_name.trim());
        updateData.append("amount", Number(subFormData.amount));
        updateData.append("tax", Number(subFormData.tax));
        updateData.append("CategoryId", selectedCategory.id);

        await menuapi.updateSubCategory(editingSubId, updateData);
        toast.success(`"${subFormData.sub_category_name}" updated!`);
        setEditingSubId(null);
      } else {
        // CREATE New
        const payload = {
          sub_category_name: subFormData.sub_category_name.trim(),
          amount: Number(subFormData.amount),
          tax: Number(subFormData.tax),
          CategoryId: selectedCategory.id,
        };
        const res = await menuapi.createSubCategory(payload);
        const newId = res?.data?.data?.id || res?.data?.id || Date.now();
        setNewlyAddedId(newId);
        setTimeout(() => setNewlyAddedId(null), 2500);
        toast.success(`"${payload.sub_category_name}" added!`);
      }

      setSubFormData({ sub_category_name: "", amount: "", tax: "" });
      setSubFormErrors({});

      await fetchSubCategories(selectedCategory.id);
      await fetchCategories(currentPage, searchQuery);

      if (!editingSubId) {
        setTimeout(() => subNameRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error(err);
      toast.error(editingSubId ? "Failed to update subcategory" : "Failed to add subcategory");
    } finally {
      setSubLoading(false);
    }
  };

  // ── Inline edit (Categories) ──────────────────────────────────────────────
  const saveInlineEdit = async () => {
    const name = inlineEditValue.trim();
    if (!name) { toast.error("Category name cannot be empty"); return; }
    if (isCategoryNameDuplicate(name, inlineEditId)) { toast.error("A category with this name already exists"); return; }

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
      console.error(err);
      toast.error("A category with this name already exists");
    } finally {
      setLoading(false);
    }
  };

  const isCategoryNameDuplicate = (name, excludeId = null) => {
    const inputName = name.trim().toLowerCase();
    return categories.some(
      (cat) => cat.category_name.trim().toLowerCase() === inputName && cat.id !== excludeId
    );
  };

  const startInlineEdit = (row) => { setInlineEditId(row.id); setInlineEditValue(row.category_name); };
  const cancelInlineEdit = () => { setInlineEditId(null); setInlineEditValue(""); };

  // ── Delete (Categories) ───────────────────────────────────────────────────
  const handleDelete = (id) => {
    setConfirmDialog({
      message: "This category will be permanently removed.",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setLoading(true);
          await menuapi.deleteCategory(id);
          toast.success("Category deleted");
          fetchCategories(currentPage, searchQuery);
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete category");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Table config ──────────────────────────────────────────────────────────
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
                onKeyDown={(e) => { if (e.key === "Enter") saveInlineEdit(); if (e.key === "Escape") cancelInlineEdit(); }}
                className="px-3 py-1.5 translucent-inner border-none rounded-lg text-sm w-48 sm:w-64 focus:outline-none focus:ring-4 focus:ring-brandBlue/20 transition-all font-medium"
                autoFocus
              />
              <button onClick={saveInlineEdit} className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors" title="Save">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancelInlineEdit} className="p-1.5 bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white rounded-lg transition-colors" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">{row.category_name}</span>
            {(row.subcategories?.length > 0 || row.SubCategories?.length > 0) && (
              <span className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                {(row.subcategories || row.SubCategories).length} sub
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // Modified to use the requested table menu dropdown structure
  const actions = [
    {
      type: "menu",
      label: "Actions",
      className: "p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
      menuItems: [
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" /> Manage Subcategories
            </span>
          ),
          onClick: (row) => {
            setSelectedCategory(row);
            setIsSubModalOpen(true);
            fetchSubCategories(row.id);
          },
          className: "hover:!bg-indigo-50 dark:hover:!bg-indigo-500/10 cursor-pointer",
        },
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-brandBlue dark:text-brandBlue">
              <Edit2 className="w-4 h-4" /> Edit Category
            </span>
          ),
          onClick: (row) => startInlineEdit(row),
          className: "hover:!bg-blue-50 dark:hover:!bg-blue-500/10 cursor-pointer",
        },
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
              <Trash2 className="w-4 h-4" /> Delete Category
            </span>
          ),
          onClick: (row) => handleDelete(row.id),
          className: "hover:!bg-red-50 dark:hover:!bg-red-500/10 cursor-pointer",
        }
      ]
    }
  ];

  const isSubFormDirty = subFormData.sub_category_name || subFormData.amount || subFormData.tax !== "";

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col relative">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontWeight: 500, fontSize: "13px" } }} />



      {/* Search and Action Bar */}
      <div className="translucent custom-border mb-6 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name..."
            className="w-full pl-10 pr-4 py-2.5 translucent-inner border-none rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brandBlue/20 transition-all"
          />
        </div>
        {!isManager && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="button w-full md:w-auto flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="relative flex-1 overflow-hidden flex flex-col translucent custom-border p-0 rounded-2xl animate-in fade-in duration-300">
        <div className="flex-1 overflow-auto p-0">
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

        {loading && (
          <Loader />
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="popup-card custom-border rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100/10 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-brandBlue" />
                Add New Category
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setTempCategoryName(""); }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 translucent-inner rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tempCategoryName}
                onChange={(e) => setTempCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                placeholder="e.g., Enterprise Software"
                className="w-full px-4 py-2.5 translucent-inner border-none rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brandBlue/20 transition-all mb-6"
                autoFocus
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => { setIsAddModalOpen(false); setTempCategoryName(""); }}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 translucent-inner custom-border rounded-xl hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={loading || !tempCategoryName.trim()}
                  className="button w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {isSubModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="popup-card custom-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Subcategories</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {selectedCategory.category_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSubModalOpen(false);
                  setSelectedCategory(null);
                  cancelSubEdit();
                  setSubcategoryList([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 translucent-inner rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 min-h-0">

              {/* ── Left: Add/Edit form ── */}
              <div className="sm:w-[52%] border-b sm:border-b-0 sm:border-r border-slate-100/10 p-5 flex flex-col gap-4 shrink-0 bg-black/5 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {editingSubId ? "Edit subcategory" : "Add subcategory"}
                  </p>
                  {editingSubId && (
                    <button
                      onClick={cancelSubEdit}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 translucent-inner custom-border px-2 py-1 rounded-md transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={subNameRef}
                    type="text"
                    placeholder="e.g., Travel"
                    value={subFormData.sub_category_name}
                    onChange={(e) => handleSubFieldChange("sub_category_name", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmitSubCategory(); }}
                    className={`w-full px-3 py-2.5 translucent-inner rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                      ${subFormErrors.sub_category_name
                        ? "ring-2 ring-red-500/50"
                        : "border-none focus:ring-brandBlue/20"}`}
                  />
                  {subFormErrors.sub_category_name && (
                    <p className="text-xs text-red-500 mt-1">{subFormErrors.sub_category_name}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Amount (₹) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      placeholder="0"
                      value={subFormData.amount}
                      onChange={(e) => handleSubFieldChange("amount", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmitSubCategory(); }}
                      className={`w-full pl-8 pr-3 py-2.5 translucent-inner rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                        ${subFormErrors.amount
                          ? "ring-2 ring-red-500/50"
                          : "border-none focus:ring-brandBlue/20"}`}
                    />
                  </div>
                  {subFormErrors.amount && (
                    <p className="text-xs text-red-500 mt-1">{subFormErrors.amount}</p>
                  )}
                </div>

                {/* Tax */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Tax (%) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      placeholder="e.g., 18"
                      min="0"
                      max="100"
                      value={subFormData.tax}
                      onChange={(e) => handleSubFieldChange("tax", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmitSubCategory(); }}
                      className={`w-full pl-8 pr-3 py-2.5 translucent-inner rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                        ${subFormErrors.tax
                          ? "ring-2 ring-red-500/50"
                          : "border-none focus:ring-brandBlue/20"}`}
                    />
                  </div>
                  {subFormErrors.tax && (
                    <p className="text-xs text-red-500 mt-1">{subFormErrors.tax}</p>
                  )}
                </div>

                <button
                  onClick={handleSubmitSubCategory}
                  disabled={subLoading || !isSubFormDirty}
                  className={`mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]
                    ${editingSubId ? "bg-brandBlue hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {subLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : editingSubId ? (
                    <Edit2 className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {subLoading ? (editingSubId ? "Updating…" : "Adding…") : (editingSubId ? "Update subcategory" : "Add subcategory")}
                </button>
              </div>

              {/* ── Right: Existing list ── */}
              <div className="flex-1 p-5 overflow-y-auto min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Existing</p>
                  {!fetchingSubs && subcategoryList.length > 0 && (
                    <span className="text-xs translucent-inner custom-border px-2 py-0.5 rounded-full font-medium">
                      {subcategoryList.length}
                    </span>
                  )}
                </div>

                {fetchingSubs ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <span className="inline-block w-8 h-8 border-4 border-indigo-200/20 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Loading...</p>
                  </div>
                ) : subcategoryList.length > 0 ? (
                  <div className="space-y-2">
                    {subcategoryList.map((sub, idx) => (
                      <SubItem
                        key={sub.id || idx}
                        sub={sub}
                        index={idx}
                        isNew={sub.id === newlyAddedId}
                        isEditing={sub.id === editingSubId}
                        onEdit={handleEditSubClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <div className="w-10 h-10 translucent-inner rounded-2xl flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No subcategories yet</p>
                    <p className="text-xs text-slate-400 mt-1">Add your first one using the form.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ─────────────────────────────────────────── */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}