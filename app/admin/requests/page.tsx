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
  searchParams: Promise<{ stage?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const params = await searchParams
  const activeStage = params.stage ?? 'new'

  const { data: allRequests } = await supabase.from('requests').select('stage')
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.key] = (allRequests ?? []).filter(r => r.stage === s.key).length
    return acc
  }, {} as Record<string, number>)

  const { data: requests } = await supabase
    .from('requests')
    .select('*, clients (first_name, last_name, email), tours (title_en)')
    .eq('stage', activeStage)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-1 min-h-screen">
      <div className="w-48 bg-white border-r border-gray-200 p-3 flex flex-col gap-1">
        <Link href="/admin/requests/new"
          className="mb-3 rounded-md px-3 py-2 text-sm font-medium text-white text-center"
          style={{ backgroundColor: '#7A9A4A' }}>
          + New Request
        </Link>
        {STAGES.map((stage) => (
          <Link key={stage.key}
            href={"/admin/requests?stage=" + stage.key}
            className={"flex items-center justify-between rounded-md px-3 py-2 text-sm transition " +
              (activeStage === stage.key
                ? 'bg-[#7A9A4A]/10 text-[#4C5E2A] font-medium'
                : 'text-gray-600 hover:bg-gray-50')}>
            <span>{stage.label}</span>
            <span className={"text-xs font-medium px-2 py-0.5 rounded-full " +
              (activeStage === stage.key
                ? 'bg-[#7A9A4A] text-white'
                : 'bg-gray-100 text-gray-600')}>
              {stageCounts[stage.key] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-4">
          {STAGES.find(s => s.key === activeStage)?.label} Requests
        </h1>
        {!requests || requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm">No requests in this stage.</p>
            <Link href="/admin/requests/new"
              className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#7A9A4A' }}>
              + Add First Request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req: any) => {
              const client = req.clients
              const tour = req.tours
              const clientName = client
                ? (client.first_name + ' ' + client.last_name).trim()
                : 'Unknown'
              const stageInfo = STAGES.find(s => s.key === req.stage)
              return (
                <Link key={req.id}
                  href={"/admin/requests/" + req.id}
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#7A9A4A] hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">{req.reference}</span>
                        {req.priority && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Priority</span>
                        )}
                        {stageInfo && (
                          <span className={"text-xs px-2 py-0.5 rounded-full " + STAGE_COLORS[stageInfo.color]}>
                            {stageInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{clientName}</p>
                      {tour && <p className="text-sm text-gray-500 mt-0.5">{tour.title_en}</p>}
                      {req.client_question && (
                        <p className="text-sm text-gray-400 mt-1 truncate">{req.client_question}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      <p>{req.travelers_adults} adults</p>
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
  )
}