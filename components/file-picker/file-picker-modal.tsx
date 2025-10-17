'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/auth-hooks'
import { useConnection, useConnectionResources } from '@/lib/hooks/connection-hooks'
import { useKnowledgeBase, useKBResources } from '@/lib/hooks/knowledge-base-hooks'
import { useEditMode } from '@/lib/hooks/edit-mode-hooks'
import { useRebuildKB } from '@/lib/hooks/resource-mutation-hooks'
import { FilePickerHeader } from './file-picker-header'
import { FilePickerSkeleton } from '../skeleton/file-picker-skeleton'
import { TreeNode } from './tree-node'
import { toast } from 'sonner'

export function FilePickerModal() {
  const auth = useAuth()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
  const [pathToResourceId] = useState<Map<string, string>>(new Map())
  const [pendingPaths, setPendingPaths] = useState<Set<string>>(new Set())
  const [isRebuilding, setIsRebuilding] = useState(false)
  const editMode = useEditMode()

  // Callback for TreeNode to clean up pending paths when real status arrives
  // Only active when NOT rebuilding (prevents cleanup of old KB status)
  const removePendingPath = useMemo(() => {
    return (path: string) => {
      if (isRebuilding) {
        console.log("removePendingPath BLOCKED (rebuilding):", path)
        return // Don't cleanup during rebuild!
      }

      setPendingPaths(prev => {
        console.log("removePendingPath:", path, "prev:", prev)
        if (!prev.has(path)) return prev
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    }
  }, [isRebuilding])

  // ------------- Connection hooks -----------
  const { data: connection, isLoading: connectionsLoading } = useConnection(auth.token)
  const { data: kb, isLoading: kbLoading } = useKnowledgeBase(
    auth.token,
    connection?.connection_id || null
  )


  //--------- Hooks (this case conections and knowledge base re-build) -----------
  const { isLoading: rootResourcesLoading } = useConnectionResources(
    auth.token,
    connection?.connection_id || null,
    null, // null = root folder
    { enabled: !!connection && !!kb }
  )

  const { data: kbResources } = useKBResources(
    auth.token,
    kb?.knowledge_base_id || null,
    '/',
    { enabled: !!kb }
  )

  const rebuildMutation = useRebuildKB(
    auth.token,
    connection?.connection_id || null,
    auth.orgId,
    kb?.knowledge_base_id || null
  )

//--------- callbacks -----------
  const handleSave = async () => {
    if (editMode.selectedPaths.size === 0) {
      toast.error('Please select at least one file or folder')
      return
    }

    const paths = Array.from(editMode.selectedPaths)
    console.log("paths:", paths)
    console.log('[Save] Starting rebuild with paths:', paths)

    // Set rebuilding flag to prevent cleanup of old KB status
    setIsRebuilding(true)

    // INSTANT feedback - set ONLY the selected paths as pending (synchronous)
    setPendingPaths(new Set(paths))
    console.log("set pendingPaths:", pendingPaths)

    
    try {
      await rebuildMutation.mutateAsync({
        selectedPaths: paths,
        pathToResourceId
      })

      // Keep rebuilding flag active for a moment to let new KB status arrive
      // This gives the sync time to start and first status updates to come in
      setTimeout(() => {
        setIsRebuilding(false)
        console.log('[Save] Rebuild complete, cleanup enabled')
      }, 2000) // 2 second delay after sync triggers

    } catch (error) {
      setIsRebuilding(false) // Reset on error
      throw error
    }

    editMode.exitEditMode()
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }



//--------------------------- return  ----------------------------
  
if (connectionsLoading || kbLoading || rootResourcesLoading) {
    return <FilePickerSkeleton />
  }

  const errorMessage = !connection
    ? "No Google Drive connection found"
    : !kb
    ? "No Knowledge Base found"
    : null

  if (errorMessage) {
    return (
      <div className="flex flex-col h-full">
        <FilePickerHeader
          title="Google Drive"
          isEditMode={false}
          isSaving={false}
          onEdit={() => {}}
          onCancel={() => {}}
          onSave={() => {}}
        />
        <div className="flex-1 p-6">
          <div className="text-sm text-gray-500">{errorMessage}</div>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    editMode.enterEditMode() // Don't pre-populate - let TreeNode auto-select via KB data
  }

  return (
    <div className="flex flex-col h-full">
      <FilePickerHeader
        title="Google Drive"
        subtitle="langchain1@gmail.com"
        isEditMode={editMode.isEditMode}
        isSaving={rebuildMutation.isPending}
        onEdit={handleEdit}
        onCancel={editMode.exitEditMode}
        onSave={handleSave}
      />
      <div className="flex-1 p-6 overflow-auto">
        <TreeNode
          path="/"
          folderId={null}
          connectionId={connection.connection_id}
          kbId={kb.knowledge_base_id}
          isOpen={true}
          expandedFolders={expandedFolders}
          onToggle={toggleFolder}
          editMode={editMode.isEditMode ? editMode : null}
          pathToResourceId={pathToResourceId}
          pendingPaths={pendingPaths}
          onPendingCleanup={removePendingPath}
          isRebuilding={isRebuilding}
        />
      </div>
    </div>
  )
}
