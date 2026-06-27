'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { assertAdminAccess } from '@/lib/auth/admin-access'

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
  await assertAdminAccess(admin, user.email)

  // Read client's preferred language before creating the quote
  const { data: clientData } = await admin
    .from('clients')
    .select('language')
    .eq('id', clientId)
    .single()
  const clientLanguage = clientData?.language === 'ar' ? 'ar' : 'en'

  const { data: newQuoteId, error } = await admin.rpc('create_quote_with_version', {
    p_client_id: clientId,
    p_request_id: requestId,
    p_mode: mode,
    p_tour_id: tourId,
    p_departure_id: departureId,
    p_title: title,
    p_created_by: user.id,
  })

  if (error) throw new Error(error.message)
  if (!newQuoteId) throw new Error('Quote was not created.')

  // Auto-set quote version language from the client's profile
  if (clientLanguage !== 'en') {
    await admin
      .from('quote_versions')
      .update({ language: clientLanguage })
      .eq('quote_id', newQuoteId)
  }

  // Get the first version created
  const { data: firstVersion } = await admin
    .from('quote_versions')
    .select('id')
    .eq('quote_id', newQuoteId)
    .order('version_number', { ascending: true })
    .limit(1)
    .single()

  // Auto-populate travellers from request if linked
  if (requestId && firstVersion) {
    const { data: requestData } = await admin
      .from('requests')
      .select('group_size')
      .eq('id', requestId)
      .single()

    if (requestData?.group_size) {
      // Get adult age band (default)
      const { data: adultBand } = await admin
        .from('traveller_age_bands')
        .select('id, name, code, min_age, max_age, default_pricing_method, default_percentage, default_fixed_amount_usd')
        .eq('code', 'adult')
        .limit(1)
        .single()

      if (adultBand) {
        // Create traveller records
        const travellers = Array.from({ length: requestData.group_size }, (_, i) => ({
          quote_version_id: firstVersion.id,
          display_name: `Traveller ${i + 1}`,
          age_on_travel_date: null,
          age_band_id: adultBand.id,
          age_band_snapshot: {
            id: adultBand.id,
            name: adultBand.name,
            code: adultBand.code,
            min_age: adultBand.min_age,
            max_age: adultBand.max_age,
            default_pricing_method: adultBand.default_pricing_method,
            default_percentage: adultBand.default_pricing_method === 'percentage' ? adultBand.default_percentage : null,
            default_fixed_amount_usd: adultBand.default_pricing_method === 'fixed' ? adultBand.default_fixed_amount_usd : null,
          },
          traveller_category: adultBand.code,
          room_category: 'sharing',
          is_paying: true,
          is_complimentary: false,
          sort_order: i + 1,
        }))

        await admin.from('quote_travellers').insert(travellers)
      }
    }
  }

  // redirect() outside try/catch — Next.js throws NEXT_REDIRECT internally
  // and it must not be caught
  redirect(`/admin/quotes/${newQuoteId}`)
}
