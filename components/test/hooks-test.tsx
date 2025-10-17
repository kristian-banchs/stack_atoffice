/**
 * Lightweight Hook Testing Component
 * Use this to test and visualize data flow
 *
 * Usage:
 * 1. Add to a test page
 * 2. Login with credentials
 * 3. Watch console and UI for data
 */

'use client'

import { useState } from 'react'
import {
  useAuth,
  useConnection,
  useConnectionResources,
  useKnowledgeBase,
  useKBResources,
  useMergedResources,
  useDebugData
} from '@/lib/hooks'

export function HooksTest() {
  const [showDebug, setShowDebug] = useState(false)

  // Step 1: Auth
  const auth = useAuth()

  // Step 2: Connection (depends on auth)
  const connection = useConnection(auth.token)
  const connectionId = connection.data?.connection_id || null

  // Step 3: Knowledge Base (depends on connection)
  const kb = useKnowledgeBase(auth.token, connectionId)
  const kbId = kb.data?.knowledge_base_id || null

  // Step 4: Merged Resources (root level)
  const merged = useMergedResources(
    auth.token,
    connectionId,
    kbId,
    null, // root
    '' // empty path
  )

  // Debug data
  const debug = useDebugData(auth.token, connectionId, kbId)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Hook Testing Dashboard</h1>

      {/* Auth Section */}
      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">1. Authentication</h2>

        {!auth.isAuthenticated ? (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              defaultValue="stackaitest@gmail.com"
              className="w-full px-3 py-2 border rounded"
              id="email"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded"
              id="password"
            />
            <button
              onClick={() => {
                const email = (document.getElementById('email') as HTMLInputElement).value
                const password = (document.getElementById('password') as HTMLInputElement).value
                auth.login({ email, password })
              }}
              disabled={auth.isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {auth.isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-green-600">✓ Authenticated</p>
            <p className="text-sm text-gray-600">
              Token: {auth.token?.substring(0, 30)}...
            </p>
            <p className="text-sm text-gray-600">Org ID: {auth.orgId}</p>
          </div>
        )}
      </section>

      {/* Connection Section */}
      {auth.isAuthenticated && (
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">2. Google Drive Connection</h2>

          {connection.isLoading && <p>Loading connection...</p>}

          {connection.error && (
            <p className="text-red-600">Error: {connection.error.message}</p>
          )}

          {connection.data && (
            <div className="space-y-2">
              <p className="text-green-600">✓ Connection Found</p>
              <p className="text-sm text-gray-600">
                Connection ID: {connection.data.connection_id}
              </p>
              <p className="text-sm text-gray-600">
                Name: {connection.data.name}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Knowledge Base Section */}
      {connectionId && (
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">3. Knowledge Base</h2>

          {kb.isLoading && <p>Loading/Creating Knowledge Base...</p>}

          {kb.error && (
            <p className="text-red-600">Error: {kb.error.message}</p>
          )}

          {kb.data && (
            <div className="space-y-2">
              <p className="text-green-600">✓ Knowledge Base Ready</p>
              <p className="text-sm text-gray-600">KB ID: {kb.data.knowledge_base_id}</p>
              <p className="text-sm text-gray-600">Name: {kb.data.name}</p>
              <p className="text-sm text-gray-600">
                Indexed Sources: {kb.data.connection_source_ids.length}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Merged Resources Section */}
      {kbId && (
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">4. Root Resources (Merged)</h2>

          {merged.isLoading && <p>Loading resources...</p>}

          {merged.error && (
            <p className="text-red-600">Error: {merged.error.message}</p>
          )}

          {merged.resources && merged.resources.length > 0 && (
            <div className="space-y-3">
              <p className="text-green-600">
                ✓ Found {merged.resources.length} resources
              </p>

              <div className="space-y-2 max-h-96 overflow-auto">
                {merged.resources.map((resource) => (
                  <div
                    key={resource.resource_id}
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{resource.inode_type === 'directory' ? '📁' : '📄'}</span>
                      <span className="font-medium">{resource.inode_path.path}</span>
                      <span
                        className={`ml-auto px-2 py-0.5 rounded text-xs ${
                          resource.indexStatus === 'indexed'
                            ? 'bg-green-100 text-green-700'
                            : resource.indexStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : resource.indexStatus === 'being_indexed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {resource.indexStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {resource.resource_id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Debug Section */}
      {auth.isAuthenticated && (
        <section className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">5. Debug Data</h2>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>
          </div>

          {showDebug && (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-xs max-h-96">
              {JSON.stringify(debug, null, 2)}
            </pre>
          )}
        </section>
      )}

      {/* Instructions */}
      <section className="border border-blue-200 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Login with provided credentials</li>
          <li>Watch each section populate with data</li>
          <li>Check console for any errors</li>
          <li>Verify merged resources show correct index status</li>
          <li>Click "Show Debug" to see raw data</li>
        </ol>
      </section>
    </div>
  )
}
