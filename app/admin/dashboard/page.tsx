import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'

const KES_RATE = 129 // approximate placeholder — becomes a live/manual rate in the Finance module

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function formatKES(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n * KES_RATE)
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

  const { data: adminProfile } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .single()

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
    supabase.from('bookings').select('reference, balance_amount_usd, balance_paid_usd, balance_due_date').lte('balance_due_date', new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)).gt('balance_amount_usd', 0),
    supabase.from('quotes').select('reference, total_price_usd, expires_at').eq('status', 'sent').lte('expires_at', new Date(now.getTime() + 2 * 86400000).toISOString()),
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
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: '#7A9A4A' }} />
          <span className="font-semibold text-gray-900 text-sm leading-tight">Safari Adventure Tour</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {[
            { label: 'Dashboard', href: '/admin/dashboard', active: true },
            { label: 'Requests', href: '/admin/requests' },
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
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 hover:bg-gray-100" aria-label="Notifications">
              🔔
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">0</span>
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{adminProfile?.full_name ?? user.email}</p>
              <p className="text-xs text-gray-500">{adminProfile?.role ?? ''}</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex justify-end">
            <Link href="/admin/requests/new" className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: '#7A9A4A' }}>
              + New Request
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Revenue This Month" value={formatUSD(revenueThisMonth)} sub={formatKES(revenueThisMonth) + ' (approx)'} />
            <KpiCard label="Active Bookings" value={String(activeBookingsCount ?? 0)} sub="confirmed or paying" />
            <KpiCard label="Outstanding Payments" value={formatUSD(outstandingReceivables)} sub={formatKES(outstandingReceivables) + ' (approx)'} />
            <KpiCard label="New Enquiries" value={String(newEnquiriesCount ?? 0)} sub="waiting in pipeline" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Revenue by Month</h2>
              <p className="text-sm text-gray-400 py-10 text-center">
                No revenue recorded yet. This fills in automatically as bookings and payments come in.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Departures</h2>
              {upcomingDepartures && upcomingDepartures.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingDepartures.map((d) => (
                    <li key={d.id} className="text-sm text-gray-700 flex justify-between">
                      <span>{d.start_date}</span>
                      <span>{d.booked_seats}/{d.max_seats} seats</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-10 text-center">No upcoming departures yet — add one in the Departures Manager.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Requests Pipeline</h2>
              <ul className="space-y-2 text-sm">
                {stageCounts.map((s) => (
                  <li key={s.key} className="flex justify-between text-gray-700">
                    <span>{s.label}</span>
                    <span className="font-medium">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Tasks & Alerts</h2>
              {(balanceDueSoon && balanceDueSoon.length > 0) || (expiringQuotes && expiringQuotes.length > 0) ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {(balanceDueSoon ?? []).map((b) => <li key={b.reference}>Balance due soon — {b.reference}</li>)}
                  {(expiringQuotes ?? []).map((q) => <li key={q.reference}>Quote expiring soon — {q.reference}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-10 text-center">Nothing needs your attention right now.</p>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
              <p className="text-sm text-gray-400 py-10 text-center">Activity will appear here as enquiries, quotes and payments happen.</p>
            </div>
          </div>
        </main>
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
