import { STATUS_VARIANT, VARIANT_CLASSES, STAGE_LABELS } from '@/lib/status-colors'

interface StatusBadgeProps {
  status: string
  label?: string
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = STATUS_VARIANT[status] ?? 'neutral'
  const displayLabel = label ?? STAGE_LABELS[status] ?? status.replace(/_/g, ' ')
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${VARIANT_CLASSES[variant]}`}>
      {displayLabel}
    </span>
  )
}
