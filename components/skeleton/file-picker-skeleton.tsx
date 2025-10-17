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

      {/* File tree - solid row skeletons */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-1">
          {/* Solid rows matching actual file/folder row height */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
