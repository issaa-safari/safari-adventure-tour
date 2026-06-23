import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Revenue, conversion, and performance reporting</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
        <p className="text-sm text-gray-400">Analytics is coming in a later phase.</p>
      </div>
    </div>
  )
}
