type TelemetryContext = Record<string, unknown>

export function logServerError(event: string, error: unknown, context: TelemetryContext = {}): void {
  const payload = {
    event,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    ts: new Date().toISOString(),
  }

  // Replace or extend this sink with Sentry/Datadog/New Relic integration.
  console.error('[telemetry]', JSON.stringify(payload))
}
