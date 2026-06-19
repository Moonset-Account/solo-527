import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 200, 5000)
        return delay
      },
    })

    redis.on('connect', () => {
      console.log('Redis 连接成功')
    })

    redis.on('error', (err) => {
      console.error('Redis 连接错误:', err.message)
    })
  }
  return redis
}

export async function getCached<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 300): Promise<T> {
  const client = getRedis()
  const cached = await client.get(key)
  if (cached) {
    try {
      return JSON.parse(cached) as T
    } catch {
      // ignore parse error
    }
  }
  const data = await fetchFn()
  await client.set(key, JSON.stringify(data), 'EX', ttl)
  return data
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis()
  const keys = await client.keys(pattern)
  if (keys.length > 0) {
    await client.del(...keys)
  }
}

export async function scheduleReminderCheck(): Promise<void> {
  const client = getRedis()
  const key = 'remindhub:reminder_check_lock'
  const acquired = await client.set(key, '1', 'EX', 60, 'NX')
  if (acquired === 'OK') {
    console.log('获取提醒检查锁成功，将在后台执行检查')
  }
}
