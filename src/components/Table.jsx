import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { MdArrowLeft, MdArrowRight } from "react-icons/md";
import { motion } from "framer-motion";

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
      <tr className="bgsky custom-border-bottom">
        {/* ✅ Index column */}
        <th className="px-4 py-3 font-[500] text-sky-600 text-[14px] text-left rounded-l-xl">
          #
        </th>

        {columns.map((col) => (
          <th
            key={col.key}
            className={`px-4 py-3 text-[14px] text-gray-400 font-semibold  ${
              col.align || "text-left"
            } ${col.sortable !== false ? "cursor-pointer select-none" : ""}`}
            onClick={() => col.sortable !== false && handleSort(col.key)}
          >
            {col.label}
            {col.sortable !== false && getSortIcon(col.key)}
          </th>
        ))}

        {actions.length > 0 && (
          <th className="px-4 py-2 text-end font-semibold text-[14px]  rounded-r-xl">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );

  const renderBody = () => (
    <tbody>
      {Array.isArray(sortedData) && sortedData.length > 0 ? (
        sortedData.map((row, idx) => (
          <tr key={row[keyField]} className="">
            {/* ✅ Index number (pagination-aware) */}
            <td className="px-4 py-2 text-sky-600">
              {(currentPage - 1) * pageSize + (idx + 1)}
            </td>

            {columns.map((col) => (
              <td key={col.key} className="px-4 py-2 text-[15px] text">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}

            {actions.length > 0 && (
              <td className="px-4 py-2 flex items-center justify-end gap-2 relative">
                {actions.map((action, idx) => {
                  // ✅ check condition first
                  if (action.condition && !action.condition(row)) return null;

                  if (action.type === "button") {
                    return (
                      <button
                        key={idx}
                        onClick={() => action.onClick(row)}
                        className={action.className}
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
                        className="relative "
                        ref={(el) => (menuRefs.current[menuId] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === menuId ? null : menuId)
                          }
                          className={action.className}
                        >
                          {action.label}
                        </button>

                        {openMenuId === menuId && (
                          <div className="absolute right-0 mt-1 dark:bg-gray-700 rounded w-40 z-50">
                            {action.menuItems.map((item, mi) => {
                              // ✅ also allow condition on menu items
                              if (item.condition && !item.condition(row))
                                return null;
                              return (
                                <div
                                  key={mi}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    item.onClick(row);
                                  }}
                                  className={`block w-full text-left px-4 py-2 dark:hover:bg-gray-600 hover:bg-gray-200 ${
                                    item.className || ""
                                  }`}
                                >
                                  {item.label}
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
        ))
      ) : (
        <tr>
          <td
            colSpan={columns.length + (actions.length > 0 ? 2 : 1)} // ✅ added +1 for index column
            className="text-center text-gray-500 py-4 "
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
        <div className="flex items-center justify-around mt-2 px-2 py-1 relative">
          <span className="text-sm text-gray-600 absolute left-1">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2 justify-center absolute">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded disabled:opacity-50 bg-gray-200 hover:bg-gray-400"
            >
              <MdArrowLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((num) => {
                return (
                  num <= 3 || // first 3
                  num > totalPages - 2 || // last 2
                  Math.abs(num - currentPage) <= 1 // current, prev, next
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
                  <span key={`ellipsis-${idx}`} className="px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => onPageChange(item)}
                    className={`px-3 py-1 rounded hover:bg-sky-600 hover:text-white transition-all ${
                      currentPage === item
                        ? " bg-sky-600 text-white"
                        : " rounded bg-gray-50"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-400"
            >
              <MdArrowRight />
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full paneltheme rounded overflow-auto mt-4 custom-border p-2`}
    >
      <table className="w-full text-sm h-full overflow-auto">
        {renderHeader()}
        {renderBody()}
      </table>
      {renderPagination()}
    </motion.div>
  );
}
