const redis = require('redis');
const config = require('../config');

let client = null;

const connectRedis = async () => {
  try {
    const options = {
      socket: {
        host: config.redis.host,
        port: config.redis.port
      }
    };
    if (config.redis.password) {
      options.password = config.redis.password;
    }
    client = redis.createClient(options);
    client.on('error', (err) => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis connected successfully'));
    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
};

const getRedisClient = () => client;

const setCache = async (key, value, ttl = 3600) => {
  if (!client) return null;
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, stringValue);
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

const getCache = async (key) => {
  if (!client) return null;
  try {
    const value = await client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  if (!client) return null;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache
};
