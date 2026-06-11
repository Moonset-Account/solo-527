export interface RetryOptions {
  retries: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  maxDelayMs?: number;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  lastError?: Error;
}

const DEFAULT_DELAY_MS = 100;
const DEFAULT_MAX_DELAY_MS = 10000;

function calculateDelay(
  attempt: number,
  baseDelay: number,
  backoff: 'linear' | 'exponential',
  maxDelay: number
): number {
  let delay: number;
  if (backoff === 'exponential') {
    delay = baseDelay * Math.pow(2, attempt - 1);
  } else {
    delay = baseDelay * attempt;
  }
  return Math.min(delay, maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const {
    retries,
    delayMs = DEFAULT_DELAY_MS,
    backoff = 'exponential',
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    shouldRetry,
  } = options;

  let lastError: Error | undefined;
  let attempts = 0;

  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    try {
      const result = await fn(attempt);
      return { result, attempts, lastError };
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxAttempts) {
        break;
      }

      if (shouldRetry && !shouldRetry(error as Error)) {
        break;
      }

      const delay = calculateDelay(attempt, delayMs, backoff, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error('Unknown error after retries');
}

export function isRetriableError(error: Error): boolean {
  const retriablePatterns = [
    /ENOTFOUND/i,
    /ECONNRESET/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /EAI_AGAIN/i,
    /EPIPE/i,
    /5\d{2}/,
    /rate limit/i,
    /too many requests/i,
    /temporarily unavailable/i,
  ];

  const message = error.message;
  return retriablePatterns.some((pattern) => pattern.test(message));
}
