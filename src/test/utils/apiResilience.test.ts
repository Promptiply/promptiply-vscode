/**
 * Tests for API resilience utilities
 */

import * as assert from 'assert';
import { fetchWithResilience, RateLimiter } from '../../utils/apiResilience';

// Mock fetch for testing
global.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
	const urlString = url.toString();

	// Mock successful response
	if (urlString.includes('success')) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Mock 500 error (should retry)
	if (urlString.includes('retry-500')) {
		return new Response('Server error', {
			status: 500
		});
	}

	// Mock 429 rate limit (should retry)
	if (urlString.includes('rate-limit')) {
		return new Response('Too many requests', {
			status: 429
		});
	}

	// Mock 401 error (should NOT retry)
	if (urlString.includes('auth-error')) {
		return new Response('Unauthorized', {
			status: 401
		});
	}

	// Mock network failure
	if (urlString.includes('network-error')) {
		throw new Error('Network request failed');
	}

	// Mock slow response for timeout testing
	if (urlString.includes('slow')) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(new Response(JSON.stringify({ slow: true }), {
					status: 200
				}));
			}, 5000); // 5 second delay
		});
	}

	return new Response('Not found', { status: 404 });
};

describe('fetchWithResilience', () => {

	describe('Basic Functionality', () => {
		it('should successfully fetch with default options', async () => {
			const response = await fetchWithResilience('https://api.example.com/success');
			assert.strictEqual(response.status, 200);
			const data = await response.json() as { success: boolean };
			assert.strictEqual(data.success, true);
		});

		it('should pass through request options', async () => {
			const response = await fetchWithResilience('https://api.example.com/success', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ test: true })
			});
			assert.strictEqual(response.status, 200);
		});
	});

	describe('Timeout Handling', () => {
		it('should timeout after specified duration', async function() {
			this.timeout(2000); // Mocha timeout

			try {
				await fetchWithResilience('https://api.example.com/slow', {
					timeout: 100, // 100ms timeout
					retries: 0
				});
				assert.fail('Should have thrown timeout error');
			} catch (error: any) {
				assert.ok(error.message.includes('timeout'), 'Should be a timeout error');
			}
		});

		it('should NOT timeout if response is fast enough', async () => {
			const response = await fetchWithResilience('https://api.example.com/success', {
				timeout: 5000 // 5 second timeout (plenty of time)
			});
			assert.strictEqual(response.status, 200);
		});
	});

	describe('Retry Logic', () => {
		it('should retry on 500 server errors', async function() {
			this.timeout(5000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				if (attemptCount < 3) {
					return new Response('Server error', { status: 500 });
				}
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 3,
				retryDelay: 100
			});

			assert.strictEqual(response.status, 200);
			assert.ok(attemptCount >= 2, 'Should have retried at least once');

			global.fetch = originalFetch;
		});

		it('should retry on 429 rate limit errors', async function() {
			this.timeout(5000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				if (attemptCount === 1) {
					return new Response('Too many requests', { status: 429 });
				}
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 2,
				retryDelay: 100
			});

			assert.strictEqual(response.status, 200);
			assert.strictEqual(attemptCount, 2, 'Should have retried once');

			global.fetch = originalFetch;
		});

		it('should NOT retry on 4xx client errors (except 429)', async function() {
			this.timeout(2000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				return new Response('Unauthorized', { status: 401 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 3,
				retryDelay: 100
			});

			assert.strictEqual(response.status, 401);
			assert.strictEqual(attemptCount, 1, 'Should NOT have retried');

			global.fetch = originalFetch;
		});

		it('should use exponential backoff for retries', async function() {
			this.timeout(5000);

			const retryTimes: number[] = [];
			let lastTime = Date.now();

			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				const now = Date.now();
				if (retryTimes.length > 0) {
					retryTimes.push(now - lastTime);
				}
				lastTime = now;

				if (retryTimes.length < 2) {
					return new Response('Server error', { status: 500 });
				}
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			};

			await fetchWithResilience('https://api.example.com/test', {
				retries: 3,
				retryDelay: 100 // Base delay
			});

			// Check exponential backoff: should be ~100ms, ~200ms, ~400ms
			assert.ok(retryTimes[0] >= 90 && retryTimes[0] <= 150, 'First retry should be ~100ms');
			assert.ok(retryTimes[1] >= 180 && retryTimes[1] <= 250, 'Second retry should be ~200ms');

			global.fetch = originalFetch;
		});

		it('should stop retrying after max retries exceeded', async function() {
			this.timeout(5000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				return new Response('Server error', { status: 500 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 2,
				retryDelay: 50
			});

			assert.strictEqual(response.status, 500);
			assert.strictEqual(attemptCount, 3, 'Should try once + 2 retries = 3 total');

			global.fetch = originalFetch;
		});
	});

	describe('Network Error Handling', () => {
		it('should retry on network failures', async function() {
			this.timeout(5000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				if (attemptCount < 3) {
					throw new Error('Network request failed');
				}
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 3,
				retryDelay: 100
			});

			assert.strictEqual(response.status, 200);
			assert.ok(attemptCount >= 2, 'Should have retried after network error');

			global.fetch = originalFetch;
		});
	});

	describe('Custom Retry Conditions', () => {
		it('should support custom retry logic', async function() {
			this.timeout(5000);

			let attemptCount = 0;
			const originalFetch = global.fetch;
			global.fetch = async (url: any, init?: any) => {
				attemptCount++;
				return new Response(JSON.stringify({ retry: attemptCount < 2 }), { status: 200 });
			};

			const response = await fetchWithResilience('https://api.example.com/test', {
				retries: 3,
				retryDelay: 100,
				retryOn: (error, response) => {
					if (response && response.status === 200) {
						// Custom logic: parse body to decide if retry needed
						return false; // Don't retry on 200 (simplified for test)
					}
					return false;
				}
			});

			assert.strictEqual(attemptCount, 1, 'Custom retry logic should control retries');

			global.fetch = originalFetch;
		});
	});
});

