import React from 'react'
import { NavLink } from 'react-router-dom'

export default function SidePanel({ routes = [] }) {
  return (
    <aside className="w-64 bg-gray-50 border-r">
      <nav className="p-4">
        {routes.map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            className={({ isActive }) =>
              `block py-2 px-3 rounded mb-1 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            {r.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
