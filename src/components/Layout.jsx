import React, { useState, useEffect } from "react"; // 👈 add useEffect
import SidePanel from "./SidePanel";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { authApi } from "../api";

export default function Layout({ routes }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // optional: better UX

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.data?.success && response.data?.data) {
          setCurrentUser(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Optionally handle auth errors (e.g., redirect to login)
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen flex">
      <SidePanel routes={routes} currentUser={currentUser} />
      <main className="flex-1 ml-56 p-2"> {/* Use ml-56, not ml-54 */}
        <Topbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}