describe('RateLimiter', () => {

	describe('Basic Throttling', () => {
		it('should throttle requests to specified rate', async function() {
			this.timeout(3000);

			const limiter = new RateLimiter(2); // 2 requests per second
			const times: number[] = [];

			const start = Date.now();

			await limiter.throttle();
			times.push(Date.now() - start);

			await limiter.throttle();
			times.push(Date.now() - start);

			await limiter.throttle();
			times.push(Date.now() - start);

			// First request: immediate (~0ms)
			assert.ok(times[0] < 50, 'First request should be immediate');

			// Second request: ~500ms (1000ms / 2 requests per second)
			assert.ok(times[1] >= 450 && times[1] <= 600, 'Second request should wait ~500ms');

			// Third request: ~1000ms
			assert.ok(times[2] >= 950 && times[2] <= 1100, 'Third request should wait ~1000ms');
		});

		it('should handle 1 request per second correctly', async function() {
			this.timeout(3000);

			const limiter = new RateLimiter(1); // 1 request per second
			const start = Date.now();

			await limiter.throttle(); // First: immediate
			const time1 = Date.now() - start;

			await limiter.throttle(); // Second: should wait 1000ms
			const time2 = Date.now() - start;

			assert.ok(time1 < 50, 'First request immediate');
			assert.ok(time2 >= 950 && time2 <= 1100, 'Second request should wait ~1000ms');
		});
	});

	describe('Multiple Limiters', () => {
		it('should work independently for different instances', async function() {
			this.timeout(3000);

			const limiter1 = new RateLimiter(2);
			const limiter2 = new RateLimiter(2);

			const start = Date.now();

			await Promise.all([
				limiter1.throttle(),
				limiter2.throttle()
			]);

			const elapsed = Date.now() - start;

			// Both should execute immediately (independent limiters)
			assert.ok(elapsed < 100, 'Independent limiters should not block each other');
		});
	});

	describe('Edge Cases', () => {
		it('should handle very high rate limits', async function() {
			this.timeout(1000);

			const limiter = new RateLimiter(100); // 100 requests per second
			const start = Date.now();

			// Should execute quickly
			await limiter.throttle();
			await limiter.throttle();
			await limiter.throttle();

			const elapsed = Date.now() - start;
			assert.ok(elapsed < 100, 'High rate limit should allow quick succession');
		});

		it('should handle fractional rates', async function() {
			this.timeout(3000);

			const limiter = new RateLimiter(0.5); // 1 request every 2 seconds
			const start = Date.now();

			await limiter.throttle(); // First: immediate
			const time1 = Date.now() - start;

			await limiter.throttle(); // Second: should wait 2000ms
			const time2 = Date.now() - start;

			assert.ok(time1 < 50, 'First request immediate');
			assert.ok(time2 >= 1900 && time2 <= 2200, 'Should wait ~2000ms for 0.5 req/sec');
		});
	});
});
