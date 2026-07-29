/**
 * RequestQueue
 * 
 * Manages sequential execution of Discord mutations:
 * - Ensures mutations execute one at a time
 * - Applies configurable delays between successful requests
 * - Respects rate-limit pauses from the rate-limit manager
 * - Tracks queue state and statistics
 */

export class RequestQueue {
  constructor(options = {}) {
    this.delayMs = options.delayMs || 1500; // Default delay between mutations
    this.isProcessing = false;
    this.queue = [];
    this.stats = {
      processed: 0,
      completed: 0,
      failed: 0,
      retried: 0,
    };
  }

  /**
   * Enqueue a request to be processed sequentially
   */
  enqueue(requestFn, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        metadata,
        resolve,
        reject,
      });
      this.process();
    });
  }

  /**
   * Process queued requests sequentially
   */
  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        this.stats.processed++;

        try {
          const result = await item.requestFn();
          this.stats.completed++;
          item.resolve(result);

          // Apply delay between successful requests
          if (this.queue.length > 0) {
            await this.delay(this.delayMs);
          }
        } catch (error) {
          this.stats.failed++;
          item.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return { ...this.stats, queued: this.queue.length };
  }

  /**
   * Clear queue and stats
   */
  reset() {
    this.queue = [];
    this.stats = {
      processed: 0,
      completed: 0,
      failed: 0,
      retried: 0,
    };
  }
}

export const requestQueue = new RequestQueue();
