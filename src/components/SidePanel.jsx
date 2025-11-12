import React from "react";
import { NavLink } from "react-router-dom";

export default function SidePanel({ routes = [] }) {
  return (
    <aside className="w-54 shadow-md sidepanel bg-gray-800 min-h-screen text-white fixed">
      {/* Logo / Title */}
      <div className="py-6 text-center text-2xl mt-4">Sales Vera</div>

      <nav className="p-2 py-4">
        {routes.map((section) => (
          <div key={section.category} className="mb-2">
            {/* Category Title */}
            <div className="text-gray-400 mb-2 uppercase text-[10px] font-semibold px-3">
              {section.category}{" "}
              <div className="h-[1.5px] w-full bg-[#282b53] mt-1"></div>
            </div>

            {/* Routes */}
            {section.routes.map((r) => (
              <NavLink
                key={r.path}
                to={r.path}
                className={({ isActive }) =>
                  `py-2 px-3 mb-1 flex gap-2 items-center justify-start rounded hover:bg-gray-700 transition-colors text-sm ${
                    isActive ? "button-sidepanel" : "text-gray-200"
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
