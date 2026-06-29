'use client'

// "Save as PDF" via the browser's native print dialog — no server PDF needed.
export default function PrintButton({ label = 'Download confirmation (PDF)' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 print:hidden"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4a2 2 0 002 2h12a2 2 0 002-2v-4M12 12v9m0 0l-3-3m3 3l3-3M4 8V4a2 2 0 012-2h8l6 6v0" />
      </svg>
      {label}
    </button>
  )
}
