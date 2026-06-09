/**
 * Bull 任务队列管理器 + 内存降级
 * 无 Redis 时自动使用内存实现（开发/演示模式）
 */
const config = require('../config');
const logger = require('../utils/logger');

let Bull = null;
let redisAvailable = true;
try { Bull = require('bull'); } catch { Bull = null; }

const queues = {};
const inMemoryQueues = {};
let redisChecked = false;

async function _checkRedis() {
  if (redisChecked) return redisAvailable;
  redisChecked = true;
  if (!Bull) {
    logger.warn('[queue] bull package missing, using in-memory queue');
    redisAvailable = false;
    return false;
  }
  if (!config.redis || !config.redis.enabled === false) {
    // 配置显式禁用
    if (config.redis && config.redis.enabled === false) {
      logger.warn('[queue] Redis disabled in config, using in-memory');
      redisAvailable = false;
      return false;
    }
  }
  try {
    const Redis = require('ioredis');
    const client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      connectTimeout: 1500,
      commandTimeout: 1500,
      maxRetriesPerRequest: 0,
      lazyConnect: true,
      retryStrategy: () => null, // 不重试
    });
    let resolved = false;
    const result = await Promise.race([
      new Promise((resolve) => {
        client.once('error', () => { if (!resolved) { resolved = true; resolve(false); } });
        client.once('connect', () => { if (!resolved) { resolved = true; try { client.disconnect(); } catch {} resolve(true); } });
        client.connect().catch(() => { if (!resolved) { resolved = true; resolve(false); } });
      }),
      new Promise(resolve => setTimeout(() => { if (!resolved) { resolved = true; try { client.disconnect(); } catch {} resolve(false); } }, 1500))
    ]);
    redisAvailable = !!result;
  } catch {
    logger.warn('[queue] Redis check exception, using in-memory');
    redisAvailable = false;
  }
  if (!redisAvailable) logger.warn('[queue] Using IN-MEMORY queues (no redis)');
  return redisAvailable;
}

/**
 * 内存队列 - 实现 Bull 的最小 API (add / process / on / getCounts / close)
 */
function createMemoryQueue(name) {
  const jobs = [];
  const handlers = { process: null };
  const eventCallbacks = { failed: [], completed: [], stalled: [] };
  const stats = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

  function on(evt, cb) {
    if (eventCallbacks[evt]) eventCallbacks[evt].push(cb);
  }

  function emit(evt, ...args) {
    (eventCallbacks[evt] || []).forEach(cb => { try { cb(...args); } catch(e) {} });
  }

  function add(data, opts = {}) {
    const jobId = 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const job = {
      id: jobId, data, opts,
      attemptsMade: 0,
      progress: () => {},
      log: () => {},
    };
    if (opts.delay) {
      stats.delayed++;
      setTimeout(() => {
        stats.delayed--;
        _dispatch(job);
      }, opts.delay);
    } else {
      jobs.push(job);
      stats.waiting++;
      setImmediate(() => _dispatchNext());
    }
    return Promise.resolve(job);
  }

  function process(cb) {
    handlers.process = cb;
    // 有积压则处理
    setImmediate(() => _dispatchNext());
  }

  function _dispatch(job) {
    if (!handlers.process) return;
    stats.waiting--;
    stats.active++;
    Promise.resolve().then(() => handlers.process(job))
      .then(() => {
        stats.active--;
        stats.completed++;
        emit('completed', job);
      })
      .catch(err => {
        stats.active--;
        job.attemptsMade++;
        const maxAttempts = (job.opts && job.opts.attempts) || 3;
        if (job.attemptsMade < maxAttempts) {
          const delay = Math.pow(2, job.attemptsMade) * 1000;
          stats.delayed++;
          setTimeout(() => { stats.delayed--; _dispatch(job); }, delay);
        } else {
          stats.failed++;
          logger.error(`[mem-queue:${name}] Job ${job.id} permanently failed: ${err.message}`);
          emit('failed', job, err);
        }
      });
  }

  function _dispatchNext() {
    if (jobs.length > 0) {
      const job = jobs.shift();
      _dispatch(job);
    }
  }

  function getWaitingCount() { return Promise.resolve(stats.waiting); }
  function getActiveCount() { return Promise.resolve(stats.active); }
  function getCompletedCount() { return Promise.resolve(stats.completed); }
  function getFailedCount() { return Promise.resolve(stats.failed); }
  function getDelayedCount() { return Promise.resolve(stats.delayed); }
  function getJobCounts() { return Promise.resolve({ ...stats }); }

  async function close() {
    while (jobs.length) await new Promise(r => setTimeout(r, 100));
    return Promise.resolve();
  }

  return { add, process, on, close, getWaitingCount, getActiveCount, getCompletedCount, getFailedCount, getDelayedCount, getJobCounts, _isMemory: true, _name: name };
}

function getQueue(name, options = {}) {
  if (queues[name]) return queues[name];

  if (!redisAvailable || !Bull) {
    logger.info(`[queue] Using IN-MEMORY queue for "${name}"`);
    inMemoryQueues[name] = createMemoryQueue(name);
    queues[name] = inMemoryQueues[name];
    return queues[name];
  }

  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  queues[name] = new Bull(name, {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 500,
      ...options,
    },
  });

  queues[name].on('failed', (job, err) => {
    logger.error(`[queue:${name}] Job ${job && job.id} failed`, { error: err.message });
  });
  queues[name].on('stalled', (job) => {
    logger.warn(`[queue:${name}] Job ${job && job.id} stalled`);
  });
  logger.info(`[queue] Queue "${name}" initialized (Bull+Redis)`);
  return queues[name];
}

const QUEUE_NAMES = {
  TRANSCRIPT_PARSE: 'transcript-parse',
  ACTION_EXTRACT: 'action-extract',
  TASK_SYNC: 'task-sync',
  TRAINING: 'model-training',
  VALIDATION: 'validation-run',
  NOTIFICATION: 'notification',
};

async function addJob(queueName, data, opts = {}) {
  await _checkRedis();
  const q = getQueue(queueName);
  return q.add(data, opts);
}

async function getQueueStats(queueName) {
  const q = queues[queueName];
  if (!q) return null;
  if (q._isMemory) {
    return {
      waiting: (await q.getWaitingCount()),
      active: (await q.getActiveCount()),
      completed: (await q.getCompletedCount()),
      failed: (await q.getFailedCount()),
      delayed: (await q.getDelayedCount()),
    };
  }
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

async function getAllQueueStats() {
  await _checkRedis();
  const stats = {};
  for (const name of Object.keys(QUEUE_NAMES)) {
    const s = await getQueueStats(QUEUE_NAMES[name]);
    if (s) stats[QUEUE_NAMES[name]] = s;
  }
  return stats;
}

async function closeAllQueues() {
  for (const [name, q] of Object.entries(queues)) {
    await q.close();
    logger.info(`[queue] Queue "${name}" closed`);
  }
}

module.exports = {
  QUEUE_NAMES,
  getQueue,
  addJob,
  getQueueStats,
  getAllQueueStats,
  closeAllQueues,
  _checkRedis,
};
