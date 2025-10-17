import { toast } from 'sonner'
import * as api from '../api/knowledge-base'
import { IndexStatus } from '../types'
import { useConnectionResources } from './connection-hooks'
import { useKBResources } from './knowledge-base-hooks'
import { MergedResource } from '../types'
import { useMemo } from 'react'


// ============================================================================
// MUTATION HOOKS (Update KB)
// ============================================================================


export function useMergedResources(
    token: string | null,
    connectionId: string | null,
    kbId: string | null,
    folderId: string | null,
    folderPath: string,
    options?: { enabled?: boolean }
  ) {
    // Fetch connection resources (all Drive files)
    const {
      data: connectionData,
      isLoading: connLoading,
      error: connError
    } = useConnectionResources(token, connectionId, folderId, options)
  
    // Fetch KB resources (indexed files with status)
    const kbPath = folderPath ? `/${folderPath}` : '/'
    const {
      data: kbData,
      isLoading: kbLoading,
      error: kbError
    } = useKBResources(token, kbId, kbPath, options)
  
    // Merge connection resources with KB status
    const merged = useMemo<MergedResource[]>(() => {
      if (!connectionData?.data) return []
  
      // Create lookup map for O(1) status access
      const kbStatusMap = new Map<string, IndexStatus>(
        kbData?.data?.map((r) => [
          r.resource_id,
          r.status as IndexStatus
        ]) || []
      )
  
      // Merge: add indexStatus to each connection resource
      return connectionData.data.map((resource) => ({
        ...resource,
        indexStatus: kbStatusMap.get(resource.resource_id) || 'not_indexed'
      }))
    }, [connectionData, kbData])
  
    return {
      resources: merged,
      isLoading: connLoading || kbLoading,
      error: connError || kbError
    }
  }