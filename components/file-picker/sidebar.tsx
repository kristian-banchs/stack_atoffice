'use client'

import { Link2 } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Stack AI</h2>
        <nav className="space-y-2">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            <Link2 className="h-5 w-5" />
            Integrations
          </a>
        </nav>
      </div>
    </aside>
  )
}
