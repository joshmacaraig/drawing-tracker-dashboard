interface StatusBadgeProps {
  status: string | null
}

function getStatusStyle(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500 border border-gray-200'
  const s = status.toLowerCase().trim()
  if (s === 'a' || s === 'status a' || s === 'approved' || s === 'final') {
    return 'bg-green-100 text-green-800 border border-green-200'
  }
  if (s === 'b' || s === 'status b') {
    return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  }
  if (s === 'c' || s === 'status c') {
    return 'bg-purple-100 text-purple-800 border border-purple-200'
  }
  if (s.includes('under review')) {
    return 'bg-orange-100 text-orange-800 border border-orange-200'
  }
  if (s.includes('awaiting')) {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  }
  if (s.includes('in progress') || s.includes('wip')) {
    return 'bg-blue-100 text-blue-800 border border-blue-200'
  }
  return 'bg-gray-100 text-gray-700 border border-gray-200'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(status)}`}>
      {status ?? 'No Status'}
    </span>
  )
}
