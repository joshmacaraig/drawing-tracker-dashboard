import { RiskLevel } from '@/types'

interface RiskBadgeProps {
  risk: string | null
  size?: 'sm' | 'md'
}

const riskConfig: Record<string, { label: string; className: string }> = {
  'Late': { label: 'Late', className: 'bg-red-100 text-red-700 border border-red-200' },
  'At Risk': { label: 'At Risk', className: 'bg-orange-100 text-orange-700 border border-orange-200' },
  'Missing Info': { label: 'Missing Info', className: 'bg-gray-100 text-gray-600 border border-gray-300' },
  'On Track': { label: 'On Track', className: 'bg-green-100 text-green-700 border border-green-200' },
}

export default function RiskBadge({ risk, size = 'sm' }: RiskBadgeProps) {
  const config = risk ? riskConfig[risk] : riskConfig['Missing Info']
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  )
}
