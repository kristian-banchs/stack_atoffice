'use client'

import { FileText, Globe, Type, Box, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const integrationCategories = [
  { icon: FileText, label: 'Files', count: 4, id: 'files' },
  { icon: Globe, label: 'Websites', id: 'websites' },
  { icon: Type, label: 'Text', id: 'text' },
  { icon: Box, label: 'Confluence', id: 'confluence' },
  { icon: Box, label: 'Notion', id: 'notion' },
  { icon: Box, label: 'Google Drive', id: 'google-drive' },
  { icon: Box, label: 'OneDrive', id: 'onedrive' },
  { icon: Box, label: 'SharePoint', id: 'sharepoint' },
  { icon: Box, label: 'Slack', id: 'slack' },
]

interface SidebarProps {
  selectedIntegration: string | null
  onSelect: (id: string) => void
  onLogout?: () => void
}

export function Sidebar({ selectedIntegration, onSelect, onLogout }: SidebarProps) {
  return (
    <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Integrations</h2>
      </div>
      <nav className="flex-1 p-3">
        <div className="space-y-0.5">
          {integrationCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                selectedIntegration === item.id
                  ? 'bg-gray-200 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className="text-xs text-blue-600 font-semibold">• {item.count}</span>
              )}
            </button>
          ))}
        </div>
      </nav>
      {onLogout && (
        <div className="p-3 border-t border-gray-200">
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </aside>
  )
}
