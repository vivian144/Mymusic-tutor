const Redis = require('ioredis');

// FIX 8: REDIS_URL now includes the password (redis://:password@host:port)
// ioredis parses the URL automatically, including auth credentials.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.warn('[Redis] Connection closed');
});

module.exports = redis;
