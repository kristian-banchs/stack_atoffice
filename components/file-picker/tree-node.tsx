'use client'

import { useMemo, useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/hooks/auth-hooks'
import { useConnectionResources } from '@/lib/hooks/connection-hooks'
import { usePrefetchChildFolders } from '@/lib/hooks/connection-hooks'
import { useKBResources, usePrefetchKBResources } from '@/lib/hooks/knowledge-base-hooks'
import { useEditMode } from '@/lib/hooks/edit-mode-hooks'
import { FileItem } from './file-item'
import { TreeNodeSkeleton } from '../skeleton/tree-node-skeleton'
import type { IndexStatus } from '@/lib/types'

interface TreeNodeProps {
  path: string
  folderId: string | null
  connectionId: string
  kbId: string
  isOpen: boolean
  expandedFolders: Set<string>
  onToggle: (path: string) => void
  editMode?: ReturnType<typeof useEditMode> | null
  pathToResourceId?: Map<string, string>
  pendingPaths: Set<string>
  onPendingCleanup?: (path: string) => void
  isRebuilding?: boolean
}

export function TreeNode({
  path,
  folderId,
  connectionId,
  kbId,
  isOpen,
  expandedFolders,
  onToggle,
  editMode,
  pathToResourceId,
  pendingPaths,
  onPendingCleanup,
  isRebuilding = false
}: TreeNodeProps) {
  const auth = useAuth()


  //--------- fetching resources -----------
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



  //--------- merging resources -----------
  const merged = useMemo(() => {
    if (!driveData?.data) return []

    const kbMap = new Map(
      kbData?.data?.map(r => [r.resource_id, r.status]) || []
    )

    return driveData.data.map(file => ({
      ...file,
      indexStatus: (kbMap.get(file.resource_id) || 'not_indexed') as IndexStatus
    }))
  }, [driveData, kbData])


  // Populate pathToResourceId map as we render (prevents us from having to fetch the resource_id for each item)
  // Note: inode_path.path is ALWAYS relative from root, not from current folder
  useMemo(() => {
    if (pathToResourceId) {
      merged.forEach(item => {
        const itemPath = `/${item.inode_path.path}`
        pathToResourceId.set(itemPath, item.resource_id)
      })
    }
  }, [merged, pathToResourceId])




  //--------- extracting child folders for prefetching -----------

  const childFolders = useMemo(() =>
    merged.filter(item => item.inode_type === 'directory'),
    [merged]
  )

  // Prefetch BOTH connection resources AND KB resources to eliminate badge lag
  usePrefetchChildFolders(auth.token, connectionId, childFolders.length > 0 ? childFolders : null)
  usePrefetchKBResources(auth.token, kbId, childFolders.length > 0 ? childFolders : null)


  //--------- auto-select indexed resources when entering edit mode (ONE TIME ONLY) -----------
  const hasAutoSelected = useRef(false)

  // Reset auto-selection flag when exiting edit mode
  useEffect(() => {
    if (!editMode) {
      hasAutoSelected.current = false
    }
  }, [editMode])

  useEffect(() => {
    // Only run auto-selection ONCE per folder when edit mode first activates
    if (!editMode || !kbData?.data || hasAutoSelected.current) return

    // Get resource IDs that are indexed in THIS folder from the KB query
    const localIndexedIds = new Set(
      kbData.data
        .filter(item => {
          // Files must be parsed/indexed
          if (item.inode_type === 'file') {
            return item.status === 'parsed' || item.status === 'indexed'
          }
          // Directories in KB means they're indexed
          return item.inode_type === 'directory'
        })
        .map(item => item.resource_id)
    )

    if (localIndexedIds.size === 0) {
      hasAutoSelected.current = true
      return
    }

    // Get all sibling paths (files + folders) for consolidation logic
    const allSiblingPaths = merged.map(item => `/${item.inode_path.path}`)

    // Auto-select any items in this folder that are indexed
    merged.forEach(item => {
      if (localIndexedIds.has(item.resource_id)) {
        const itemPath = `/${item.inode_path.path}`
        if (!editMode.isSelected(itemPath)) {
          if (item.inode_type === 'directory') {
            editMode.toggleFolder(itemPath, path, allSiblingPaths)
          } else {
            editMode.toggleFile(itemPath, path, allSiblingPaths)
          }
        }
      }
    })

    // Mark as initialized - never run again for this folder instance
    hasAutoSelected.current = true
  }, [editMode, kbData, merged, path])

  //--------- cleanup pending paths when real status arrives -----------
  useEffect(() => {
    if (!onPendingCleanup || pendingPaths.size === 0 || isRebuilding) {
      return
    }

    // Check each merged resource (files only)
    merged.forEach(item => {
      if (item.inode_type !== 'file') return

      // inode_path.path is always from root, so just prepend /
      const itemPath = `/${item.inode_path.path}`

      // Check if this file OR any ancestor folder is in pendingPaths
      const isFilePending = pendingPaths.has(itemPath)
      let isAncestorPending = false

      if (!isFilePending) {
        // Check ancestors (e.g., for /books/chapters/file.txt, check /books/chapters and /books)
        const parts = itemPath.split('/').filter(Boolean)
        for (let i = parts.length - 1; i > 0; i--) {
          const ancestorPath = '/' + parts.slice(0, i).join('/')
          if (pendingPaths.has(ancestorPath)) {
            isAncestorPending = true
            break
          }
        }
      }

      const isPending = isFilePending || isAncestorPending

      

      //cleanup if the file has a real indexing and is pending or its an ancestor folder that is pending
      const hasRealIndexingStatus =
        item.indexStatus === 'parsed' || item.indexStatus === 'indexed'

      if (isPending) {
        if (hasRealIndexingStatus) {
          // If ancestor folder is pending, remove the folder path (not the file path)
          if (isAncestorPending && !isFilePending) {
            const parts = itemPath.split('/').filter(Boolean)
            for (let i = parts.length - 1; i > 0; i--) {
              const ancestorPath = '/' + parts.slice(0, i).join('/')
              if (pendingPaths.has(ancestorPath)) {
                onPendingCleanup(ancestorPath)
                break
              }
            }
          } else {
            onPendingCleanup(itemPath)
          }
        }
      }
    })
  }, [merged, pendingPaths, onPendingCleanup, path, isRebuilding])



  
  if (!isOpen) return null

  if (driveLoading) {
    return <TreeNodeSkeleton />
  }

  if (merged.length === 0) {
    return <div className="ml-4 text-sm text-gray-500">Empty folder</div>
  }

  // Compute all sibling paths once (files + folders) for consolidation logic
  const allSiblingPaths = merged.map(m => `/${m.inode_path.path}`)

  return (
    <div className="space-y-1">
      {merged.map(item => {
        if (item.inode_type === 'directory') {
          // inode_path.path is always from root, so just prepend /
          const childPath = `/${item.inode_path.path}`
          const isExpanded = expandedFolders.has(childPath)
          const isChecked = editMode?.isSelected(childPath) || false

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
                {editMode ? (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation()
                      editMode.toggleFolder(childPath, path, allSiblingPaths)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                ) : (
                  <div className="w-3.5" />
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
                    editMode={editMode}
                    pathToResourceId={pathToResourceId}
                    pendingPaths={pendingPaths}
                    onPendingCleanup={onPendingCleanup}
                    isRebuilding={isRebuilding}
                  />
                </div>
              )}
            </div>
          )
        } else {
          // inode_path.path is always from root, so just prepend /
          const filePath = `/${item.inode_path.path}`

          return (
            <FileItem
              key={item.resource_id}
              file={item}
              status={item.indexStatus as IndexStatus}
              filePath={filePath}
              parentPath={path}
              allSiblings={allSiblingPaths}
              editMode={editMode}
              kbId={kbId}
              token={auth.token}
              pendingPaths={pendingPaths}
            />
          )
        }
      })}
    </div>
  )
}
