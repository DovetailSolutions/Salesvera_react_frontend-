import React from "react";
import { FaTimes } from "react-icons/fa";

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex justify-between items-center p-4">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;