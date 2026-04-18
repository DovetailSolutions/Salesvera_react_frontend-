import React, { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { LogOut, X, LayoutGrid, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

export default function SidePanel({ routes = [], open, onClose }) {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  // State to track expanded categories (e.g. Analytics, Menu)
  const [expandedCategories, setExpandedCategories] = useState({});
  // State to track expanded submenus (e.g. Invoices & Quotes)
  const [expandedSubmenus, setExpandedSubmenus] = useState({});

  const handleLogout = async () => {
    await logout();
    toast.success("You have been successfully signed out.");
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: prev[category] === false ? true : false,
    }));
  };

  const toggleSubmenu = (label) => {
    setExpandedSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Helper: check if a submenu contains the active route so it stays open
  const isSubmenuActive = (subRoutes) => {
    return subRoutes.some((route) => location.pathname === route.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 flex w-[260px] px-4 flex-col no-scrollbar border-r border-slate-200 dark:border-slate-800 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0 z-40" : "-translate-x-full z-0"
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 shadow-md shadow-violet-600/20">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                SalesVera
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Admin Panel
              </h4>
            </div>
          </div>
          <div
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-8 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          {routes.map((section, index) => {
            const isExpanded = expandedCategories[section.category] !== false;

            return (
              <div key={section.category || index} className="space-y-1">
                {/* Category Header (Expandable Toggle) */}
                {section.category && (
                  <div
                    onClick={() => toggleCategory(section.category)}
                    className="flex w-full items-center justify-between px-4 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    <span>{section.category}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                    />
                  </div>
                )}

                {/* Smooth Expandable Container for Main Category */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                  <div className="overflow-hidden flex flex-col gap-1">
                    {section.routes.map((r) => {

                      // ─── IF ROUTE IS A NESTED SUBMENU ───
                      if (r.subRoutes) {
                        const isSubOpen = expandedSubmenus[r.label] || isSubmenuActive(r.subRoutes);
                        const isParentActive = isSubmenuActive(r.subRoutes);

                        return (
                          <div key={r.label} className="space-y-1">
                            {/* Submenu Parent Toggle div */}
                            <div
                              onClick={() => toggleSubmenu(r.label)}
                              className={`group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 focus:outline-none ${isParentActive
                                ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={isParentActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"}>
                                  {r.icon}
                                </span>
                                {r.label}
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isSubOpen ? "rotate-0" : "-rotate-90"
                                  }`}
                              />
                            </div>

                            {/* Submenu Children Container */}
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${isSubOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                }`}
                            >
                              <div className="overflow-hidden flex flex-col">
                                {/* Subtle left border to visually indicate nested items */}
                                <div className="ml-[22px] border-l-2 border-slate-100 dark:border-slate-800 pl-3 mt-1 mb-1 space-y-1">
                                  {r.subRoutes.map((sub) => (
                                    <NavLink
                                      key={sub.path}
                                      to={sub.path}
                                      onClick={() => {
                                        if (window.innerWidth < 1024) onClose();
                                      }}
                                      className={({ isActive }) =>
                                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${isActive
                                          ? "bg-violet-700 text-white shadow-md shadow-violet-500/20"
                                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                                        }`
                                      }
                                    >
                                      {sub.label}
                                    </NavLink>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ─── IF ROUTE IS A NORMAL LINK ───
                      return (
                        <NavLink
                          key={r.path}
                          to={r.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${isActive
                              ? "bg-violet-700 text-white shadow-md shadow-violet-500/20"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={`${isActive
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                                  }`}
                              >
                                {r.icon}
                              </span>
                              {r.label}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Workspace Widget (Bottom) */}
        <div className="mt-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 m-2 shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Premium SaaS operations command center.
          </p>
          <div
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </div>
        </div>
      </aside>
    </>
  );
}