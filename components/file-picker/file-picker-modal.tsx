'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/auth-hooks'
import { useConnection } from '@/lib/hooks/connection-hooks'
import { useKnowledgeBase } from '@/lib/hooks/knowledge-base-hooks'
import { TreeNode } from './tree-node'

export function FilePickerModal() {
  const auth = useAuth()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

  // ------------- Connection hooks -----------
  const { data: connection, isLoading: connectionsLoading } = useConnection(auth.token)

  const { data: kb, isLoading: kbLoading } = useKnowledgeBase(
    auth.token,
    connection?.connection_id || null
  )



  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  if (connectionsLoading || kbLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google Drive Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!connection) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google Drive Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">No Google Drive connection found</div>
        </CardContent>
      </Card>
    )
  }

  if (!kb) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google Drive Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">No Knowledge Base found for this connection</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google Drive Files</CardTitle>
      </CardHeader>
      <CardContent>
        <TreeNode
          path="/"
          folderId={null}
          connectionId={connection.connection_id}
          kbId={kb.knowledge_base_id}
          isOpen={true}
          expandedFolders={expandedFolders}
          onToggle={toggleFolder}
        />
      </CardContent>
    </Card>
  )
}
