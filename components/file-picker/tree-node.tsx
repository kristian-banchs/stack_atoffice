'use client'

import { useMemo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/auth-hooks'
import { useConnectionResources } from '@/lib/hooks/connection-hooks'
import { usePrefetchChildFolders } from '@/lib/hooks/connection-hooks'
import { useKBResources } from '@/lib/hooks/knowledge-base-hooks'
import { FileItem } from './file-item'
import type { IndexStatus } from '@/lib/types'

interface TreeNodeProps {
  path: string
  folderId: string | null
  connectionId: string
  kbId: string
  isOpen: boolean
  expandedFolders: Set<string>
  onToggle: (path: string) => void
}

export function TreeNode({
  path,
  folderId,
  connectionId,
  kbId,
  isOpen,
  expandedFolders,
  onToggle
}: TreeNodeProps) {
  const auth = useAuth()

  // Drive files - cached forever (never refetch)
  const { data: driveData, isLoading: driveLoading } = useConnectionResources(
    auth.token,
    connectionId,
    folderId,
    {
      enabled: isOpen && !!auth.token,
    }
  )

  // KB status - polls when indexing
  const { data: kbData } = useKBResources(
    auth.token,
    kbId,
    path,
    { enabled: isOpen && !!auth.token }
  )

  // Merge client-side (O(n) with Map)
  const merged = useMemo(() => {
    if (!driveData?.data) return []

    const kbMap = new Map(
      kbData?.data?.map(r => [r.resource_id, r.status]) || []
    )

    return driveData.data.map(file => ({
      ...file,
      indexStatus: kbMap.get(file.resource_id) || 'not_indexed'
    }))
  }, [driveData, kbData])

  console.log("merged: ", merged);

  // Extract child folders for prefetching
  const childFolders = useMemo(() =>
    merged.filter(item => item.inode_type === 'directory'),
    [merged]
  )

  // Prefetch Drive resources for all visible child folders in parallel
  // This is lean: cached forever (staleTime: Infinity), only when folders visible
  usePrefetchChildFolders(auth.token, connectionId, childFolders.length > 0 ? childFolders : null)

  if (!isOpen) return null

  if (driveLoading) {
    return <div className="ml-4 text-sm text-gray-500">Loading...</div>
  }

  if (merged.length === 0) {
    return <div className="ml-4 text-sm text-gray-500">Empty folder</div>
  }

  return (
    <div className="space-y-1">
      {merged.map(item => {
        if (item.inode_type === 'directory') {
          const childPath = path === '/' ? `/${item.inode_path.path}` : `${path}/${item.inode_path.path}`
          const isExpanded = expandedFolders.has(childPath)

          return (
            <div key={item.resource_id}>
              <button
                onClick={() => onToggle(childPath)}
                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded w-full text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>📁</span>
                <span className="text-sm">{item.inode_path.path}</span>
              </button>
              {isExpanded && (
                <div className="ml-6">
                  <TreeNode
                    path={childPath}
                    folderId={item.resource_id}
                    connectionId={connectionId}
                    kbId={kbId}
                    isOpen={true}
                    expandedFolders={expandedFolders}
                    onToggle={onToggle}
                  />
                </div>
              )}
            </div>
          )
        } else {
          return (
            <FileItem
              key={item.resource_id}
              file={item}
              status={item.indexStatus as IndexStatus}
            />
          )
        }
      })}
    </div>
  )
}
