import { ReactNode } from 'react'

export function Alert({
  variant,
  children,
}: {
  variant: 'error' | 'success'
  children: ReactNode
}) {
  const cls =
    variant === 'error'
      ? 'bg-red-50 text-red-600'
      : 'bg-green-50 text-green-700'
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={`text-sm rounded-md px-4 py-3 ${cls}`}
    >
      {children}
    </p>
  )
}
