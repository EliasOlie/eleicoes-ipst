import Redis from 'ioredis';

function getNormalizedRedisUrl(): string {
  const raw =
    process.env.REDIS_URL ||
    'redis://app_ipst:MYS4oA1YIUO7aXS9KKWifBK4@vpsql.eliasolie.com.br:6380';
  // Port 6380 on vpsql is plain Redis, so if prefixed with rediss://, normalize to redis://
  if (raw.startsWith('rediss://') && raw.includes(':6380')) {
    return raw.replace('rediss://', 'redis://');
  }
  return raw;
}

const redisUrl = getNormalizedRedisUrl();

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

export const redis =
  globalForRedis.redisClient ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redis;
}

export function createRedisSubscriber(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
}

export const REDIS_CHANNEL = 'app_ipst:election_events';

export async function publishElectionEvent(event: {
  type: string;
  [key: string]: any;
}) {
  try {
    await redis.publish(REDIS_CHANNEL, JSON.stringify(event));
  } catch (err) {
    console.error('Failed to publish Redis event:', err);
  }
}
