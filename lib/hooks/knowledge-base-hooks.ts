import { useQuery } from "@tanstack/react-query"
import * as api from '../api/knowledge-base'
import { KBResourcesResponse } from "../types"


// ============================================================================
// KNOWLEDGE BASE HOOKS
// ============================================================================



//-------- 
export function useKnowledgeBase(
    token: string | null,
    connectionId: string | null
  ) {
    return useQuery({
      queryKey: ['knowledge-base', connectionId],
      queryFn: async () => {
        // Try to get existing KB for this connection
        const kbs = await api.getKnowledgeBases(token!, connectionId!)
  
        if (kbs && kbs.length > 0) {
          return kbs[0] // Return existing KB
        }
  
        // No KB exists - create one
        const newKB = await api.createKB(token!, {
          connection_id: connectionId!,
          connection_source_ids: [], // Start empty
          name: 'Google Drive Knowledge Base',
          description: 'Indexed files from Google Drive',
          indexing_params: {
            ocr: false,
            unstructured: true,
            embedding_params: {
              embedding_model: 'text-embedding-ada-002',
              api_key: null
            },
            chunker_params: {
              chunk_size: 1500,
              chunk_overlap: 500,
              chunker: 'sentence'
            }
          },
          org_level_role: null,
          cron_job_id: null
        })
  
        return newKB
      },
      enabled: !!token && !!connectionId,
      staleTime: Infinity, // KB rarely changes
      retry: 1
    })
  }
  
  /**
   * Fetch indexed resources from Knowledge Base
   *
   * @param token - Auth token
   * @param kbId - Knowledge Base ID
   * @param path - Path to list (e.g., "/" or "/clients/project-alpha")
   * @param options - Query options
   */
  export function useKBResources(
    token: string | null,
    kbId: string | null,
    path: string,
    options?: { enabled?: boolean }
  ) {
    return useQuery<KBResourcesResponse>({
      queryKey: ['kb-resources', kbId, path],
      queryFn: () => api.getKBResources(token!, kbId!, path),
      enabled: !!token && !!kbId && (options?.enabled ?? true),
      staleTime: 3000, // 3 seconds (for polling)
      refetchInterval: (query) => {
        // Only poll if FILES (not directories) are pending/being_indexed
        // Directories don't have status - they're just virtual containers
        if (!query.state.data?.data) return false

        const hasPendingFiles = query.state.data.data.some(
          (r) => r.inode_type === 'file' && (r.status === 'pending' || r.status === 'being_indexed')
        )
        return hasPendingFiles ? 3000 : false
      },
      retry: 2
    })
  }
  