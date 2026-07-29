/**
 * RateLimitManager
 * 
 * Handles Discord API rate limiting including:
 * - HTTP 429 responses with automatic retry
 * - Global vs local rate limits
 * - Exponential backoff with jitter for server errors
 * - Retry limits and safety buffers
 */

export class RateLimitManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 8;
    this.baseDelay = options.baseDelay || 1000; // ms
    this.maxBackoff = options.maxBackoff || 30000; // ms
    this.safetyBuffer = options.safetyBuffer || 500; // ms
    
    this.globalRateLimitResetAt = null;
    this.globalRateLimitWaiters = [];
  }

  /**
   * Check if currently under global rate limit
   */
  isGloballyRateLimited() {
    if (!this.globalRateLimitResetAt) return false;
    const now = Date.now();
    if (now < this.globalRateLimitResetAt) return true;
    this.globalRateLimitResetAt = null;
    return false;
  }

  /**
   * Wait if globally rate limited
   */
  async waitForGlobalRateLimit() {
    if (!this.isGloballyRateLimited()) return;
    
    const now = Date.now();
    const waitTime = this.globalRateLimitResetAt - now;
    
    console.log(`[RateLimit] Global rate limit active. Waiting ${(waitTime / 1000).toFixed(1)}s...`);
    
    return new Promise(resolve => {
      this.globalRateLimitWaiters.push(resolve);
      setTimeout(() => {
        this.globalRateLimitResetAt = null;
        this.globalRateLimitWaiters.forEach(fn => fn());
        this.globalRateLimitWaiters = [];
      }, waitTime + this.safetyBuffer);
    });
  }

  /**
   * Parse retry-after from Discord response
   * Can be a decimal number (seconds) or an integer (milliseconds for global limits)
   */
  parseRetryAfter(value) {
    if (!value) return null;
    
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    // Discord sends retry-after in seconds as decimals
    // Convert to milliseconds
    return Math.ceil(num * 1000);
  }

  /**
   * Parse rate-limit headers from response
   */
  parseRateLimitHeaders(headers) {
    return {
      remaining: headers.get('x-ratelimit-remaining'),
      resetAfter: headers.get('x-ratelimit-reset-after'),
      bucket: headers.get('x-ratelimit-bucket'),
      global: headers.get('x-ratelimit-global'),
      limit: headers.get('x-ratelimit-limit'),
    };
  }

  /**
   * Handle a 429 rate limit response
   * Returns { retryAfterMs, isGlobal }
   */
  async handleRateLimit(response, retryCount) {
    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON, continue
    }

    const headers = this.parseRateLimitHeaders(response.headers);
    const isGlobal = data.global === true || headers.global === 'true';
    
    let retryAfterMs = this.parseRetryAfter(data.retry_after);
    if (!retryAfterMs) {
      retryAfterMs = this.parseRetryAfter(headers.resetAfter);
    }
    
    // Fallback to reasonable default
    if (!retryAfterMs) {
      retryAfterMs = 1000 * (retryCount + 1);
    }

    // Add safety buffer
    const totalWait = retryAfterMs + this.safetyBuffer;

    if (isGlobal) {
      this.globalRateLimitResetAt = Date.now() + totalWait;
      console.log(`[RateLimit] Global 429: retry_after=${(retryAfterMs / 1000).toFixed(1)}s, total_wait=${(totalWait / 1000).toFixed(1)}s`);
    } else {
      console.log(`[RateLimit] Local 429: retry_after=${(retryAfterMs / 1000).toFixed(1)}s, total_wait=${(totalWait / 1000).toFixed(1)}s`);
    }

    return { retryAfterMs: totalWait, isGlobal };
  }

  /**
   * Calculate exponential backoff delay for server errors
   */
  calculateBackoff(retryCount) {
    // exponential backoff: base * 2^attempt + random jitter
    const exponential = this.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * this.baseDelay;
    const delay = Math.min(exponential + jitter, this.maxBackoff);
    return Math.ceil(delay);
  }

  /**
   * Determine if an error is retryable
   */
  isRetryable(status) {
    // Rate limit
    if (status === 429) return true;
    
    // Server errors
    if (status === 500 || status === 502 || status === 503 || status === 504) return true;
    
    // Timeout/connection errors are handled at fetch level
    return false;
  }

  /**
   * Determine if an error is permanent (should not retry)
   */
  isPermanent(status) {
    // 400 Bad Request
    if (status === 400) return true;
    
    // 401 Unauthorized
    if (status === 401) return true;
    
    // 403 Forbidden
    if (status === 403) return true;
    
    // 404 Not Found
    if (status === 404) return true;
    
    return false;
  }
}

export const rateLimitManager = new RateLimitManager();
