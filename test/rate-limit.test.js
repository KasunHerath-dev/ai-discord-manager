import test from "node:test";
import assert from "node:assert/strict";
import { RateLimitManager } from "../src/discord/rate-limit-manager.js";
import { RequestQueue } from "../src/discord/request-queue.js";
import { DiscordApi } from "../src/discord/api.js";

/**
 * Mock fetch for testing
 */
let mockFetchResponse = null;
let mockFetchCallCount = 0;
let originalFetch = globalThis.fetch;

function setupMockFetch(responseGenerator) {
  mockFetchCallCount = 0;
  globalThis.fetch = async (...args) => {
    mockFetchCallCount++;
    return responseGenerator(mockFetchCallCount, args);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

/**
 * Create a mock response
 */
function mockResponse(status, body, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(key) {
        return headers[key.toLowerCase()] || null;
      }
    },
    text: async () => typeof body === 'string' ? body : JSON.stringify(body)
  };
}

// Rate Limit Manager Tests
test("RateLimitManager: parseRetryAfter converts decimal seconds to milliseconds", () => {
  const mgr = new RateLimitManager();
  assert.equal(mgr.parseRetryAfter("21.876"), 21876);
  assert.equal(mgr.parseRetryAfter("1"), 1000);
  assert.equal(mgr.parseRetryAfter("0.5"), 500);
});

test("RateLimitManager: isRetryable returns true for 429", () => {
  const mgr = new RateLimitManager();
  assert.equal(mgr.isRetryable(429), true);
});

test("RateLimitManager: isRetryable returns true for server errors", () => {
  const mgr = new RateLimitManager();
  assert.equal(mgr.isRetryable(500), true);
  assert.equal(mgr.isRetryable(502), true);
  assert.equal(mgr.isRetryable(503), true);
  assert.equal(mgr.isRetryable(504), true);
});

test("RateLimitManager: isPermanent returns true for client errors", () => {
  const mgr = new RateLimitManager();
  assert.equal(mgr.isPermanent(400), true);
  assert.equal(mgr.isPermanent(401), true);
  assert.equal(mgr.isPermanent(403), true);
  assert.equal(mgr.isPermanent(404), true);
});

test("RateLimitManager: calculateBackoff increases with retry count", () => {
  const mgr = new RateLimitManager({ baseDelay: 1000 });
  const delay0 = mgr.calculateBackoff(0);
  const delay1 = mgr.calculateBackoff(1);
  const delay2 = mgr.calculateBackoff(2);
  
  assert(delay0 <= 2000, `delay0 (${delay0}) should be <= 2000`);
  assert(delay1 > delay0, `delay1 (${delay1}) should be > delay0 (${delay0})`);
  assert(delay2 > delay1, `delay2 (${delay2}) should be > delay1 (${delay1})`);
});

test("RateLimitManager: calculateBackoff respects maxBackoff", () => {
  const mgr = new RateLimitManager({ baseDelay: 1000, maxBackoff: 30000 });
  const delayHigh = mgr.calculateBackoff(20);
  assert(delayHigh <= 30000, `delayHigh (${delayHigh}) should be <= 30000`);
});

test("RateLimitManager: handleRateLimit identifies global rate limits", async () => {
  const mgr = new RateLimitManager();
  const response = mockResponse(429, { global: true, retry_after: 5 });
  const result = await mgr.handleRateLimit(response, 0);
  
  assert.equal(result.isGlobal, true);
  assert(result.retryAfterMs > 5000, `retryAfterMs (${result.retryAfterMs}) should be > 5000 + buffer`);
});

test("RateLimitManager: handleRateLimit identifies local rate limits", async () => {
  const mgr = new RateLimitManager();
  const response = mockResponse(429, { global: false, retry_after: 5 });
  const result = await mgr.handleRateLimit(response, 0);
  
  assert.equal(result.isGlobal, false);
  assert(result.retryAfterMs > 5000);
});

test("RateLimitManager: isGloballyRateLimited detects active global limit", () => {
  const mgr = new RateLimitManager();
  mgr.globalRateLimitResetAt = Date.now() + 5000;
  assert.equal(mgr.isGloballyRateLimited(), true);
});

test("RateLimitManager: isGloballyRateLimited clears expired limit", () => {
  const mgr = new RateLimitManager();
  mgr.globalRateLimitResetAt = Date.now() - 1000; // Past
  assert.equal(mgr.isGloballyRateLimited(), false);
  assert.equal(mgr.globalRateLimitResetAt, null);
});

// Request Queue Tests
test("RequestQueue: enqueue processes requests sequentially", async () => {
  const queue = new RequestQueue({ delayMs: 0 });
  queue.reset();
  
  let executionOrder = [];
  
  await Promise.all([
    queue.enqueue(async () => { executionOrder.push(1); }),
    queue.enqueue(async () => { executionOrder.push(2); }),
    queue.enqueue(async () => { executionOrder.push(3); })
  ]);
  
  assert.deepEqual(executionOrder, [1, 2, 3]);
});

