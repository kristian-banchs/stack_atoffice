'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TreeNodeSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-full rounded" />
      ))}
    </div>
  )
}
