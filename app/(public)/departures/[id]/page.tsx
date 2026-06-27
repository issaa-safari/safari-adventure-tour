import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import PublicHeader from '@/components/public/header'
import PublicFooter from '@/components/public/footer'

const G = '#7A9A4A'

function formatDate(dateStr: string, locale: string = 'en') {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (locale === 'ar') {
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDaysCount(start: string, end: string) {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function calculateDaysDistance(day: any) {
  if (day.elevation_gain_m && day.distance_km) {
    return `${day.distance_km}km / ${day.elevation_gain_m}m`
  }
  if (day.distance_km) return `${day.distance_km}km`
  if (day.elevation_gain_m) return `${day.elevation_gain_m}m elevation`
  return '—'
}

export default async function DepartureDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { id } = await params
  const { lang } = await searchParams
  const locale = (lang as 'en' | 'ar') || 'en'

  const admin = createAdminClient()

  // Get departure details
  const { data: departure } = await admin
    .from('departures')
    .select(`
      id,
      tour_id,
      start_date,
      end_date,
      max_seats,
      booked_seats,
      price_usd,
      status,
      is_active,
      tours (
        id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        type,
        destination_id
      )
    `)
    .eq('id', id)
    .single()

  if (!departure) notFound()

  // Get tour days for itinerary
  const { data: tourDays } = await admin
    .from('tour_days')
    .select('*')
    .eq('tour_id', departure.tour_id)
    .order('day_number')

  const tour = departure.tours as any
  const daysCount = getDaysCount(departure.start_date, departure.end_date)
  const availableSpots = departure.max_seats - departure.booked_seats
  const isAvailable = availableSpots > 0

  const t = locale === 'ar' ? {
    bookNow: 'احجز الآن',
    askQuestion: 'اسأل سؤال',
    selectDate: 'اختر تاريخ',
    tourHighlights: 'أبرز الجولة',
    tourOverview: 'نظرة عامة على الجولة',
    tourSnapshot: 'لمحة سريعة عن الجولة',
    itinerary: 'برنامج الرحلة',
    keyInfo: 'معلومات مهمة',
    price: 'السعر',
    availableSpots: 'المقاعد المتاحة',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    duration: 'المدة',
    days: 'أيام',
    meals: 'الوجبات',
    accommodation: 'السكن',
    elevation: 'الارتفاع',
    distance: 'المسافة',
    distanceElevation: 'المسافة والارتفاع',
    fullyBooked: 'مكتمل',
    perPerson: 'للفرد',
    shareThis: 'شارك هذه الجولة',
    dayItinerary: 'برنامج اليوم',
  } : {
    bookNow: 'Book Now',
    askQuestion: 'Ask a Question',
    selectDate: 'Select a Date',
    tourHighlights: 'Tour Highlights',
    tourOverview: 'Tour Overview',
    tourSnapshot: 'Tour Snapshot',
    itinerary: 'Itinerary',
    keyInfo: 'Key Info',
    price: 'Price',
    availableSpots: 'Available Spots',
    startDate: 'Start Date',
    endDate: 'End Date',
    duration: 'Duration',
    days: 'days',
    meals: 'Meals',
    accommodation: 'Accommodation',
    elevation: 'Elevation',
    distance: 'Distance',
    distanceElevation: 'Distance & Elevation',
    fullyBooked: 'Fully Booked',
    perPerson: 'per Person',
    shareThis: 'Share This Tour',
    dayItinerary: 'Day Itinerary',
  }

  return (
    <>
      <Suspense>
        <PublicHeader />
      </Suspense>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-gray-900 to-gray-800 text-white py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Hero Image */}
            <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl h-96 md:h-[500px] flex items-center justify-center text-8xl mb-8 overflow-hidden">
              🦁
            </div>

            {/* Content Overlay */}
            <div className="mb-8">
              <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded font-bold text-sm mb-4">
                GUIDED & SUPPORTED
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{locale === 'ar' ? tour?.title_ar : tour?.title_en}</h1>
              <p className="text-xl text-gray-300 mb-6">
                {daysCount}-{locale === 'ar' ? 'يوم' : 'day'} {locale === 'ar' ? 'رحلة سفاري' : 'safari adventure'}
              </p>

              {/* Key Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href={isAvailable ? `/departures/${id}/book?lang=${locale}&tour=${encodeURIComponent(locale === 'ar' ? tour?.title_ar : tour?.title_en)}&price=${departure.price_usd}` : '#'}
                  className={`px-8 py-3 rounded-lg font-bold text-lg text-center transition ${
                    isAvailable
                      ? 'text-white hover:opacity-90'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: isAvailable ? G : undefined }}
                >
                  📅 {isAvailable ? t.bookNow : t.fullyBooked}
                </Link>
                <button className="px-8 py-3 rounded-lg font-bold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition">
                  💬 {t.askQuestion}
                </button>
              </div>

              {/* Price Info */}
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-gray-300 text-sm">Starting from</span>
                  <div className="text-4xl font-bold" style={{ color: G }}>
                    ${departure.price_usd?.toLocaleString()}
                    <span className="text-lg text-gray-300 ml-2">{t.perPerson}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tour Snapshot / Key Info Section */}
        <section className="bg-gray-50 py-12 md:py-16 border-b-4" style={{ borderColor: G }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 px-6 py-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 uppercase">{t.tourSnapshot}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">📅 {t.startDate}</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(departure.start_date, locale)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">🏁 {t.endDate}</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(departure.end_date, locale)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">⏱️ {t.duration}</p>
                <p className="text-sm font-bold text-gray-900">{daysCount} {t.days}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">💺 {t.availableSpots}</p>
                <p className="text-sm font-bold text-gray-900">{availableSpots}/{departure.max_seats}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">💰 {t.price}</p>
                <p className="text-sm font-bold" style={{ color: G }}>${departure.price_usd?.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-bold uppercase mb-2">📍 {t.keyInfo}</p>
                <p className="text-sm font-bold text-gray-900">{departure.status}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tour Overview */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 px-6 py-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t.tourOverview}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="prose prose-lg max-w-none text-gray-700">
                  <p className="text-lg leading-relaxed mb-6">
                    {locale === 'ar' ? tour?.description_ar || tour?.description_en : tour?.description_en}
                  </p>
                </div>
              </div>
              <div>
                {/* Route Map Placeholder */}
                <div className="bg-gray-100 rounded-lg p-6 border border-gray-300 flex items-center justify-center h-96">
                  <div className="text-center">
                    <p className="text-4xl mb-2">🗺️</p>
                    <p className="text-gray-600 font-semibold">Route Map</p>
                    <p className="text-sm text-gray-500 mt-2">Safari Route Visualization</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm font-bold text-gray-600 uppercase mb-4">📤 {t.shareThis}</p>
              <div className="flex gap-3">
                <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition">📱</button>
                <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition">📧</button>
                <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition">👥</button>
              </div>
            </div>
          </div>
        </section>

        {/* Itinerary */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 px-6 py-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t.itinerary}</h2>
            </div>

            <div className="space-y-6">
              {tourDays && tourDays.length > 0 ? (
                tourDays.map((day: any, index: number) => (
                  <div key={day.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                    {/* Day Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 md:py-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
                            <span className="text-2xl font-bold">{day.day_number}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold">{locale === 'ar' ? day.title_ar || day.title_en : day.title_en}</h3>
                          <p className="text-orange-100 mt-1">{t.dayItinerary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="px-6 py-6 grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {locale === 'ar' ? day.description_ar || day.description_en : day.description_en}
                        </p>

                        <div className="space-y-4">
                          {day.meals && (
                            <div className="pb-4 border-b border-gray-200">
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">🍽️ {t.meals}</p>
                              <p className="text-gray-700">{day.meals}</p>
                            </div>
                          )}
                          {day.accommodation && (
                            <div className="pb-4 border-b border-gray-200">
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">🏨 {t.accommodation}</p>
                              <p className="text-gray-700">{day.accommodation}</p>
                            </div>
                          )}
                          {(day.distance_km || day.elevation_gain_m) && (
                            <div>
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">📏 {t.distanceElevation}</p>
                              <p className="text-gray-700">{calculateDaysDistance(day)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Day Image Placeholder */}
                      <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg h-64 flex items-center justify-center text-5xl">
                        📸
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-600 text-lg">No itinerary details available for this tour</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16" style={{ backgroundColor: G }}>
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl font-bold mb-6">Ready to Book?</h2>
            <p className="text-lg mb-8 opacity-90">
              {isAvailable ? 'Secure your spot on this amazing adventure!' : 'This departure is currently full, but check back soon for new dates!'}
            </p>
            {isAvailable && (
              <Link
                href={`/departures/${id}/book?lang=${locale}&tour=${encodeURIComponent(locale === 'ar' ? tour?.title_ar : tour?.title_en)}&price=${departure.price_usd}`}
                className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
              >
                {t.bookNow}
              </Link>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  )
}
