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
    fullyBooked: 'مكتمل',
    perPerson: 'للفرد',
  } : {
    bookNow: 'Book Now',
    askQuestion: 'Ask a Question',
    selectDate: 'Select a Date',
    tourHighlights: 'Tour Highlights',
    tourOverview: 'Tour Overview',
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
    fullyBooked: 'Fully Booked',
    perPerson: 'per Person',
  }

  return (
    <>
      <Suspense>
        <PublicHeader />
      </Suspense>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{locale === 'ar' ? tour?.title_ar : tour?.title_en}</h1>
                <p className="text-lg text-gray-300">{daysCount} {t.days} · {departure.status}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: G }}>${departure.price_usd?.toLocaleString()}</div>
                <p className="text-sm text-gray-300 mt-1">{t.perPerson}</p>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl h-96 flex items-center justify-center text-6xl mb-6">
              🦁
            </div>

            {/* Key Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={isAvailable ? `/departures/${id}/book?lang=${locale}&tour=${encodeURIComponent(locale === 'ar' ? tour?.title_ar : tour?.title_en)}&price=${departure.price_usd}` : '#'}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-center transition ${
                  isAvailable
                    ? 'text-white hover:opacity-90'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                style={{ backgroundColor: isAvailable ? G : undefined }}
              >
                {isAvailable ? t.bookNow : t.fullyBooked}
              </Link>
              <button className="px-6 py-3 rounded-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition">
                {t.askQuestion}
              </button>
            </div>
          </div>
        </section>

        {/* Key Info Section */}
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.keyInfo}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase">{t.startDate}</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{formatDate(departure.start_date, locale)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase">{t.endDate}</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{formatDate(departure.end_date, locale)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase">{t.duration}</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{daysCount} {t.days}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase">{t.availableSpots}</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{availableSpots} / {departure.max_seats}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tour Overview */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 px-6 py-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t.tourOverview}</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {locale === 'ar' ? tour?.description_ar || tour?.description_en : tour?.description_en}
              </p>
            </div>
          </div>
        </section>

        {/* Itinerary */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.itinerary}</h2>
            <div className="space-y-6">
              {tourDays && tourDays.length > 0 ? (
                tourDays.map((day: any, index: number) => (
                  <div key={day.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">{day.day_number}</div>
                        <div>
                          <h3 className="text-xl font-bold">{locale === 'ar' ? day.title_ar || day.title_en : day.title_en}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 space-y-3">
                      <p className="text-gray-700">
                        {locale === 'ar' ? day.description_ar || day.description_en : day.description_en}
                      </p>
                      {day.meals && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600">{t.meals}:</p>
                          <p className="text-gray-700">{day.meals}</p>
                        </div>
                      )}
                      {day.accommodation && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600">{t.accommodation}:</p>
                          <p className="text-gray-700">{day.accommodation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No itinerary details available</p>
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
