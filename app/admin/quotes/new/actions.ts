'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createQuote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const mode = formData.get('mode') as string
  const clientId = formData.get('clientId') as string
  const requestId = (formData.get('requestId') as string) || null
  const tourId = (formData.get('tourId') as string) || null
  const departureId = (formData.get('departureId') as string) || null
  const title = (formData.get('title') as string)?.trim() || null

  if (!mode || !['custom', 'fixed_departure'].includes(mode)) {
    throw new Error('Please select a quote mode.')
  }
  if (!clientId) throw new Error('Please select a client.')
  if (mode === 'fixed_departure' && !departureId) {
    throw new Error('Please select a departure for fixed-departure quotes.')
  }

  const admin = createAdminClient()

  // Snapshot company settings for this version
  const { data: settings } = await admin
    .from('company_settings')
    .select('company_name, brand_name, email, phone, whatsapp, default_markup_percent, deposit_percent, balance_due_days, cancellation_61_plus, cancellation_42_60, cancellation_28_41, cancellation_0_27, currency_primary')
    .limit(1)
    .single()

  // Snapshot client
  const { data: client } = await admin
    .from('clients')
    .select('first_name, last_name, email, phone, country, language')
    .eq('id', clientId)
    .single()

  if (!client) throw new Error('Client not found.')

  // If fixed departure, pull tour_id from the departure
  let resolvedTourId = tourId
  if (mode === 'fixed_departure' && departureId) {
    const { data: dep } = await admin
      .from('departures')
      .select('tour_id')
      .eq('id', departureId)
      .single()
    if (dep) resolvedTourId = dep.tour_id
  }

  // Create the quote
  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .insert({
      client_id: clientId,
      request_id: requestId || null,
      mode,
      tour_id: resolvedTourId || null,
      departure_id: departureId || null,
      status: 'draft',
      created_by: user.id,
    })
    .select('id, quote_number')
    .single()

  if (quoteError) throw new Error(quoteError.message)

  const defaultMarkup = settings?.default_markup_percent ?? 0

  // Create version 1
  const { data: version, error: versionError } = await admin
    .from('quote_versions')
    .insert({
      quote_id: quote.id,
      version_number: 1,
      status: 'draft',
      title: title || null,
      default_markup_percent: defaultMarkup,
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      company_snapshot: settings ?? {},
      client_snapshot: client ?? {},
      policy_snapshot: settings
        ? {
            deposit_percent: settings.deposit_percent,
            balance_due_days: settings.balance_due_days,
            cancellation_61_plus: settings.cancellation_61_plus,
            cancellation_42_60: settings.cancellation_42_60,
            cancellation_28_41: settings.cancellation_28_41,
            cancellation_0_27: settings.cancellation_0_27,
          }
        : {},
      created_by: user.id,
    })
    .select('id')
    .single()

  if (versionError) throw new Error(versionError.message)

  redirect(`/admin/quotes/${quote.id}`)
}
