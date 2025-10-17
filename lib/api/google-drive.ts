

import type { ConnectionResourcesResponse } from '../types'


const BASE_URL = 'https://api.stack-ai.com'

// ============================================================================
// CONNECTIONS Get Connection and resources GD
// ============================================================================




// --------- google drive connections -----------
export async function getConnections(token: string): Promise<any[]> {
    const response = await fetch(
      `${BASE_URL}/connections?connection_provider=gdrive&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  
    if (!response.ok) {
      throw new Error('Failed to fetch connections')
    }
  
    return response.json()
  }
  


  // --------- get connection resources -----------

  export async function getConnectionResources(
    token: string,
    connectionId: string,
    folderId: string | null
  ): Promise<ConnectionResourcesResponse> {
    const url = folderId
      ? `${BASE_URL}/connections/${connectionId}/resources/children?resource_id=${folderId}`
      : `${BASE_URL}/connections/${connectionId}/resources/children`
  
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
  
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`)
    }
  
    return response.json()
  }
  