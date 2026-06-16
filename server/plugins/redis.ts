export default defineNitroPlugin(async () => {
  try {
    const { useRedis } = await import('../utils/redis')
    const redis = useRedis()
    redis.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })
  } catch (error) {
    console.error('[Redis] Connection failed:', error)
  }
})
