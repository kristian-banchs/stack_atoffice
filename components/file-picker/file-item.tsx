'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeleteKBFile } from '@/lib/hooks/resource-mutation-hooks'
import { useEditMode } from '@/lib/hooks/edit-mode-hooks'
import { StatusBadge } from './status-badge'

interface FileItemProps {
  file: any
  status: 'not_indexed' | 'pending' | 'being_indexed' | 'parsed' | 'indexed' | 'error'
  filePath: string
  parentPath: string
  allSiblings: string[]
  editMode?: ReturnType<typeof useEditMode> | null
  kbId: string
  token: string | null
  pendingPaths: Set<string>
}

export function FileItem({
  file,
  status,
  filePath,
  parentPath,
  allSiblings,
  editMode,
  kbId,
  token,
  pendingPaths
}: FileItemProps) {
  const deleteMutation = useDeleteKBFile(token, kbId)
  const isChecked = editMode?.isSelected(filePath) || false

  // Check if this file or any ancestor is in pendingPaths
  const isPendingFile = (path: string): boolean => {
    if (pendingPaths.has(path)) return true

    // Check if any ancestor folder is pending
    const parts = path.split('/').filter(Boolean)
    for (let i = parts.length - 1; i > 0; i--) {
      const ancestorPath = '/' + parts.slice(0, i).join('/')
      if (pendingPaths.has(ancestorPath)) return true
    }
    return false
  }

  // CRITICAL: Override status for optimistic UI (pending paths)
  // If pendingPaths is active (size > 0), it represents the ONLY files/folders that should be indexed
  // - Files IN pendingPaths OR with ancestor in pendingPaths: show 'pending' (optimistic, waiting for server)
  // - Files NOT in pendingPaths: show 'not_indexed' (deselected, don't wait for server)
  // If pendingPaths is empty: use server status normally
  const effectiveStatus =
    pendingPaths.size > 0
      ? (isPendingFile(filePath) ? 'pending' : 'not_indexed')
      : status

      const isPending = pendingPaths.has(filePath)

   console.log("effectiveStatus: ", effectiveStatus, "filePath: ", filePath, "pendingPaths: ", pendingPaths, "isPending: ", isPending, "size: ", pendingPaths.size);
      
  return (
    <div className="flex items-center gap-2 py-1 px-2 ml-6">
      {/* Checkbox in edit mode, invisible spacer when not */}
      {editMode ? (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => editMode.toggleFile(filePath, parentPath, allSiblings)}
          className="cursor-pointer"
        />
      ) : (
        <div className="w-3.5" />
      )}

      <span>📄</span>
      <span className="text-sm flex-1">{file.inode_path.path}</span>

      {/* Status badge - use effectiveStatus for optimistic UI */}
      <StatusBadge status={effectiveStatus} />

      {/* Delete button when not in edit mode and file is indexed */}
       { effectiveStatus !== 'not_indexed' && (
        <button
          onClick={() => deleteMutation.mutate(filePath)}
          disabled={deleteMutation.isPending || editMode?.isEditMode}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
        </button>
      )}
    </div>
  )
}
