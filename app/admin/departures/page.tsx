import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DeparturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: departures } = await supabase
    .from('departures')
    .select('*, tours(title_en, type)')
    .order('start_date', { ascending: true })

  const { data: tours } = await supabase
    .from('tours')
    .select('id, title_en, type')
    .eq('status', 'active')

  const now = new Date().toISOString().slice(0, 10)
  const upcoming = departures?.filter(d => d.start_date >= now) ?? []
  const past = departures?.filter(d => d.start_date < now) ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Departures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage fixed departure dates for your group tours</p>
        </div>
        <Link href="/admin/departures/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#7A9A4A' }}>
          + Add Departure
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{upcoming.length}</p>
          <p className="text-xs text-gray-500 mt-1">Upcoming Departures</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">
            {upcoming.reduce((sum, d) => sum + (d.booked_seats ?? 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Seats Booked</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">
            {upcoming.reduce((sum, d) => sum + ((d.max_seats ?? 0) - (d.booked_seats ?? 0)), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Seats Available</p>
        </div>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-400 text-sm mb-4">No departures yet.</p>
          <Link href="/admin/departures/new"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#7A9A4A' }}>
            Add First Departure
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tour</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">End Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Seats</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((dep: any, i: number) => {
                      const tour = dep.tours
                      const seatsLeft = (dep.max_seats ?? 0) - (dep.booked_seats ?? 0)
                      const fillPercent = Math.round(((dep.booked_seats ?? 0) / (dep.max_seats ?? 1)) * 100)
                      return (
                        <tr key={dep.id}
                          className={"border-b border-gray-50 hover:bg-gray-50 " + (i === upcoming.length - 1 ? 'border-0' : '')}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{tour?.title_en ?? 'Unknown Tour'}</p>
                            <span className="text-xs text-gray-400 capitalize">{tour?.type}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(dep.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(dep.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{ width: fillPercent + '%', backgroundColor: '#7A9A4A' }} />
                              </div>
                              <span className="text-xs text-gray-600">
                                {dep.booked_seats}/{dep.max_seats}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{seatsLeft} left</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            ${Number(dep.price_usd).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-0.5 rounded-full font-medium " +
                              (dep.status === 'available' ? 'bg-green-100 text-green-700' :
                               dep.status === 'limited' ? 'bg-amber-100 text-amber-700' :
                               dep.status === 'full' ? 'bg-red-100 text-red-700' :
                               'bg-gray-100 text-gray-600')}>
                              {dep.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={"/admin/departures/" + dep.id}
                              className="text-xs text-[#7A9A4A] hover:underline">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Past Departures</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden opacity-60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tour</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Seats Filled</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((dep: any, i: number) => {
                      const tour = dep.tours
                      return (
                        <tr key={dep.id}
                          className={"border-b border-gray-50 " + (i === past.length - 1 ? 'border-0' : '')}>
                          <td className="px-4 py-3 text-gray-600">{tour?.title_en}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(dep.start_date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{dep.booked_seats}/{dep.max_seats}</td>
                          <td className="px-4 py-3 text-gray-500">
                            ${(Number(dep.price_usd) * Number(dep.booked_seats)).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}