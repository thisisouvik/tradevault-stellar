type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  factor?: number
  jitter?: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function backoffDelay(attempt: number, options: Required<RetryOptions>): number {
  const raw = options.baseDelayMs * Math.pow(options.factor, attempt)
  const capped = Math.min(raw, options.maxDelayMs)
  if (!options.jitter) return capped
  const jitter = Math.floor(Math.random() * Math.max(20, Math.floor(capped * 0.2)))
  return capped + jitter
}

export async function withRetry<T>(
  op: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const cfg: Required<RetryOptions> = {
    retries: options.retries ?? 2,
    baseDelayMs: options.baseDelayMs ?? 250,
    maxDelayMs: options.maxDelayMs ?? 2500,
    factor: options.factor ?? 2,
    jitter: options.jitter ?? true,
  }

  let lastError: unknown
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    try {
      return await op()
    } catch (error) {
      lastError = error
      if (attempt === cfg.retries) break
      await sleep(backoffDelay(attempt, cfg))
    }
  }

  throw lastError
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const res = await fetch(input, init)
    if (!res.ok && res.status >= 500) {
      throw new Error(`Upstream request failed with status ${res.status}`)
    }
    return res
  }, options)
}
