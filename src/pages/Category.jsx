import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import Table from "../components/Table";
import { menuapi } from "../api";


export default function Category() {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { category_name: "" },
  });

  // ✅ Fetch all categories
  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      const res = await menuapi.categoryList({ page });
      const data = res.data?.data || {};
      setCategories(data.rows || []);
      setPagination({
        currentPage: data.pagination?.currentPage || 1,
        totalItems: data.pagination?.totalItems || 0,
        totalPages: data.pagination?.totalPages || 1,
        limit: data.pagination?.limit || 10,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(pagination.currentPage);
  }, []);

  // ✅ Add / Update category
  const onSubmit = async (values) => {
    if (!values.category_name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const formData = new URLSearchParams();
    formData.append("category_name", values.category_name);

    try {
      setLoading(true);
      if (editing) {
        await menuapi.updateCategory(editing.id, formData);
        toast.success("Category updated successfully");
      } else {
        await menuapi.createCategory(formData);
        toast.success("Category added successfully");
      }

      reset();
      setEditing(null);
      fetchCategories(pagination.currentPage);
    } catch (err) {
      console.error(err);
      toast.error("Error saving category");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      setLoading(true);
      await menuapi.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories(pagination.currentPage);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit mode
  const startEdit = (row) => {
    setEditing(row);
    setValue("category_name", row.category_name);
  };

  const cancelEdit = () => {
    reset();
    setEditing(null);
  };

  // ✅ Table configuration
  const columns = [
    {
      key: "category_name",
      label: "Category Name",
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const actions = [
    {
      type: "button",
      label: "Edit",
      className:
        "text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1",
      onClick: (row) => startEdit(row),
    },
    {
      type: "button",
      label: "Delete",
      className:
        "text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1",
      onClick: (row) => handleDelete(row.id),
    },
  ];

  return (
    <div className="x-auto py-4">
      <Toaster position="top-right" />
      <h1 className="text-3xl mb-6 text">
        Category Management
      </h1>

      {/* ✅ Add / Edit Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col sm:flex-row gap-3 mb-2"
      >
        <input
          type="text"
          {...register("category_name", { required: true })}
          placeholder="Enter category name"
          className="rounded px-3 py-2 flex-1 focus:outline-none focus:ring focus:ring-blue-200 custom-border"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ✅ Category Table */}
      <Table
        columns={columns}
        data={categories}
        actions={actions}
        keyField="id"
        emptyMessage="No categories found"
        currentPage={pagination.currentPage}
        pageSize={pagination.limit}
        totalCount={pagination.totalItems}
        onPageChange={(page) => fetchCategories(page)}
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
