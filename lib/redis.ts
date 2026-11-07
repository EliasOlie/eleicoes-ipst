import Redis from 'ioredis';

function getNormalizedRedisUrl(): string {
  // Credenciais SOMENTE por variável de ambiente (repositório público)
  if (!process.env.REDIS_URL) {
    console.error('[redis] REDIS_URL não definida — tempo real desativado (clientes usam polling).');
  }
  const raw = process.env.REDIS_URL || 'redis://env-REDIS_URL-nao-definida.invalid:6379';
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

// Sem listener, cada falha de conexão vira "Unhandled error event" no log
if (!redis.listenerCount('error')) {
  redis.on('error', (err) => console.warn('[redis] indisponível:', err.message));
}

export function createRedisSubscriber(): Redis {
  const sub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  sub.on('error', () => {});
  return sub;
}

export const REDIS_CHANNEL = 'app_ipst:election_events';

const PUBLISH_TIMEOUT_MS = 1500;

/**
 * Publica o evento de tempo real SEM bloquear a resposta: voto/conferência já
 * foram gravados no Postgres; se o Redis estiver fora, a requisição não pode
 * ficar pendurada (os clientes caem no polling de reserva).
 */
export async function publishElectionEvent(event: {
  type: string;
  [key: string]: any;
}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      redis.publish(REDIS_CHANNEL, JSON.stringify(event)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout ao publicar no Redis')), PUBLISH_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    console.error('Failed to publish Redis event:', (err as Error).message);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
