import React, { useContext } from "react";
import SidePanel from "./SidePanel";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthProvider"; 
import Loader from "./Loader";

export default function Layout({ routes }) {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 selection:bg-blue-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <SidePanel routes={routes} />
      
      {/* Main Content Wrapper 
        - ml-64 (16rem/256px) matches the w-64 of the fixed SidePanel perfectly.
        - flex flex-col ensures the Footer is always pushed to the bottom.
      */}
      <main className="flex-1 flex flex-col min-h-screen ml-64 transition-all duration-300 w-[calc(100%-16rem)]">
        
        {/* Topbar Wrapper - Sticky to top for easy access while scrolling */}
        <div className="w-full flex justify-center items-center h-[40px] fixed z-20 bg-white/50 top-0 left-0 backdrop-blur-lg"></div>
        <div className="sticky top-0 z-30 px-2">
          <Topbar />
        </div>

        {/* Page Content Area 
          - Added padding (p-6 md:p-8) so content breathes.
          - max-w-7xl prevents ultra-wide monitors from stretching UI too far.
        */}
        <div className="flex-1 p-4 py-2 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full h-full animate-in fade-in duration-500">
            <Outlet />
          </div>
        </div>

        {/* Footer Container */}
        <div className="mt-auto border-slate-200 bg-white/50 backdrop-blur-sm mx-2">
          <Footer />
        </div>
        
      </main>
    </div>
  );
}