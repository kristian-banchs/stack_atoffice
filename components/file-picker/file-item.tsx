'use client'

interface FileItemProps {
  file: any
  status: 'not_indexed' | 'pending' | 'being_indexed' | 'parsed'
}

export function FileItem({ file, status }: FileItemProps) {
  const icon = {
    not_indexed: '○',
    pending: '⏳',
    being_indexed: '⏳',
    parsed: '✓'
  }[status]

  const badge = {
    not_indexed: null,
    pending: <span className="text-xs text-orange-600 font-medium">Pending</span>,
    being_indexed: <span className="text-xs text-blue-600 font-medium">Indexing...</span>,
    parsed: <span className="text-xs text-green-600 font-medium">Indexed</span>
  }[status]

  return (
    <div className="flex items-center gap-2 py-1 px-2 ml-6">
      <span>📄</span>
      <span className="text-sm flex-1">{file.inode_path.path}</span>
      <span className="text-lg">{icon}</span>
      {badge}
    </div>
  )
}
