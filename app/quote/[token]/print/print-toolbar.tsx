'use client'

const G = '#7A9A4A'

// Client component: the print/back buttons need event handlers, which a Server
// Component cannot render. Keeping them here fixes the "page couldn't load" error.
export default function PrintToolbar() {
  return (
    <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', gap: 8 }}>
      <button
        onClick={() => window.print()}
        style={{ background: G, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
      >
        Print / Save PDF
      </button>
      <button
        onClick={() => window.history.back()}
        style={{ background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
      >
        ← Back
      </button>
    </div>
  )
}
