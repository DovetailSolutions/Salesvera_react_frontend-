import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaAngleLeft } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa";

export default function Table({
  columns = [],
  data = [],
  actions = [],
  keyField = "id",
  emptyMessage = "No data available",
  shadow = "shadow-none",
  // Pagination props
  currentPage = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange = () => {},
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const menuRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInside = Object.values(menuRefs.current).some(
        (ref) => ref && ref.contains(event.target)
      );
      if (!isInside) setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
        return sortConfig.direction === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }

      if (!isNaN(Date.parse(valA)) && !isNaN(Date.parse(valB))) {
        return sortConfig.direction === "asc"
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }

      return sortConfig.direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <FaSort size={12} className="inline ml-1" />;

    return sortConfig.direction === "asc" ? (
      <FaSortUp size={12} className="inline ml-1 text-blue-500" />
    ) : (
      <FaSortDown size={12} className="inline ml-1 text-blue-500" />
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const renderHeader = () => (
  <thead>
    <tr>
      <th className="px-3 py-2 font-semibold text-xs text-left text-black bg-[#3B82F60D] rounded-l-xl">
        Sr No
      </th>

      {columns.map((col) => (
        <th
          key={col.key}
          className={`px-3 py-2 text-xs text-black font-semibold bg-[#3B82F60D] ${
            col.align || "text-left"
          } ${col.sortable !== false ? "cursor-pointer select-none" : ""}`}
          onClick={() => col.sortable !== false && handleSort(col.key)}
        >
          {col.label}
          {col.sortable !== false && getSortIcon(col.key)}
        </th>
      ))}

      {actions.length > 0 && (
        <th className="px-3 py-2 text-end font-semibold text-xs text-black bg-[#3B82F60D] rounded-r-xl">
          Actions
        </th>
      )}
    </tr>
  </thead>
);

  const renderBody = () => (
  <tbody>
    {Array.isArray(sortedData) && sortedData.length > 0 ? (
      sortedData.map((row, idx) => {
        const bgColor = idx % 2 === 0 ? 'bg-[#3B82F603]' : 'bg-[#3B82F60D]';
        return (
          <tr key={row[keyField]} className={bgColor}>
            <td className="px-3 py-1.5 text-xs text-black">
              {(currentPage - 1) * pageSize + (idx + 1)}
            </td>
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-1.5 text-xs text-black">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
            {actions.length > 0 && (
              <td className="px-3 py-1.5 flex items-center justify-end gap-2 relative text-xs text-black">
                {actions.map((action, idx) => {
                  if (action.condition && !action.condition(row)) return null;
                 if (action.type === "button") {
  if (action.render) {
    return (
      <span key={idx} onClick={(e) => e.stopPropagation()}>
        {action.render(row)}
      </span>
    );
  }
  return (
    <button
      key={idx}
      onClick={() => action.onClick(row)}
      className={`${action.className} text-xs`}
    >
      {action.label}
    </button>
  );
}
                  if (action.type === "menu") {
                    const menuId = `${row[keyField]}-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="relative"
                        ref={(el) => (menuRefs.current[menuId] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === menuId ? null : menuId)
                          }
                          className={`${action.className} text-xs`}
                        >
                          {action.label}
                        </button>
                        {openMenuId === menuId && (
                          <div className="fixed right-9 mt-1 bg-white rounded w-40 z-50 border">
                            {action.menuItems.map((item, mi) => {
                              if (item.condition && !item.condition(row)) return null;
                              return (
                                <div
  key={mi}
  onClick={() => {
    setOpenMenuId(null);
    item.onClick(row);
  }}
  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
    item.className || "text-gray-700 hover:bg-gray-100"
  }`}
>
  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
  <span>{item.label}</span>
</div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </td>
            )}
          </tr>
        );
      })
    ) : (
      <tr>
        <td
          colSpan={columns.length + (actions.length > 0 ? 2 : 1)}
          className="text-center text-xs text-black py-3 bg-[#3B82F603]"
        >
          {emptyMessage}
        </td>
      </tr>
    )}
  </tbody>
);

  const renderPagination = () =>
  totalPages > 1 && (
    <div className="py-2 pb-4 pt-5">
      <div className="flex items-center justify-center mt-2 px-2 py-1 relative">
        <span className="text-sm text-gray-600 absolute left-0">
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex gap-1 justify-center">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="!px-3 !py-3 rounded disabled:opacity-50 border border-gray-300 bg-white text-black hover:bg-gray-100"
          >
            <FaAngleLeft />
          </button>

          {/* Page Number Buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((num) => {
              return (
                num <= 3 ||
                num > totalPages - 2 ||
                Math.abs(num - currentPage) <= 1
              );
            })
            .reduce((acc, num, i, arr) => {
              if (i > 0 && num - arr[i - 1] > 1) {
                acc.push("ellipsis");
              }
              acc.push(num);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-1">
                  ...
                </span>
              ) : (
                <div
                  key={item}
                  onClick={() => onPageChange(item)}
                  className={` !rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    currentPage === item
                      ? "!bg-[#10B981] text-white !px-5 !py-1" 
                      : "!bg-white !text-black border border-black hover:bg-gray-100 !px-5 !py-1" 
                  }`}
                >
                  {item}
                </div>
              )
            )}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="!px-3 !py-3 rounded disabled:opacity-50 border border-gray-300 bg-white text-black hover:bg-gray-100"
          >
            <FaAngleRight />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className={`w-full paneltheme rounded mt-4 p-2 overflow-x-auto lg:overflow-x-hidden`}
>
  <table className="w-full text-sm border-collapse table-fixed">
        {renderHeader()}
        {renderBody()}
      </table>
      {renderPagination()}
    </motion.div>
  );
}