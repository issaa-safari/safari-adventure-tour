import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import NewRateCardForm from './form'

export default async function NewRateCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const [{ data: accommodations }, { data: activities }, { data: vehicles }, { data: staff }, { data: destinations }] = await Promise.all([
    admin.from('accommodations').select('id, name').eq('is_active', true).order('name'),
    admin.from('activities').select('id, name').eq('is_active', true).order('name'),
    admin.from('vehicles').select('id, name').eq('is_active', true).order('name'),
    admin.from('tour_staff').select('id, name').eq('is_active', true).order('name'),
    admin.from('destinations').select('id, name').eq('is_active', true).order('name'),
  ])

  return <NewRateCardForm entities={{ accommodation: accommodations ?? [], activity: activities ?? [], vehicle: vehicles ?? [], staff: staff ?? [], destination: destinations ?? [] }} />
}
