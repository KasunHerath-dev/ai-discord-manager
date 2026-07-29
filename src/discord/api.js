import { rateLimitManager } from './rate-limit-manager.js';

const BASE = "https://discord.com/api/v10";
const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export class DiscordApi {
  constructor(token) {
    this.token = token;
  }

  /**
   * Make a request with automatic rate-limit handling and retries
   */
  async call(method, path, body, retryCount = 0) {
    // Wait if globally rate limited
    await rateLimitManager.waitForGlobalRateLimit();

    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          authorization: `Bot ${this.token}`,
          "content-type": "application/json",
          "user-agent": "FasNet-AI-Discord-Manager/1.0"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });

      // Handle 204 No Content
      if (res.status === 204) return null;

      // Parse response body
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      // Success
      if (res.ok) return data;

      // Handle 429 Rate Limit
      if (res.status === 429) {
        if (retryCount >= rateLimitManager.maxRetries) {
          throw new Error(`Discord API 429: Max retries (${rateLimitManager.maxRetries}) exceeded`);
        }
        
        const { retryAfterMs, isGlobal } = await rateLimitManager.handleRateLimit(res, retryCount);
        
        console.log(`[Request] Retry attempt ${retryCount + 1} of ${rateLimitManager.maxRetries} for ${method} ${path}`);
        
        // Wait and retry
        await this.delay(retryAfterMs);
        return this.call(method, path, body, retryCount + 1);
      }

      // Handle retryable server errors
      if (rateLimitManager.isRetryable(res.status)) {
        if (retryCount >= rateLimitManager.maxRetries) {
          throw new Error(`Discord API ${res.status}: Max retries (${rateLimitManager.maxRetries}) exceeded`);
        }

        const backoffMs = rateLimitManager.calculateBackoff(retryCount);
        console.log(`[Request] Retrying ${method} ${path} after ${res.status}. Attempt ${retryCount + 1} of ${rateLimitManager.maxRetries}, waiting ${backoffMs}ms`);
        
        await this.delay(backoffMs);
        return this.call(method, path, body, retryCount + 1);
      }

      // Permanent errors (400, 401, 403, 404)
      if (rateLimitManager.isPermanent(res.status)) {
        const errorMsg = typeof data === "string" ? data : JSON.stringify(data);
        throw new Error(`Discord API ${res.status}: ${errorMsg}`);
      }

      // Other errors
      const errorMsg = typeof data === "string" ? data : JSON.stringify(data);
      throw new Error(`Discord API ${res.status}: ${errorMsg}`);
    } catch (error) {
      // Handle network errors (timeout, connection reset, etc.)
      if (error instanceof TypeError && retryCount < rateLimitManager.maxRetries) {
        const backoffMs = rateLimitManager.calculateBackoff(retryCount);
        console.log(`[Request] Network error on ${method} ${path}. Attempt ${retryCount + 1} of ${rateLimitManager.maxRetries}, waiting ${backoffMs}ms. Error: ${error.message}`);
        
        await this.delay(backoffMs);
        return this.call(method, path, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  get(p) { return this.call("GET", p); }
  post(p, b) { return this.call("POST", p, b); }
  patch(p, b) { return this.call("PATCH", p, b); }
  put(p, b) { return this.call("PUT", p, b); }
  delete(p) { return this.call("DELETE", p); }
}
