import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findOrCreateClientByEmail } from '@/lib/server/clients'
import { quoteRequestSchema } from '@/lib/validation/schemas'
import { safeErrorResponse } from '@/lib/security/safe-error'
import { logger } from '@/lib/security/logger'

export async function POST(request: NextRequest) {
  try {
    const parsed = quoteRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }
    const { firstName, lastName, email, phone, tourType, startDate, groupSize, preferences, heardAboutUs } = parsed.data

    const admin = createAdminClient()

    // Resolve (or create) the client — mandatory before any insert
    let clientId: string
    try {
      clientId = await findOrCreateClientByEmail(admin, {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      })
    } catch (err) {
      logger.error('quote_request.client_resolution_failed', err)
      return NextResponse.json({ error: 'Failed to identify client' }, { status: 500 })
    }

    // Resolve the tour id when the user selected a specific tour
    const tourId: string | null = (tourType && tourType !== 'custom') ? tourType : null

    // Create the request row — this is the CRM intake record with source attribution
    const { data: newRequest, error: requestError } = await admin
      .from('requests')
      .insert({
        client_id: clientId,
        tour_id: tourId,
        stage: 'new',
        source: 'website',
        travelers_adults: groupSize ? parseInt(String(groupSize), 10) : 1,
        preferred_start_date: startDate || null,
        client_question: preferences || null,
        heard_about_us: heardAboutUs || null,
      })
      .select('id')
      .single()

    if (requestError || !newRequest) {
      return safeErrorResponse('quote_request.request_insert_failed', requestError, { message: 'Failed to create enquiry' })
    }

    // Create a draft quote linked to the request
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .insert({
        quote_number: `QR-${Date.now()}`,
        status: 'draft',
        mode: 'custom',
        client_id: clientId,
        request_id: newRequest.id,
        tour_id: tourId,
      })
      .select('id')
      .single()

    if (quoteError || !quote) {
      return safeErrorResponse('quote_request.quote_insert_failed', quoteError, { message: 'Failed to create quote request' })
    }

    return NextResponse.json(
      { success: true, quoteId: quote.id },
      { status: 201 }
    )
  } catch (error) {
    return safeErrorResponse('quote_request.unexpected_error', error)
  }
}
