type EnvCheck = {
  required: string[]
  optional?: string[]
}

export type EnvValidationResult = {
  ok: boolean
  missingRequired: string[]
  presentOptional: string[]
}

export const SERVER_ENV: EnvCheck = {
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STELLAR_PLATFORM_SECRET',
    'STELLAR_CONTRACT_ID',
  ],
  optional: [
    'TRACKINGMORE_API_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM',
    'CRON_SECRET',
    'STELLAR_REPUTATION_WEBHOOK_URL',
  ],
}

export function validateEnv(check: EnvCheck): EnvValidationResult {
  const missingRequired = check.required.filter((name) => !process.env[name])
  const presentOptional = (check.optional || []).filter((name) => Boolean(process.env[name]))

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    presentOptional,
  }
}

export function assertProductionEnv(): void {
  // Fail-fast only in production; keep local development ergonomic.
  if (process.env.NODE_ENV !== 'production') return

  const result = validateEnv(SERVER_ENV)
  if (!result.ok) {
    throw new Error(`Missing required environment variables: ${result.missingRequired.join(', ')}`)
  }
}
