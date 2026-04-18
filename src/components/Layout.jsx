import React, { useContext, useState } from "react";
import SidePanel from "./SidePanel";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthProvider";
import Loader from "./Loader";

export default function Layout({ routes }) {
  const { loading } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#0b1120]">
      <div className="relative min-h-screen w-full flex bg-slate-50 dark:bg-[#0b1120] font-sans selection:bg-blue-500 selection:text-white text-slate-800 dark:text-slate-200 overflow-x-hidden">

        {/* --- Ambient Background Gradients --- */}
        <div className="pointer-events-none fixed top-[-15%] left-[5%] w-[800px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] z-0" />
        <div className="pointer-events-none fixed top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-indigo-600/15 blur-[120px] z-0" />
        {/* ------------------------------------ */}

        {/* Sidebar */}
        <SidePanel routes={routes} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        {/* FIX: Changed ml-[260px] to lg:ml-[260px] so it takes full screen on mobile */}
        <main className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 w-full lg:ml-[260px]">
          <div className="flex-1 flex flex-col px-4 overflow-x-hidden">
            <div className="sticky top-0 z-10">
              <Topbar onOpenSidebar={() => setSidebarOpen(true)} routes={routes} />
            </div>

            <div className="flex-1 w-full mx-auto animate-in fade-in duration-500">
              <Outlet />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}