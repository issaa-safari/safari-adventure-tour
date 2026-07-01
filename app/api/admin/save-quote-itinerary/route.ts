import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { assertAdminAccess } from '@/lib/auth/admin-access'
import { safeErrorResponse } from '@/lib/security/safe-error'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { versionId, days } = await request.json()
  if (!versionId || !Array.isArray(days)) {
    return NextResponse.json({ error: 'A version ID and days array are required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  try {
    await assertAdminAccess(admin, user.email)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { error } = await admin.rpc('save_quote_itinerary', {
    p_version_id: versionId,
    p_days: days,
  })

  if (error) return safeErrorResponse('save_quote_itinerary.failed', error, { status: 400, message: 'Failed to save itinerary' })

  return NextResponse.json({ success: true })
}
