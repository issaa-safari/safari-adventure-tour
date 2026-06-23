import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ quotes: [], clients: [], requests: [] })

  const admin = createAdminClient()
  const like = `%${q}%`

  const [{ data: quotesRaw }, { data: clients }, { data: requestsRaw }] = await Promise.all([
    admin.from('quotes')
      .select('id, quote_number, status, client_id, clients(first_name, last_name)')
      .or(`quote_number.ilike.${like}`)
      .limit(6),
    admin.from('clients')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
      .limit(6),
    admin.from('requests')
      .select('id, reference, stage, client_id, clients(first_name, last_name)')
      .or(`reference.ilike.${like}`)
      .limit(6),
  ])

  const quotes = (quotesRaw ?? []).map((q: any) => ({
    id: q.id,
    quote_number: q.quote_number,
    status: q.status,
    client_name: q.clients ? `${q.clients.first_name} ${q.clients.last_name}`.trim() : null,
  }))

  const requests = (requestsRaw ?? []).map((r: any) => ({
    id: r.id,
    reference: r.reference,
    stage: r.stage,
    client_name: r.clients ? `${r.clients.first_name} ${r.clients.last_name}`.trim() : null,
  }))

  return NextResponse.json({ quotes, clients: clients ?? [], requests })
}
