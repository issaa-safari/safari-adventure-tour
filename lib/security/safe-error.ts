import { NextResponse } from 'next/server'
import { logger } from './logger'

// Logs the real error server-side and returns a generic message to the
// client — raw DB/driver errors can leak schema details, internal table
// names, or query structure to whoever is making the request.
export function safeErrorResponse(
  event: string,
  error: unknown,
  options?: { status?: number; message?: string; fields?: Record<string, unknown> }
): NextResponse {
  logger.error(event, error, options?.fields)
  return NextResponse.json(
    { error: options?.message ?? 'Internal server error' },
    { status: options?.status ?? 500 }
  )
}
