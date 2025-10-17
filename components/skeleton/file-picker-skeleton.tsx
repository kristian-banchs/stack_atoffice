'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function FilePickerSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-16" />
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2">
          {/* Folder items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 py-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              {/* File items under folder */}
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-2 py-1 ml-6">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-6 w-6 rounded-full ml-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
