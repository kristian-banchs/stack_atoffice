'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/file-picker/sidebar'
import { FilePickerModal } from '@/components/file-picker/file-picker-modal'
import { useAuth } from '@/lib/hooks/auth-hooks'

export default function DashboardPage() {
  const auth = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  //this is being done so that we can wkeep state the same and orevent hydration faliure
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <FilePickerModal />
      </main>
    </div>
  )
}
