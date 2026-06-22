import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ToursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: tours } = await supabase
    .from('tours')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tours</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your tour templates and itineraries</p>
        </div>
        <Link href="/admin/tours/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#7A9A4A' }}>
          + New Tour
        </Link>
      </div>

      {!tours || tours.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No tours yet.</p>
          <Link href="/admin/tours/new"
            className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#7A9A4A' }}>
            Create First Tour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map((tour: any) => (
            <div key={tour.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#7A9A4A] hover:shadow-sm transition">
              <div className="h-32 bg-gradient-to-br from-[#4C5E2A] to-[#7A9A4A] flex items-end p-4">
                <div>
                  <span className={"text-xs px-2 py-0.5 rounded-full font-medium " +
                    (tour.type === 'bike' ? 'bg-amber-100 text-amber-800' :
                     tour.type === 'private' ? 'bg-blue-100 text-blue-800' :
                     'bg-green-100 text-green-800')}>
                    {tour.type === 'bike' ? '🏍️ Bike Tour' :
                     tour.type === 'private' ? '🦁 Private Safari' : '👥 Group Safari'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-semibold text-gray-900">{tour.title_en}</h2>
                  <span className={"text-xs px-2 py-0.5 rounded-full font-medium shrink-0 " +
                    (tour.status === 'active' ? 'bg-green-100 text-green-700' :
                     tour.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                     'bg-gray-100 text-gray-600')}>
                    {tour.status}
                  </span>
                </div>
                {tour.subtitle_en && (
                  <p className="text-sm text-gray-500 mb-3">{tour.subtitle_en}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span>{tour.duration_days} days / {tour.duration_nights} nights</span>
                  {tour.distance_km && <span>{tour.distance_km}km</span>}
                  <span>Max {tour.max_group_size} people</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={"/admin/tours/" + tour.id}
                    className="flex-1 rounded-md px-3 py-2 text-sm font-medium text-white text-center"
                    style={{ backgroundColor: '#7A9A4A' }}>
                    Edit Tour
                  </Link>
                  <Link href={"/admin/tours/" + tour.id + "/days"}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Itinerary
                  </Link>
                  {tour.featured && (
                    <span className="text-xs text-amber-600">⭐ Featured</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}