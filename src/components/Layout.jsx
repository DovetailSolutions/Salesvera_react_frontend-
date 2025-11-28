import React, { useContext } from "react";
import SidePanel from "./SidePanel";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthProvider"; 

export default function Layout({ routes }) {

  const { loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex">
      <SidePanel routes={routes} />
      <main className="flex-1 ml-56 p-2">
        <Topbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}