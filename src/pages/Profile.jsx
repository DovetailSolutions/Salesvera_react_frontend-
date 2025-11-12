import React, { useEffect, useState } from "react";
import { authApi } from "../api";
import toast, { Toaster } from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.getProfile();
      if (res.data?.success) {
        setProfile(res.data.data);
      } else {
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p className="text-slate-600 text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-slate-600 text-lg font-medium">No profile data found</p>
          <p className="text-slate-500 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
          <p className="text-slate-600 mt-1">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          {/* Header Section with Profile Picture */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Profile Picture */}
              <div className="relative">
                {profile.profile ? (
                  <img
                    src={profile.profile}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>

              {/* Name and Role */}
              <div className="text-center sm:text-left mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-2 justify-center sm:justify-start">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  {profile.role || "User"}
                </p>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="First Name" 
                value={profile.firstName} 
              />
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="Last Name" 
                value={profile.lastName} 
              />
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                label="Email" 
                value={profile.email} 
              />
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
                label="Phone" 
                value={profile.phone} 
              />
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                label="Date of Birth" 
                value={
                  profile.dob
                    ? new Date(profile.dob).toLocaleDateString()
                    : "Not provided"
                }
              />
              <ProfileField 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
                label="Role" 
                value={profile.role} 
              />
            </div>

            {/* Account Activity Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Activity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileField 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                  label="Account Created" 
                  value={new Date(profile.createdAt).toLocaleString()}
                />
                <ProfileField 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                  label="Last Updated" 
                  value={new Date(profile.updatedAt).toLocaleString()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, icon }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-300 transition-colors duration-200">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            {label}
          </span>
          <span className="text-slate-800 font-medium text-sm break-words">
            {value || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}