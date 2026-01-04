/**
 * Distributed Rate Limiting with Redis Support
 * 
 * Supports both in-memory (development) and Redis (production)
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// In-memory store (fallback)
class InMemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetTime > now) {
      existing.count++;
      return existing;
    }

    const resetTime = now + windowMs;
    const record = { count: 1, resetTime };
    this.store.set(key, record);

    // Cleanup old entries
    if (this.store.size > 10000) {
      for (const [k, v] of this.store.entries()) {
        if (v.resetTime < now) {
          this.store.delete(k);
        }
      }
    }

    return record;
  }
}

// Redis store (production)
class RedisStore {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.pexpire(key, windowMs);
      const results = await multi.exec();

      // redis v4 returns an array of replies (e.g., [incrResult, 'OK'])
      if (!results || results.length === 0) {
        throw new Error('Redis multi.exec returned no results');
      }

      const [incrResult] = results;
      const count = Number(incrResult);

      if (Number.isNaN(count)) {
        throw new Error(`Redis incr result not a number: ${String(incrResult)}`);
      }

      return { count, resetTime };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      throw error;
    }
  }
}

export class DistributedRateLimit {
  private config: RateLimitConfig;
  private store: InMemoryStore | RedisStore;

  constructor(config: RateLimitConfig, redisClient?: any) {
    this.config = {
      keyPrefix: 'ratelimit:',
      ...config,
    };

    this.store = redisClient ? new RedisStore(redisClient) : new InMemoryStore();
  }

  /**
   * Check rate limit for a given identifier
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}${identifier}`;

    try {
      const { count, resetTime } = await this.store.increment(key, this.config.windowMs);

      const success = count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - count);

      return {
        success,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the request (fail open)
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }
}

// Global Redis client (if configured)
let redisClient: any = null;

export async function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // @ts-ignore - optional dependency
    const redis = await import('redis') as any;
    redisClient = redis.createClient({ url: redisUrl });
    await redisClient.connect();
    console.log('✅ Redis connected for rate limiting');
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis not available, using in-memory rate limiting');
    return null;
  }
}

// Create rate limiter instance
export async function createRateLimiter(config: RateLimitConfig): Promise<DistributedRateLimit> {
  const redis = await getRedisClient();
  return new DistributedRateLimit(config, redis);
}
