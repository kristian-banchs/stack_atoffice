import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

/**
 * Delete individual file from KB
 */
export function useDeleteKBFile(token: string | null, kbId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filePath: string) =>
      api.deleteKBResource(token!, kbId!, filePath),
    onMutate: async (filePath) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kb-resources', kbId] })

      // Snapshot previous values for rollback
      const previousData = queryClient.getQueriesData({ queryKey: ['kb-resources', kbId] })

      // Normalize the target path (ensure it starts with /)
      const normalizedFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`

      // Optimistically remove the file from all kb-resources queries so that it appears null and not indexed
      queryClient.setQueriesData(
        { queryKey: ['kb-resources', kbId] },
        (old: unknown) => {
          if (!old || typeof old !== 'object' || !('data' in old)) return old
          const oldData = old as { data: Array<{ resource_path?: string; inode_path?: { path?: string }; resource_id?: string }> }
          return {
            ...old,
            data: oldData.data.filter((item) => {
              // Normalize item path to always have leading /
              const itemPath = item.resource_path
                ? (item.resource_path.startsWith('/') ? item.resource_path : `/${item.resource_path}`)
                : `/${item.inode_path?.path || ''}`

              return itemPath !== normalizedFilePath
            })
          }
        }
      )

      return { previousData }
    },
    onSuccess: () => {
      

      // Delay invalidation to allow server-side deletion to propagate
      // This prevents the file from reappearing due to race condition
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['kb-resources', kbId] })
      }, 1000)
    },
    onError: (_error, _filePath, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to remove file')

      // Still invalidate on error to sync with server state
      queryClient.invalidateQueries({ queryKey: ['kb-resources', kbId] })
    }
  })
}

/**
 * Rebuild KB with new selection
 * Deletes old KB and creates new one with selected paths
 */
export function useRebuildKB(
  token: string | null,
  connectionId: string | null,
  orgId: string | null,
  currentKbId: string | null
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ selectedPaths, pathToResourceId }: {
      selectedPaths: string[]
      pathToResourceId: Map<string, string>
    }) => {
      // Get resource IDs from the map (no fetching needed!)
      const resourceIds = selectedPaths.map(path => {
        const resourceId = pathToResourceId.get(path)
        if (!resourceId) throw new Error(`Resource ID not found for path: ${path}`)
        return resourceId
      })

      // Delete old KB
      await api.deleteKB(token!, currentKbId!)

      // Create new KB
      const newKb = await api.createKB(token!, {
        connection_id: connectionId!,
        connection_source_ids: resourceIds,
        name: "Google Drive Knowledge Base",
        description: "Files from Google Drive",
        indexing_params: {
          ocr: false,
          unstructured: true,
          embedding_params: { embedding_model: "text-embedding-ada-002", api_key: null },
          chunker_params: { chunk_size: 1500, chunk_overlap: 500, chunker: "sentence" }
        },
        org_level_role: null,
        cron_job_id: null
      })

      // Trigger sync
      await api.syncKB(token!, newKb.knowledge_base_id, orgId!)

      return { newKb, selectedPaths, pathToResourceId }
    },
    onSuccess: ({ newKb }) => {
      // Update the KB cache with new KB
      queryClient.setQueryData(['knowledge-base', connectionId], newKb)

      // Invalidate kb-resources to trigger refetch with new KB
      queryClient.invalidateQueries({ queryKey: ['kb-resources'] })

      toast.success('Knowledge Base rebuilt successfully')
    },
    onError: (error) => {
      toast.error('Failed to rebuild KB: ' + (error as Error).message)
    }
  })
}