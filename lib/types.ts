/**
 * TypeScript types for File Picker
 * API responses and internal types
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ConnectionResource {
  resource_id: string
  inode_path: {
    path: string // Full path: "clients/project-alpha/file.txt"
  }
  inode_type: 'file' | 'directory'
}

export interface KBResource extends ConnectionResource {
  status: 'pending' | 'being_indexed' | 'indexed'
}

export interface ConnectionResourcesResponse {
  data: ConnectionResource[]
  next_cursor: string | null
  current_cursor: string | null
}

export interface KBResourcesResponse {
  data: KBResource[]
  next_cursor: string | null
  current_cursor: string | null
}

export interface KBDetails {
  knowledge_base_id: string
  connection_id: string
  created_at: string
  updated_at: string
  connection_source_ids: string[]
  website_sources: any[]
  connection_provider_type: string
  is_empty: boolean
  total_size: number
  name: string
  description: string
  indexing_params: {
    ocr: boolean
    unstructured: boolean
    embedding_params: {
      embedding_model: string
      api_key: string | null
      api?: string | null
      base_url?: string | null
      provider?: string | null
      batch_size?: number
      track_usage?: boolean
      timeout?: number
    }
    chunker_params: {
      chunk_size: number
      chunk_overlap: number
      chunker: string
      chunker_type?: string
    }
  }
  cron_job_id: string | null
  org_id: string
  org_level_role: string | null
  user_metadata_schema: any | null
  dataloader_metadata_schema: any | null
}

export interface CreateKBRequest {
  connection_id: string
  connection_source_ids: string[]
  name: string
  description: string
  indexing_params: {
    ocr: boolean
    unstructured: boolean
    embedding_params: {
      embedding_model: string
      api_key: string | null
    }
    chunker_params: {
      chunk_size: number
      chunk_overlap: number
      chunker: string
    }
  }
  org_level_role: string | null
  cron_job_id: string | null
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

export type IndexStatus = 'not_indexed' | 'pending' | 'being_indexed' | 'parsed'

export interface MergedResource extends ConnectionResource {
  indexStatus: IndexStatus
}

export interface Selection {
  resource_id: string
  fullPath: string // "clients/project-alpha"
  type: 'file' | 'directory'
}

export interface AuthResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  refresh_token?: string
  user?: any
}
