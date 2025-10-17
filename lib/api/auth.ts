const BASE_URL = 'https://api.stack-ai.com'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3VhZGZxaGtseG9rbWxodHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NTg5ODAsImV4cCI6MTk4OTAzNDk4MH0.Xjry9m7oc42_MsLRc1bZhTTzip3srDjJ6fJMkwhXQ9s'
const AUTH_URL = 'https://sb.stack-ai.com'

// ============================================================================
// AUTH
// ============================================================================

// --------- login -----------
export async function login(email: string, password: string): Promise<string> {
    const requestBody = {
      email,
      password,
      gotrue_meta_security: {}
    }

    console.log('Login request:', { email, url: `${AUTH_URL}/auth/v1/token?grant_type=password` })

    const response = await fetch(`${AUTH_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apikey': ANON_KEY
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Login response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('Login error:', error)
      throw new Error(`Login failed: ${error}`)
    }

    const data = await response.json()
    return data.access_token
  }
  
  // ------- OrgId ------
  export async function getOrgId(token: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/organizations/me/current`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  
    if (!response.ok) {
      throw new Error('Failed to get organization ID')
    }
  
    const data = await response.json()
    return data.org_id
  }