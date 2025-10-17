import { CreateKBRequest, KBResourcesResponse } from "../types"

import { KBDetails } from "../types"

const BASE_URL = 'https://api.stack-ai.com'


// ============================================================================
// KNOWLEDGE BASES establish kb, Index,  sync
// ============================================================================



// --------- get knowledge bases -----------
export async function getKnowledgeBases(
    token: string,
    connectionId: string
  ): Promise<{ admin: KBDetails[] }> {
    const response = await fetch(
      `${BASE_URL}/knowledge_bases?connection_id=${connectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!response.ok) {
      // If 404 or error, return empty structure
      return { admin: [] }
    }

    return response.json()
  }
  
  // --------- create knowledge base -----------
  export async function createKB(
    token: string,
    data: CreateKBRequest
  ): Promise<KBDetails> {
    const response = await fetch(`${BASE_URL}/knowledge_bases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  
    if (!response.ok) {
      throw new Error('Failed to create Knowledge Base')
    }
  
    return response.json()
  }
  

  
  
  export async function getKBResources(
    token: string,
    kbId: string,
    path: string
  ): Promise<KBResourcesResponse> {
    const response = await fetch(
      `${BASE_URL}/knowledge_bases/${kbId}/resources/children?resource_path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  
    if (!response.ok) {
      // If no resources indexed yet, might return 404
      // Return empty array instead of error
      if (response.status === 404) {
        return { data: [], next_cursor: null, current_cursor: null }
      }
      throw new Error('Failed to fetch KB resources')
    }
  
    return response.json()
  }
    

  
  // --------- trigger sync/indexing for knowledge base -----------
  export async function syncKB(
    token: string,
    kbId: string,
    orgId: string
  ): Promise<void> {
    const response = await fetch(
      `${BASE_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  
    if (!response.ok) {
      throw new Error('Failed to trigger KB sync')
    }
  
  }
  

  // --------- create/upload a file to knowledge base -----------
  export async function createKBResource(
    token: string,
    kbId: string,
    file: File,
    resourcePath: string
  ): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('resource_type', 'file')
    formData.append('resource_path', resourcePath)

    const response = await fetch(
      `${BASE_URL}/knowledge_bases/${kbId}/resources`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData // Browser automatically sets Content-Type: multipart/form-data
      }
    )

    if (!response.ok) {
      throw new Error('Failed to create KB resource')
    }
  }



  // --------- delete/de-index a resource from knowledge base -----------
  export async function deleteKBResource(
    token: string,
    kbId: string,
    path: string
  ): Promise<void> {
    const response = await fetch(
      `${BASE_URL}/knowledge_bases/${kbId}/resources?resource_path=${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete KB resource')
    }
  }

  // --------- delete knowledge base -----------
  export async function deleteKB(
    token: string,
    kbId: string
  ): Promise<void> {
    const response = await fetch(
      `${BASE_URL}/knowledge_bases/${kbId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete Knowledge Base')
    }
  }
