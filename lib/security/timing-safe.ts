import { createHash, timingSafeEqual } from 'crypto'

// Plain `===` on secrets (tokens, signatures, verify-tokens) leaks timing
// information that can be used to guess the correct value byte-by-byte, and
// `timingSafeEqual` itself throws on mismatched lengths (which also leaks
// info). Hashing both sides to a fixed-length digest first avoids both
// issues — this is the standard "constant-time string compare" pattern.
export function timingSafeEqualString(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(Buffer.from(a, 'utf8')).digest()
  const digestB = createHash('sha256').update(Buffer.from(b, 'utf8')).digest()
  return timingSafeEqual(digestA, digestB)
}
