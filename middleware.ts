import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.search

  // Extract subdomain
  const parts = hostname.replace('www.', '').split('.')
  const isLocalhost = hostname.includes('localhost')
  const isIp = /^\d+\.\d+\.\d+\.\d+/.test(hostname)
  const subdomain = isLocalhost || isIp ? '' : parts.length > 2 ? parts[0] : ''

  // Route admin subdomain to admin app
  if (subdomain === 'admin') {
    const adminPath = `/admin${pathname}${searchParams}`
    return NextResponse.rewrite(new URL(adminPath, request.url))
  }

  // Public routes - continue normally (will serve from /app/(public))
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|static/|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)',
  ],
}
