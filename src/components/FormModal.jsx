// components/FormModal.jsx
import React from "react";
import Modal from "./popupModal"; // your existing Modal

const FormModal = ({
  isOpen,
  onClose,
  title,
  fields, // array of field config objects
  values,
  onChange,
  onSubmit,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          const { name, label, type = "text", placeholder, required = false, options } = field;

          return (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              {type === "select" ? (
                <select
                  name={name}
                  value={values[name] || ""}
                  onChange={(e) => onChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                  required={required}
                >
                  <option value="">-- Select --</option>
                  {options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={name}
                  value={values[name] || ""}
                  onChange={(e) => onChange(e)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                  required={required}
                />
              )}
            </div>
          );
        })}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;