import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import * as api from '../api/google-drive'


// ============================================================================
// CONNECTION HOOKS
// ============================================================================

import { ConnectionResourcesResponse } from "../types"

//--------- get connection -----------
export function useConnection(token: string | null) {
    return useQuery({
      queryKey: ['connection', token],
      queryFn: async () => {
        const connections = await api.getConnections(token!)
        if (!connections || connections.length === 0) {
          throw new Error('No Google Drive connection found')
        }
        return connections[0] // Return first connection
      },
      enabled: !!token,
      staleTime: Infinity, // Connection rarely changes
      retry: 1
    })
  }
  
  

  //--------- get connection resources -----------
  export function useConnectionResources(
    token: string | null,
    connectionId: string | null,
    folderId: string | null,
    options?: { enabled?: boolean; staleTime?: number; cacheTime?: number }
  ) {
    return useQuery<ConnectionResourcesResponse>({
      queryKey: ['connection-resources', connectionId, folderId],
      queryFn: () => api.getConnectionResources(token!, connectionId!, folderId),
      enabled: !!token && !!connectionId && (options?.enabled ?? true),
      staleTime: options?.staleTime ?? 5 * 60 * 1000, // Default 5 minutes, but can override
      retry: 2
    })
  }

  

  //--------- prefetch child folders(connections resources) -----------
  export function usePrefetchChildFolders(
    token: string | null,
    connectionId: string | null,
    childFolders: Array<{ resource_id: string }> | null
  ) {
    const queryClient = useQueryClient()

    useEffect(() => {
      if (!token || !connectionId || !childFolders || childFolders.length === 0) return

      // Prefetch all child folders in parallel (not waterfall)
      Promise.all(
        childFolders.map(folder =>
          queryClient.prefetchQuery({
            queryKey: ['connection-resources', connectionId, folder.resource_id],
            queryFn: () => api.getConnectionResources(token, connectionId, folder.resource_id),
            staleTime: Infinity
          })
        )
      )
    }, [token, connectionId, childFolders, queryClient])
  }
