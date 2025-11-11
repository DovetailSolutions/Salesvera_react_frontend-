import React from 'react'
import SidePanel from './SidePanel'
import { Outlet } from 'react-router-dom'

export default function Layout({ routes }) {
  return (
    <div className="min-h-screen flex">
      <SidePanel routes={routes} />
      <main className="flex-1 p-6 bg-white">
        <Outlet />
      </main>
    </div>
  )
}
