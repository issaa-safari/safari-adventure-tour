import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const KES_RATE = 129

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n * KES_RATE)
}

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'working_on', label: 'Working On' },
  { key: 'open', label: 'Open' },
  { key: 'pre_booked', label: 'Pre-Booked' },
  { key: 'booked', label: 'Booked' },
  { key: 'completed', label: 'Completed' },
  { key: 'not_booked', label: 'Not Booked' },
]

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: monthlyPayments },
    { count: activeBookingsCount },
    { data: openBookings },
    { count: newEnquiriesCount },
    { data: requestsForStages },
    { data: upcomingDepartures },
    { data: balanceDueSoon },
    { data: expiringQuotes },
  ] = await Promise.all([
    supabase.from('payments').select('amount_usd').eq('status', 'completed').gte('paid_at', startOfMonth),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['deposit_paid', 'confirmed', 'balance_due', 'fully_paid']),
    supabase.from('bookings').select('total_price_usd, deposit_paid_usd, balance_paid_usd').not('status', 'in', '(cancelled,refunded,completed,pending)'),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('stage', 'new'),
    supabase.from('requests').select('stage'),
    supabase.from('departures').select('*').gte('start_date', now.toISOString().slice(0, 10)).eq('is_active', true).order('start_date').limit(5),
    supabase.from('bookings').select('reference, balance_amount_usd, balance_due_date').lte('balance_due_date', new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)).gt('balance_amount_usd', 0),
    supabase.from('quotes').select('reference, expires_at').eq('status', 'sent').lte('expires_at', new Date(now.getTime() + 2 * 86400000).toISOString()),
  ])

  const revenueThisMonth = (monthlyPayments ?? []).reduce((sum, p) => sum + Number(p.amount_usd || 0), 0)
  const outstandingReceivables = (openBookings ?? []).reduce((sum, b) => {
    const remaining = Number(b.total_price_usd || 0) - Number(b.deposit_paid_usd || 0) - Number(b.balance_paid_usd || 0)
    return sum + (remaining > 0 ? remaining : 0)
  }, 0)

  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: (requestsForStages ?? []).filter((r) => r.stage === s.key).length,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <Link href="/admin/requests/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#7A9A4A' }}>
          + New Request
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue This Month" value={formatUSD(revenueThisMonth)} sub={formatKES(revenueThisMonth)} />
        <KpiCard label="Active Bookings" value={String(activeBookingsCount ?? 0)} sub="confirmed or paying" />
        <KpiCard label="Outstanding Payments" value={formatUSD(outstandingReceivables)} sub={formatKES(outstandingReceivables)} />
        <KpiCard label="New Enquiries" value={String(newEnquiriesCount ?? 0)} sub="waiting in pipeline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Revenue by Month</h2>
          <p className="text-sm text-gray-400 py-10 text-center">Fills in automatically as payments come in.</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Departures</h2>
          {upcomingDepartures && upcomingDepartures.length > 0 ? (
            <ul className="space-y-2">
              {upcomingDepartures.map((d: any) => (
                <li key={d.id} className="text-sm text-gray-700 flex justify-between">
                  <span>{d.start_date}</span>
                  <span>{d.booked_seats}/{d.max_seats} seats</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">No upcoming departures yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Requests Pipeline</h2>
          <ul className="space-y-2 text-sm">
            {stageCounts.map((s) => (
              <li key={s.key} className="flex justify-between text-gray-700">
                <Link href={"/admin/requests?stage=" + s.key} className="hover:text-[#7A9A4A]">{s.label}</Link>
                <span className="font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Tasks and Alerts</h2>
          {(balanceDueSoon && balanceDueSoon.length > 0) || (expiringQuotes && expiringQuotes.length > 0) ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {(balanceDueSoon ?? []).map((b: any) => <li key={b.reference}>Balance due soon — {b.reference}</li>)}
              {(expiringQuotes ?? []).map((q: any) => <li key={q.reference}>Quote expiring — {q.reference}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">Nothing needs attention right now.</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <p className="text-sm text-gray-400 py-10 text-center">Activity appears here as things happen.</p>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}