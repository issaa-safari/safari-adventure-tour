'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewRequestPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('en')
  const [clientQuestion, setClientQuestion] = useState('')
  const [source, setSource] = useState('')
  const [adults, setAdults] = useState(2)
  const [childrenOlder, setChildrenOlder] = useState(0)
  const [childrenYounger, setChildrenYounger] = useState(0)
  const [preferredDate, setPreferredDate] = useState('')
  const [priority, setPriority] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let clientId: string

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (existingClient) {
        clientId = existingClient.id
        await supabase
          .from('clients')
          .update({ first_name: firstName, last_name: lastName, phone, whatsapp, country, language })
          .eq('id', clientId)
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ email: email.toLowerCase().trim(), first_name: firstName, last_name: lastName, phone, whatsapp, country, language })
          .select('id')
          .single()
        if (clientError) throw clientError
        clientId = newClient.id
      }

      const { data: newRequest, error: requestError } = await supabase
        .from('requests')
        .insert({
          client_id: clientId,
          stage: 'new',
          source: source || null,
          travelers_adults: adults,
          travelers_children_older: childrenOlder,
          travelers_children_younger: childrenYounger,
          preferred_start_date: preferredDate || null,
          client_question: clientQuestion || null,
          priority,
        })
        .select('id')
        .single()

      if (requestError) throw requestError
      router.push(`/admin/requests/${newRequest.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: '#7A9A4A' }} />
          <span className="font-semibold text-gray-900 text-sm leading-tight">Safari Adventure Tour</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Requests', href: '/admin/requests', active: true },
            { label: 'Tours', href: '/admin/tours' },
            { label: 'Content Library', href: '/admin/content' },
            { label: 'Quotes', href: '/admin/quotes' },
            { label: 'Departures', href: '/admin/departures' },
            { label: 'Clients', href: '/admin/clients' },
            { label: 'Finance', href: '/admin/finance' },
            { label: 'Analytics', href: '/admin/analytics' },
            { label: 'Settings', href: '/admin/settings' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-md px-3 py-2 ${item.active ? 'bg-[#7A9A4A]/10 text-[#4C5E2A] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/admin/requests" className="text-sm text-gray-500 hover:text-gray-700">← Requests</Link>
          <h1 className="text-lg font-semibold text-gray-900">New Request</h1>
        </header>

        <main className="flex-1 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]"
                  />
                  <p className="text-xs text-gray-400 mt-1">If this email already exists we link to the existing client automatically.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+254 700 000 000"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Saudi Arabia"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]">
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Request Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client's Question / Message</label>
                  <textarea
                    value={clientQuestion}
                    onChange={e => setClientQuestion(e.target.value)}
                    rows={3}
                    placeholder="What did the client ask? Paste their WhatsApp message or email here..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={source} onChange={e => setSource(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]">
                    <option value="">Select source...</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="website">Website</option>
                    <option value="email">Email</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="referral">Referral</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Start Date</label>
                  <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travelers</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Adults</label>
                      <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Children 12–18</label>
                      <input type="number" min={0} value={childrenOlder} onChange={e => setChildrenOlder(Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Children 2–12</label>
                      <input type="number" min={0} value={childrenYounger} onChange={e => setChildrenYounger(Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="priority" checked={priority} onChange={e => setPriority(e.target.checked)}
                    className="rounded border-gray-300" />
                  <label htmlFor="priority" className="text-sm text-gray-700">Mark as priority request ⭐</label>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-4 py-3">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="rounded-md px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: '#7A9A4A' }}>
                {loading ? 'Saving...' : 'Save Request'}
              </button>
              <Link href="/admin/requests"
                className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
