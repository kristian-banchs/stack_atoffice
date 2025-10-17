'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IntegrationsModal } from '@/components/dashboard/integrations-modal'
import { Sidebar } from '@/components/file-picker/sidebar'
import { FilePickerModal } from '@/components/file-picker/file-picker-modal'
import { FilePickerSkeleton } from '@/components/skeleton/file-picker-skeleton'
import { useAuth } from '@/lib/hooks/auth-hooks'
import { useConnection } from '@/lib/hooks/connection-hooks'
import { useKnowledgeBase } from '@/lib/hooks/knowledge-base-hooks'

export default function DashboardPage() {
  const auth = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const { data: connection, isLoading: connectionLoading } = useConnection(auth.token)
  const { data: kb, isLoading: kbLoading } = useKnowledgeBase(auth.token, connection?.connection_id || null)



//--------- useEffect -----------
  useEffect(() => {
    setMounted(true)
  }, [])


  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !auth.isAuthenticated) {
      router.push('/')
    }
  }, [mounted, auth.isAuthenticated, router])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  if (!auth.isAuthenticated) {
    return null
  }

//--------- isLoading -----------
  const isLoading = connectionLoading || kbLoading

  return (
    <IntegrationsModal>
      <Sidebar
        selectedIntegration={selectedIntegration}
        onSelect={setSelectedIntegration}
      />
      <main className="flex-1 overflow-auto">
        {selectedIntegration === 'google-drive' ? (
          isLoading ? (
            <FilePickerSkeleton />
          ) : (
            <FilePickerModal />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Select an Integration</h2>
              <p className="text-sm text-gray-500">Choose an integration from the sidebar to get started</p>
            </div>
          </div>
        )}
      </main>
    </IntegrationsModal>
  )
}
