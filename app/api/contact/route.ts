import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { contactSchema } from '@/lib/validation/schemas'
import { safeErrorResponse } from '@/lib/security/safe-error'

export async function POST(request: NextRequest) {
  try {
    const parsed = contactSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }
    const { name, email, phone, subject, message } = parsed.data

    const admin = createAdminClient()

    const { error } = await admin
      .from('contact_messages')
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
        created_at: new Date().toISOString(),
      })

    if (error) {
      return safeErrorResponse('contact.insert_failed', error, { message: 'Failed to send message' })
    }

    // TODO: Send email notification to admin

    return NextResponse.json(
      { success: true },
      { status: 201 }
    )
  } catch (error) {
    return safeErrorResponse('contact.unexpected_error', error)
  }
}
