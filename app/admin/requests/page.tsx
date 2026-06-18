import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
  { key: 'new', label: 'New', color: 'amber' },
  { key: 'working_on', label: 'Working On', color: 'blue' },
  { key: 'open', label: 'Open', color: 'purple' },
  { key: 'pre_booked', label: 'Pre-Booked', color: 'orange' },
  { key: 'booked', label: 'Booked', color: 'green' },
  { key: 'completed', label: 'Completed', color: 'emerald' },
  { key: 'not_booked', label: 'Not Booked', color: 'gray' },
]

const STAGE_COLORS: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  gray: 'bg-gray-100 text-gray-600',
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; search?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const params = await searchParams
  const activeStage = params.stage ?? 'new'
  const search = params.search ?? ''

  // Get counts for all stages
  const { data: allRequests } = await supabase
    .from('requests')
    .select('stage')

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.key] = (allRequests ?? []).filter(r => r.stage === s.key).length
    return acc
  }, {} as Record<string, number>)

  // Get requests for active stage
  let query = supabase
    .from('requests')
    .select(`
      *,
      clients (
        first_name,
        last_name,
        email,
        country,
        whatsapp
      ),
      tours (
        title_en
      )
    `)
    .eq('stage', activeStage)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`client_question.ilike.%${search}%`)
  }

  const { data: requests } = await query

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Requests</h1>
          <Link
            href="/admin/requests/new"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#7A9A4A' }}
          >
            + New Request
          </Link>
        </header>

        <div className="flex flex-1 min-w-0">
          {/* Stage sidebar */}
          <div className="w-48 bg-white border-r border-gray-200 p-3 flex flex-col gap-1">
            {STAGES.map((stage) => (
              <Link
                key={stage.key}
                href={`/admin/requests?stage=${stage.key}`}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                  activeStage === stage.key
                    ? 'bg-[#7A9A4A]/10 text-[#4C5E2A] font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{stage.label}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activeStage === stage.key ? 'bg-[#7A9A4A] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stageCounts[stage.key] ?? 0}
                </span>
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/admin/requests?running=true"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <span>🚌</span>
                <span>Running Tours</span>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">0</span>
              </Link>
            </div>
          </div>

          {/* Request list */}
          <div className="flex-1 p-6">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search requests..."
                defaultValue={search}
                className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9A4A]"
              />
            </div>

            {/* Request cards */}
            {!requests || requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-gray-500 text-sm">
                  No requests in <strong>{STAGES.find(s => s.key === activeStage)?.label}</strong> stage
                </p>
                <Link
                  href="/admin/requests/new"
                  className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#7A9A4A' }}
                >
                  + Add First Request
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => {
                  const client = req.clients as any
                  const tour = req.tours as any
                  const clientName = client
                    ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
                    : 'Unknown Client'
                  const stageInfo = STAGES.find(s => s.key === req.stage)

                  return (
                    <Link
                      key={req.id}
                      href={`/admin/requests/${req.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#7A9A4A] hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 font-mono">{req.reference}</span>
                            {req.priority && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                ⭐ Priority
                              </span>
                            )}
                            {stageInfo && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[stageInfo.color]}`}>
                                {stageInfo.label}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{clientName}</p>
                          {tour && (
                            <p className="text-sm text-gray-500 mt-0.5">{tour.title_en}</p>
                          )}
                          {req.client_question && (
                            <p className="text-sm text-gray-400 mt-1 truncate">{req.client_question}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400 shrink-0">
                          <p>{req.travelers_adults} adult{req.travelers_adults !== 1 ? 's' : ''}</p>
                          {req.preferred_start_date && (
                            <p className="mt-1">{new Date(req.preferred_start_date).toLocaleDateString('en-GB')}</p>
                          )}
                          <p className="mt-1">{new Date(req.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
