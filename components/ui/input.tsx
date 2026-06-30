import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const FIELD_CLS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

export function Field({
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className={`${FIELD_CLS} ${className}`} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function TextareaField({
  label,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea className={`${FIELD_CLS} ${className}`} {...props} />
    </div>
  )
}

export function SelectField({
  label,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className={`${FIELD_CLS} ${className}`} {...props}>
        {children}
      </select>
    </div>
  )
}
