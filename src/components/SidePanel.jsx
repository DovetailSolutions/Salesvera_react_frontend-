// SidePanel.jsx
import React, { useContext } from "react";
import { FaUser } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function SidePanel({ routes = [] }) {
  const { user } = useContext(AuthContext);

  return (
    <aside className="w-54 shadow-md min-h-screen text-white fixed z-50">
      <div className="py-6 text-center text-2xl mt-4">
        <span className="logo-font text-[var(--primary-blue)]">Sales</span>
        <span className="logo-font text-[var(--primary-green)]">vera</span>
      </div>

      <nav className="p-2 py-4">
        <div className="w-full border-1 border-gray-200 rounded-xl py-2 flex items-center justify-center gap-2 mb-6">
          <div className="p-2 bg-gray-200 rounded-full h-11 w-11 flex justify-center items-center">
            <FaUser className="text-2xl text-gray-500" />
          </div>
          <div className="text-left">
            {user ? (
              <>
                <div className="font-semibold text-black">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-600 capitalize">
                  {user.role?.replace(/_/g, " ")}
                </div>
              </>
            ) : (
              <div className="text-black">Loading...</div>
            )}
          </div>
        </div>

        {routes.map((section) => (
          <div key={section.category} className="mb-2">
            {section.routes.map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                className={({ isActive }) =>
                  `py-2 px-3 mb-1 flex gap-2 items-center justify-start rounded hover:bg-[var(--primary-blue)] hover:text-white hover:rounded-lg transition-colors text-sm ${
                    isActive ? "button-sidepanel themebg" : "text-black"
                  }`
                }
              >
                <span className="text-sm">{r.icon}</span>
                {r.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
