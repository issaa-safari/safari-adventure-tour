import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { findOrCreateClientByEmail, refreshClientTotals } from '@/lib/server/clients'
import { bookingRequestSchema } from '@/lib/validation/schemas'
import { safeErrorResponse } from '@/lib/security/safe-error'
import { logger } from '@/lib/security/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing departure id' }, { status: 400 })
    }

    const parsed = bookingRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid booking request' },
        { status: 400 }
      )
    }
    const { travellers, totalPrice } = parsed.data

    const admin = createAdminClient()
    const groupSize = travellers.length

    // 1. Resolve the client — mandatory; abort if this fails
    const lead = travellers[0]
    let clientId: string
    try {
      clientId = await findOrCreateClientByEmail(admin, {
        email: lead?.email,
        first_name: lead?.firstName ?? lead?.first_name,
        last_name: lead?.lastName ?? lead?.last_name,
        phone: lead?.phone,
      })
    } catch (err) {
      logger.error('book.client_resolution_failed', err)
      return NextResponse.json(
        { error: 'Could not identify client — please check the lead traveller email.' },
        { status: 500 }
      )
    }

    // 2. Atomically check capacity, create the booking, and increment
    // booked_seats — locked and applied in a single transaction server-side
    // so two concurrent bookings can't both pass the capacity check.
    const { data: bookingResult, error: bookingError } = await admin
      .rpc('create_departure_booking_atomic', {
        p_departure_id: id,
        p_client_id: clientId,
        p_group_size: groupSize,
        p_total_price_usd: totalPrice,
      })
      .single()

    if (bookingError || !bookingResult) {
      const message = bookingError?.message ?? ''
      if (message.includes('DEPARTURE_NOT_FOUND')) {
        return NextResponse.json({ error: 'Departure not found' }, { status: 404 })
      }
      if (message.includes('NOT_ENOUGH_SEATS')) {
        return NextResponse.json(
          { error: 'Not enough available spots for this group size' },
          { status: 400 }
        )
      }
      return safeErrorResponse('book.rpc_failed', bookingError, { message: 'Failed to create booking' })
    }

    const booking = bookingResult as { booking_id: string; tour_id: string | null }

    // 3. Create a tracked request for attribution — best-effort, not fatal
    try {
      await admin.from('requests').insert({
        client_id: clientId,
        tour_id: booking.tour_id,
        stage: 'booked',
        source: 'website',
        travelers_adults: groupSize,
      })
    } catch (err) {
      logger.error('book.request_attribution_failed', err)
    }

    // 4. Insert traveller records
    const travellerRecords = travellers.map((t) => ({
      booking_id: booking.booking_id,
      first_name: t.firstName ?? t.first_name,
      last_name: t.lastName ?? t.last_name,
      email: t.email,
      phone: t.phone,
      date_of_birth: t.dateOfBirth ?? t.date_of_birth ?? null,
      nationality: t.nationality ?? null,
      passport_number: t.passportNumber ?? t.passport_number ?? null,
    }))

    const { error: travellerError } = await admin
      .from('booking_travellers')
      .insert(travellerRecords)

    if (travellerError) {
      logger.error('book.traveller_insert_failed', travellerError, { bookingId: booking.booking_id })
      return NextResponse.json(
        { error: 'Failed to save traveller information' },
        { status: 500 }
      )
    }

    // Best-effort: finance stub (requires group_25 migration)
    try {
      await admin.from('booking_payments').insert({
        booking_id: booking.booking_id,
        amount_usd: totalPrice,
        status: 'pending',
        notes: 'Website booking',
      })
    } catch { /* finance record is non-critical */ }

    // Best-effort: link to auth user if signed in (requires group_22 migration)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await admin.from('bookings').update({ user_id: user.id }).eq('id', booking.booking_id)
      }
    } catch { /* dashboard falls back to email match */ }

    // Best-effort: refresh client totals
    try {
      await refreshClientTotals(admin, clientId)
    } catch { /* totals are a convenience cache */ }

    return NextResponse.json({
      success: true,
      bookingId: booking.booking_id,
      message: 'Booking confirmed successfully',
    })
  } catch (error) {
    return safeErrorResponse('book.unexpected_error', error)
  }
}
