/**
 * Parse REDIS_URL for Bull / IORedis. Supports redis:// and rediss:// (Upstash).
 */
export function parseRedisUrl() {
  const raw = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const url = new URL(raw);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username || undefined,
      ...(raw.startsWith('rediss://') ? { tls: {} } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}