test("RequestQueue: applies delay between successful requests", async () => {
  const queue = new RequestQueue({ delayMs: 50 });
  queue.reset();
  
  const times = [];
  const startTime = Date.now();
  
  const p1 = queue.enqueue(async () => { times.push(Date.now() - startTime); });
  const p2 = queue.enqueue(async () => { times.push(Date.now() - startTime); });
  
  await p1;
  await p2;
  
  assert(times[1] - times[0] >= 40, `Delay should be >= 40ms, was ${times[1] - times[0]}ms`);
});

test("RequestQueue: tracks statistics", async () => {
  const queue = new RequestQueue({ delayMs: 0 });
  queue.reset();
  
  await queue.enqueue(async () => { return "success"; });
  try {
    await queue.enqueue(async () => { throw new Error("fail"); });
  } catch { }
  
  const stats = queue.getStats();
  assert.equal(stats.completed, 1);
  assert.equal(stats.failed, 1);
  assert.equal(stats.processed, 2);
});

// Discord API Tests
test("DiscordApi: retries on 429 rate limit", async () => {
  setupMockFetch((callCount) => {
    if (callCount === 1) {
      return mockResponse(429, { global: false, retry_after: 0.1 });
    }
    return mockResponse(200, { id: "123", name: "test" });
  });
  
  const api = new DiscordApi("token");
  const result = await api.call("GET", "/test");
  
  assert.equal(mockFetchCallCount, 2, `Expected 2 calls, got ${mockFetchCallCount}`);
  assert.equal(result.id, "123");
  
  restoreFetch();
});

test("DiscordApi: respects max retries on 429", async () => {
  setupMockFetch(() => {
    return mockResponse(429, { global: false, retry_after: 0.01 });
  });
  
  const api = new DiscordApi("token");
  const mgr = new RateLimitManager({ maxRetries: 2, baseDelay: 10 });
  
  // Temporarily override the global manager's maxRetries
  const originalMaxRetries = api.constructor.prototype.constructor.toString().includes("maxRetries");
  
  try {
    await api.call("GET", "/test");
    assert.fail("Should have thrown error");
  } catch (error) {
    assert(error.message.includes("Max retries"), `Error message was: ${error.message}`);
  }
  
  restoreFetch();
});

test("DiscordApi: retries on server error (500)", async () => {
  setupMockFetch((callCount) => {
    if (callCount === 1) {
      return mockResponse(500, { message: "Internal Server Error" });
    }
    return mockResponse(200, { id: "123" });
  });
  
  const api = new DiscordApi("token");
  const result = await api.call("GET", "/test");
  
  assert.equal(mockFetchCallCount, 2);
  assert.equal(result.id, "123");
  
  restoreFetch();
});

test("DiscordApi: does not retry on 404 Not Found", async () => {
  setupMockFetch(() => {
    return mockResponse(404, { message: "Not Found" });
  });
  
  const api = new DiscordApi("token");
  
  try {
    await api.call("GET", "/notfound");
    assert.fail("Should have thrown error");
  } catch (error) {
    assert(error.message.includes("404"));
    assert.equal(mockFetchCallCount, 1, "Should only try once for 404");
  }
  
  restoreFetch();
});

test("DiscordApi: does not retry on 403 Forbidden", async () => {
  setupMockFetch(() => {
    return mockResponse(403, { message: "Forbidden" });
  });
  
  const api = new DiscordApi("token");
  
  try {
    await api.call("GET", "/forbidden");
    assert.fail("Should have thrown error");
  } catch (error) {
    assert(error.message.includes("403"));
    assert.equal(mockFetchCallCount, 1, "Should only try once for 403");
  }
  
  restoreFetch();
});

test("DiscordApi: handles 204 No Content without error", async () => {
  setupMockFetch(() => {
    return mockResponse(204, "");
  });
  
  const api = new DiscordApi("token");
  const result = await api.call("DELETE", "/test");
  
  assert.equal(result, null);
  
  restoreFetch();
});

test("DiscordApi: waits for global rate limit before request", async () => {
  const { rateLimitManager } = await import("../src/discord/rate-limit-manager.js");
  const api = new DiscordApi("token");
  
  // Manually set a global rate limit
  rateLimitManager.globalRateLimitResetAt = Date.now() + 100;
  
  let requestTime = null;
  setupMockFetch(() => {
    requestTime = Date.now();
    return mockResponse(200, { id: "123" });
  });
  
  const startTime = Date.now();
  await api.call("GET", "/test");
  const elapsedTime = requestTime - startTime;
  
  assert(elapsedTime >= 90, `Expected at least 90ms delay for global rate limit, got ${elapsedTime}ms`);
  
  // Clean up
  rateLimitManager.globalRateLimitResetAt = null;
  
  restoreFetch();
});
