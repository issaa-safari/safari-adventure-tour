'use client'

import { useTransition } from 'react'
import { cloneVersion } from './version-actions'

export default function CloneVersionButton({ quoteId, versionId }: { quoteId: string; versionId: string }) {
  const [pending, start] = useTransition()
  function handle() {
    const fd = new FormData()
    fd.set('quoteId', quoteId)
    fd.set('versionId', versionId)
    start(() => cloneVersion(fd))
  }
  return (
    <button
      onClick={handle}
      disabled={pending}
      title="Clone this version as a new draft"
      className="text-xs text-gray-400 hover:text-[#5C7A3E] disabled:opacity-40 px-2 py-1 rounded border border-gray-200 hover:border-[#C5D9B0] transition"
    >
      {pending ? '…' : '⎘ Clone'}
    </button>
  )
}
