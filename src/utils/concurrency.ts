const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const { maxRetries, delay, backoff = 'exponential', onRetry } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt === maxRetries) break;

      const waitMs = backoff === 'exponential'
        ? delay * Math.pow(2, attempt)
        : delay * (attempt + 1);

      if (onRetry) onRetry(attempt + 1, lastError);
      await sleep(waitMs);
    }
  }

  throw new Error(`操作在 ${maxRetries + 1} 次尝试后仍失败: ${lastError?.message}`);
}

export async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length || 1));

  const workers = Array.from({ length: safeConcurrency }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await worker(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}
