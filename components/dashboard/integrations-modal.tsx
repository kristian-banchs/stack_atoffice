'use client'

interface IntegrationsModalProps {
  children: React.ReactNode
}

export function IntegrationsModal({ children }: IntegrationsModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}
