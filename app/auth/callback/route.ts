import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Return the user to where they started (e.g. a booking page), else the dashboard.
  const next = searchParams.get('next')
  const dest = next && next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(new URL(dest, request.url))
}
