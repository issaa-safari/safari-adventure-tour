import { z } from 'zod'

// Validated at import time so misconfiguration fails fast at startup rather
// than surfacing as an obscure runtime error deep inside a request handler.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment configuration: ${issues}`)
  }
  return parsed.data
}

// Only enforced server-side — this module must never be imported from
// client components (it reads SUPABASE_SERVICE_ROLE_KEY).
export const env: Env = loadEnv()

export function whatsappWebhookConfigured(): boolean {
  return Boolean(env.WHATSAPP_APP_SECRET && env.WHATSAPP_VERIFY_TOKEN)
}
