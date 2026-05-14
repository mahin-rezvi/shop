import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      if (typeof data === "string") {
        return JSON.parse(data) as T;
      }
      return data as T | null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    if (!redis) return;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  async delete(key: string): Promise<void> {
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  },

  async clear(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  },
};
