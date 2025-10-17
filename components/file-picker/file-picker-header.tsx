'use client'

import { Button } from '@/components/ui/button'

interface FilePickerHeaderProps {
  title: string
  subtitle?: string
  isEditMode: boolean
  isSaving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}

export function FilePickerHeader({
  title,
  subtitle,
  isEditMode,
  isSaving,
  onEdit,
  onCancel,
  onSave
}: FilePickerHeaderProps) {
  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {!isEditMode ? (
          <Button onClick={onEdit} variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Select'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
