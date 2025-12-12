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
    return <Loader/>
  }

  return (
    <div className="min-h-screen flex px-2">
      <SidePanel routes={routes} />
      <main className="flex-1 ml-56 px-2">
        <Topbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}