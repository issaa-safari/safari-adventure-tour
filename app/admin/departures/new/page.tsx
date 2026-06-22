import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewDepartureForm from './new-departure-form'

export default async function NewDeparturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: tours } = await supabase
    .from('tours')
    .select('id, title_en, type, duration_days, base_price_usd')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/departures" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Departures
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Add Departure</h1>
      </div>
      <NewDepartureForm tours={tours ?? []} />
    </div>
  )
}