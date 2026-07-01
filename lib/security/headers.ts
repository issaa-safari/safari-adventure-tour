// Global security headers applied to every response via next.config.ts.
//
// Notes on the CSP: `style-src` needs 'unsafe-inline' because the app relies
// on React's `style` attribute (SSR'd inline styles) and Framer Motion, and
// there's no nonce plumbed through the render tree yet. `script-src` does
// not need it — the app has no inline `<script>` usage. Moving style-src to
// a nonce/hash-based policy is a follow-up, not done here.
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin
  } catch {
    return ''
  }
})()

const connectSrc = ["'self'", SUPABASE_ORIGIN].filter(Boolean).join(' ')

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self' https: data:",
  `connect-src ${connectSrc}`,
  'upgrade-insecure-requests',
].join('; ')

export const securityHeaders: Array<{ key: string; value: string }> = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]
