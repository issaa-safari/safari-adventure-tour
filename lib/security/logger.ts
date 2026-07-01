// Structured server-side logging. Keeps a consistent JSON shape so log
// aggregation / grepping stays sane, and gives us one place to route
// security-relevant events (auth failures, webhook rejections, admin
// mutations) separately from routine request logs.
type LogFields = Record<string, unknown>

function write(level: 'info' | 'warn' | 'error', event: string, fields?: LogFields) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info(event: string, fields?: LogFields) {
    write('info', event, fields)
  },
  warn(event: string, fields?: LogFields) {
    write('warn', event, fields)
  },
  error(event: string, error: unknown, fields?: LogFields) {
    write('error', event, {
      ...fields,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    })
  },
  // Security/audit trail: failed auth, admin mutations, webhook rejections,
  // suspicious requests. Kept as its own event namespace (`security.*`) so
  // it can be routed/alerted on separately from ordinary application logs.
  security(event: string, fields?: LogFields) {
    write('warn', `security.${event}`, fields)
  },
  audit(event: string, fields?: LogFields) {
    write('info', `audit.${event}`, fields)
  },
}
