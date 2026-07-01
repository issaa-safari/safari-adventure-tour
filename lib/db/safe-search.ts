const MAX_SEARCH_LENGTH = 100

// PostgREST's `.or()`/`.ilike()` filter strings are a mini query language:
// `%`/`_` are ilike wildcards, and `,`/`(`/`)`/`.` are structural characters
// in the `.or("a.ilike.x,b.eq.y")` syntax. Left unescaped, user input can
// widen an ilike search unexpectedly or break/alter the intended filter
// structure. This normalises free-text search input before it's
// interpolated into a filter string.
export function sanitizeSearchTerm(input: string): string {
  const trimmed = input.trim().slice(0, MAX_SEARCH_LENGTH)

  // Escape PostgREST/ilike special characters so they're matched literally.
  return trimmed
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '')
    .replace(/[()]/g, '')
}

export function toIlikePattern(input: string): string {
  return `%${sanitizeSearchTerm(input)}%`
}
