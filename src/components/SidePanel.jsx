// SidePanel.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function SidePanel({ routes = [] }) {
  const { user } = useContext(AuthContext);

  // Helper to get initials for the avatar
  const getInitials = (firstName, lastName) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 min-h-screen fixed left-0 top-0 z-40 flex flex-col border-r border-slate-800 shadow-xl overflow-y-auto custom-scrollbar">
      
      {/* Brand Header */}
      <div className="py-6 px-6 text-2xl font-bold tracking-tight border-b border-slate-800/60 sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-center">
        <span className="logo-font text-blue-500">Sales</span>
        <span className="logo-font text-green-500">vera</span>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-6">
        
        {/* User Profile Widget */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-slate-800/80">
          {user ? (
            <>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner shrink-0 text-sm">
                {getInitials(user.firstName, user.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-400 capitalize truncate font-medium">
                  {user.role?.replace(/_/g, " ")}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full animate-pulse">
              <div className="h-10 w-10 rounded-full bg-slate-700 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-5">
          {routes.map((section, index) => (
            <div key={section.category || index}>
              {/* Optional: Render category headers if your routes array has them */}
              {section.category && (
                <h3 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  {section.category}
                </h3>
              )}
              
              <div className="flex flex-col gap-1">
                {section.routes.map((r) => (
                  <NavLink
                    key={r.path}
                    to={r.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600/10 text-blue-400"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`text-[1.1rem] transition-colors ${
                            isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        >
                          {r.icon}
                        </span>
                        <span>{r.label}</span>
                        
                        {/* Subtle indicator dot for active state */}
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

    </aside>
  );
}