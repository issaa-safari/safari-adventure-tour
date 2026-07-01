import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { assertAdminAccess } from '@/lib/auth/admin-access'
import { safeErrorResponse } from '@/lib/security/safe-error'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { kind, name, destinationId, descriptionEn, descriptionAr } = await request.json()
  const cleanName = (name || '').trim()
  if (!cleanName) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const descEn = typeof descriptionEn === 'string' ? descriptionEn.trim() || null : null
  const descAr = typeof descriptionAr === 'string' ? descriptionAr.trim() || null : null

  const admin = createAdminClient()
  try {
    await assertAdminAccess(admin, user.email)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (kind === 'destination') {
    const { data, error } = await admin
      .from('destinations')
      .insert({ name: cleanName, description_en: descEn, description_ar: descAr, is_active: true })
      .select('id, name')
      .single()
    if (error) return safeErrorResponse('create_lookup.insert_failed', error, { message: 'Failed to create item' })
    return NextResponse.json({ item: data })
  }

  if (kind === 'accommodation') {
    const { data, error } = await admin
      .from('accommodations')
      .insert({ name: cleanName, destination_id: destinationId || null, description_en: descEn, description_ar: descAr, is_active: true })
      .select('id, name, destination_id')
      .single()
    if (error) return safeErrorResponse('create_lookup.insert_failed', error, { message: 'Failed to create item' })
    return NextResponse.json({ item: data })
  }

  if (kind === 'activity') {
    const { data, error } = await admin
      .from('activities')
      .insert({ name: cleanName, destination_id: destinationId || null, description_en: descEn, description_ar: descAr, is_active: true })
      .select('id, name, destination_id')
      .single()
    if (error) return safeErrorResponse('create_lookup.insert_failed', error, { message: 'Failed to create item' })
    return NextResponse.json({ item: data })
  }

  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
}
