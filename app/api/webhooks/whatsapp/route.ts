import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMetaSignature } from '@/lib/security/webhook'
import { timingSafeEqualString } from '@/lib/security/timing-safe'
import { whatsappWebhookEnvelopeSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/security/logger'

async function sendWhatsAppMessage(to: string, body: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !token) return

  await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' && verifyToken && token && timingSafeEqualString(token, verifyToken)) {
    return new NextResponse(challenge, { status: 200 })
  }

  logger.security('whatsapp_webhook.verify_failed', { mode })
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const appSecret = process.env.WHATSAPP_APP_SECRET

  if (!appSecret) {
    logger.error('whatsapp_webhook.misconfigured', new Error('WHATSAPP_APP_SECRET is not set'))
    return new NextResponse('OK', { status: 200 })
  }

  const signature = request.headers.get('x-hub-signature-256')
  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    logger.security('whatsapp_webhook.signature_invalid', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    })
    // Meta expects a 200 for delivery bookkeeping even on rejection — an
    // error status just triggers retries of the same forged payload.
    return new NextResponse('OK', { status: 200 })
  }

  try {
    const parsedBody = whatsappWebhookEnvelopeSchema.safeParse(JSON.parse(rawBody))
    if (!parsedBody.success) {
      logger.warn('whatsapp_webhook.invalid_payload', { issues: parsedBody.error.issues })
      return new NextResponse('OK', { status: 200 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = parsedBody.data
    const admin = createAdminClient()

    const entries: unknown[] = body?.entry ?? []
    for (const entry of entries) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changes: unknown[] = (entry as any)?.changes ?? []
      for (const change of changes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (change as any)?.value ?? {}
        const messages: unknown[] = value?.messages ?? []
        const contacts: unknown[] = value?.contacts ?? []

        for (const message of messages) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = message as any
          if (msg?.type !== 'text') continue

          const waId: string = msg?.from ?? ''
          const messageText: string = msg?.text?.body ?? ''
          if (!waId || !messageText) continue

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const contact = contacts.find((c: any) => c?.wa_id === waId) as any
          const profileName: string = contact?.profile?.name?.trim() ?? ''
          const nameParts = profileName.split(' ')
          const firstName = nameParts[0] ?? ''
          const lastName = nameParts.slice(1).join(' ')

          const { data: convo } = await admin
            .from('whatsapp_conversations')
            .select('*')
            .eq('wa_id', waId)
            .maybeSingle()

          if (!convo) {
            // First message — store it and ask for email
            await admin.from('whatsapp_conversations').insert({
              wa_id: waId,
              step: 'awaiting_email',
              collected_name: profileName || null,
              collected_question: messageText,
            })

            const greeting = firstName ? `Hi ${firstName}!` : 'Hi!'
            await sendWhatsAppMessage(
              waId,
              `${greeting} 👋 Welcome to Safari Adventure Tour.\n\nTo help you plan your perfect safari, could you share your email address?`
            )
          } else if (convo.step === 'awaiting_email') {
            await admin
              .from('whatsapp_conversations')
              .update({ collected_email: messageText, step: 'awaiting_country' })
              .eq('wa_id', waId)

            await sendWhatsAppMessage(waId, 'Thanks! Which country are you from?')
          } else if (convo.step === 'awaiting_country') {
            // All info collected — create client + request
            const fullName: string = convo.collected_name || profileName || ''
            const np = fullName.split(' ')
            const fn = np[0] || firstName || null
            const ln = np.slice(1).join(' ') || lastName || null

            let clientId: string

            const { data: existingClient } = await admin
              .from('clients')
              .select('id')
              .eq('whatsapp', waId)
              .maybeSingle()

            if (existingClient) {
              clientId = existingClient.id
              await admin
                .from('clients')
                .update({ first_name: fn, last_name: ln, email: convo.collected_email || null, country: messageText })
                .eq('id', clientId)
            } else {
              const { data: newClient, error } = await admin
                .from('clients')
                .insert({ whatsapp: waId, first_name: fn, last_name: ln, email: convo.collected_email || null, country: messageText })
                .select('id')
                .single()

              if (error || !newClient) continue
              clientId = newClient.id
            }

            await admin.from('requests').insert({
              client_id: clientId,
              source: 'whatsapp',
              client_question: convo.collected_question || messageText,
              stage: 'new',
            })

            await admin
              .from('whatsapp_conversations')
              .update({ collected_country: messageText, step: 'done' })
              .eq('wa_id', waId)

            const thankName = fn ? `, ${fn}` : ''
            await sendWhatsAppMessage(
              waId,
              `Thank you${thankName}! 🦁 Our team will review your enquiry and get back to you within 24 hours.`
            )
          } else {
            // Returning client — create a new request directly
            const { data: existingClient } = await admin
              .from('clients')
              .select('id')
              .eq('whatsapp', waId)
              .maybeSingle()

            if (existingClient) {
              await admin.from('requests').insert({
                client_id: existingClient.id,
                source: 'whatsapp',
                client_question: messageText,
                stage: 'new',
              })

              await sendWhatsAppMessage(
                waId,
                `Thanks for reaching out again! 🦁 Our team will get back to you within 24 hours.`
              )
            }
          }
        }
      }
    }
  } catch (error) {
    // Still return 200 — Meta expects that regardless — but don't lose the
    // failure like before; log it so processing errors are visible.
    logger.error('whatsapp_webhook.processing_failed', error)
  }

  return new NextResponse('OK', { status: 200 })
}
