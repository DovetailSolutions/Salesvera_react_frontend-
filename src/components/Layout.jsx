import React from "react";
import SidePanel from "./SidePanel";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function Layout({ routes }) {
  return (
    <div className="min-h-screen flex">
      <SidePanel routes={routes} />
      <main className="flex-1 ml-54 p-2">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
