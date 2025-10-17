'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TreeNodeSkeleton() {
  return (
    <div className="ml-4 space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}
