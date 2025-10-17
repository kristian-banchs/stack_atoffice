'use client'

import { Check, Clock } from 'lucide-react'

import { IndexStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: IndexStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'parsed' || status === 'indexed') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
        <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
      </div>
    )
  }

  // 'error' is a transient state during KB rebuild/setup - show as pending
  if (status === 'pending' || status === 'being_indexed' || status === 'error') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 animate-pulse">
        <Clock className="w-3.5 h-3.5 text-orange-600" />
      </div>
    )
  }

  return null
}
