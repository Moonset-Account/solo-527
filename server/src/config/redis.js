const redis = require('redis');
const config = require('.');

const redisClient = redis.createClient({
  url: config.redisUrl
});

async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis 连接失败:', error);
    throw error;
  }
}

redisClient.on('error', (err) => {
  console.error('Redis 错误:', err);
});

redisClient.on('connect', () => {
  console.log('Redis 客户端已连接');
});

module.exports = {
  redisClient,
  connectRedis
};
