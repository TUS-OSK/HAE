import { Redis } from "@upstash/redis";

// Room state needs to be shared across serverless invocations. If Upstash
// Redis credentials are configured we use that (works correctly across
// multiple Vercel function instances). Otherwise we fall back to an
// in-memory Map, which is only correct for `next dev` / a single long-lived
// process, but keeps the whole game playable with zero external setup.

interface KV {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryKV implements KV {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class UpstashKV implements KV {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, { ex: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// A single in-memory Map must survive hot-reloads in dev, so we stash it on
// globalThis the same way Next.js apps do for database clients.
const globalForKv = globalThis as unknown as { __haeMemoryKv?: MemoryKV };

let kv: KV | undefined;

export function getKV(): KV {
  if (kv) return kv;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    kv = new UpstashKV(new Redis({ url, token }));
  } else {
    if (!globalForKv.__haeMemoryKv) {
      globalForKv.__haeMemoryKv = new MemoryKV();
    }
    kv = globalForKv.__haeMemoryKv;
  }
  return kv;
}
