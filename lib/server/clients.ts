import type { SupabaseClient } from '@supabase/supabase-js'

// Find a CRM client by email (case-insensitive), creating one if absent.
// Used to firmly link website bookings and accepted quotes to a client record.
// Best-effort: returns null if it can't resolve a client (never throws).
export async function findOrCreateClientByEmail(
  admin: SupabaseClient,
  details: { email?: string | null; first_name?: string | null; last_name?: string | null; phone?: string | null },
): Promise<string | null> {
  const email = (details.email ?? '').trim()
  if (!email) return null

  try {
    const { data: existing } = await admin
      .from('clients')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()
    if (existing?.id) return existing.id

    const { data: created } = await admin
      .from('clients')
      .insert({
        email,
        first_name: details.first_name ?? '',
        last_name: details.last_name ?? '',
        phone: details.phone ?? null,
        source: 'website',
      })
      .select('id')
      .single()
    return created?.id ?? null
  } catch {
    return null
  }
}

// Best-effort refresh of a client's rolled-up booking totals.
export async function refreshClientTotals(admin: SupabaseClient, clientId: string): Promise<void> {
  try {
    const { data: rows } = await admin
      .from('bookings')
      .select('total_price_usd, status')
      .eq('client_id', clientId)
    const active = (rows ?? []).filter((b: { status: string }) => b.status !== 'cancelled')
    const totalBookings = active.length
    const totalSpent = active.reduce((s: number, b: { total_price_usd: number | null }) => s + Number(b.total_price_usd ?? 0), 0)
    await admin
      .from('clients')
      .update({ total_bookings: totalBookings, total_spent_usd: totalSpent })
      .eq('id', clientId)
  } catch {
    // ignore — totals are a denormalised convenience, not critical
  }
}
