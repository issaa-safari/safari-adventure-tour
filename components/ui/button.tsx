import Link from 'next/link'
import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger-text'
type Size = 'sm' | 'md'

const VARIANT_CLS: Record<Variant, string> = {
  primary:      'bg-olive text-white hover:bg-olive-dk disabled:opacity-60',
  secondary:    'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50',
  'danger-text': 'text-red-600 hover:text-red-700 disabled:opacity-40',
}

const SIZE_CLS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  loadingText?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  loadingText,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-md font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
      {...props}
    >
      {loading ? (loadingText ?? 'Saving…') : children}
    </button>
  )
}

export function ButtonLink({
  href,
  size = 'md',
  className = '',
  children,
}: {
  href: string
  size?: Size
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`inline-block rounded-md border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors ${SIZE_CLS[size]} ${className}`}
    >
      {children}
    </Link>
  )
}
