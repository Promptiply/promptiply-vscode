/**
 * API resilience utilities for timeout and retry logic
 */

export interface FetchWithTimeoutOptions {
  timeout?: number; // milliseconds, default 30000 (30s)
  retries?: number; // number of retries, default 3
  retryDelay?: number; // milliseconds between retries, default 1000
  retryOn?: (error: any, response?: Response) => boolean; // custom retry condition
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Fetch with timeout and retry logic
 */
export async function fetchWithResilience(
  url: string,
  options: RequestInit & FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryOn = defaultRetryCondition,
    ...fetchOptions
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if we should retry based on response
        if (attempt < retries && retryOn(null, response)) {
          await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);

        // If aborted due to timeout
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
      }
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (attempt < retries && retryOn(error)) {
        await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Default retry condition: retry on network errors and 5xx errors
 */
function defaultRetryCondition(error: any, response?: Response): boolean {
  // Retry on network errors
  if (error && (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ETIMEDOUT')
  )) {
    return true;
  }

  // Retry on 5xx server errors and 429 rate limits
  if (response && (
    response.status >= 500 ||
    response.status === 429
  )) {
    return true;
  }

  return false;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private lastCallTime: number = 0;
  private minInterval: number;

  constructor(callsPerSecond: number) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minInterval) {
      await delay(this.minInterval - timeSinceLastCall);
    }

    this.lastCallTime = Date.now();
  }
}
