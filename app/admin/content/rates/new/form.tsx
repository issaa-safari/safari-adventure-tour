'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createRateCard } from './actions'
import { COST_CATEGORIES, ENTITY_TYPES, label } from '../constants'

type Entity = { id: string; name: string }
type Entities = Record<string, Entity[]>
const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]'
const linkedTypes = new Set(['accommodation', 'activity', 'vehicle', 'staff', 'destination'])

export default function NewRateCardForm({ entities }: { entities: Entities }) {
  const [entityType, setEntityType] = useState('accommodation')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const formData = new FormData(event.currentTarget)
    formData.set('isActive', String(isActive))
    try { await createRateCard(formData) }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create rate card.'); setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6"><Link href="/admin/content/rates" className="text-sm text-gray-500 hover:text-gray-700">← Supplier Rates</Link><h1 className="text-lg font-semibold text-gray-900">New Rate Card</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" required className={inputCls} placeholder="e.g. Mara Lodge High Season 2027" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label><input name="supplierName" className={inputCls} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label><select name="entityType" value={entityType} onChange={e => setEntityType(e.target.value)} className={inputCls}>{ENTITY_TYPES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost Category</label><select name="costCategory" defaultValue="accommodation" className={inputCls}>{COST_CATEGORIES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></div>
          </div>
          {linkedTypes.has(entityType) && <div><label className="block text-sm font-medium text-gray-700 mb-1">Linked Content</label><select name="entityId" defaultValue="" className={inputCls}><option value="">No linked item</option>{(entities[entityType] ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label><input type="date" name="validFrom" required className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label><input type="date" name="validTo" required className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><input name="currency" defaultValue="USD" maxLength={3} required className={inputCls} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea name="notes" rows={3} className={inputCls} /></div>
          <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#7A9A4A]" />Active</label>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-4 py-3">{error}</p>}
        <div className="flex gap-3"><button disabled={loading} className="rounded-md px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: '#7A9A4A' }}>{loading ? 'Creating…' : 'Create Rate Card'}</button><Link href="/admin/content/rates" className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700">Cancel</Link></div>
      </form>
    </div>
  )
}
