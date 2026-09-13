import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis only if URLs are provided (graceful degradation for dev without Upstash)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null

// Create specific limiters
// Auth limiter: 5 requests per minute
export const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
}) : null

// Verify limiter: 30 requests per minute
export const verifyRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/verify',
}) : null

/**
 * Helper to check rate limit and return boolean.
 * Defaults to true (allowed) if Redis is not configured.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null, 
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number }> {
  if (!limiter) {
    return { success: true, limit: 100, remaining: 100 }
  }
  
  const { success, limit, remaining } = await limiter.limit(identifier)
  return { success, limit, remaining }
}
