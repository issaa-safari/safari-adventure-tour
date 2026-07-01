import { createHmac, timingSafeEqual } from 'crypto'

// Verifies Meta's `X-Hub-Signature-256` header against the raw request body
// using the app secret. Meta signs every webhook delivery with
// HMAC-SHA256(appSecret, rawBody) — without this check anyone who discovers
// the webhook URL can post arbitrary payloads and have them processed as if
// they came from WhatsApp.
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader) return false

  const [scheme, signature] = signatureHeader.split('=')
  if (scheme !== 'sha256' || !signature) return false

  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')

  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== actualBuf.length) return false

  return timingSafeEqual(expectedBuf, actualBuf)
}
