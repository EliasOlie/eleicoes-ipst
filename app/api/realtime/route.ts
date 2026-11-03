import { NextRequest } from 'next/server';
import { createRedisSubscriber, REDIS_CHANNEL } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const subscriber = createRedisSubscriber();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let isClosed = false;

  const cleanup = async () => {
    if (isClosed) return;
    isClosed = true;
    try {
      await subscriber.unsubscribe(REDIS_CHANNEL);
      await subscriber.quit();
    } catch (e) {
      // Ignored
    }
    try {
      await writer.close();
    } catch (e) {
      // Ignored
    }
  };

  req.signal.addEventListener('abort', cleanup);

  subscriber.on('message', async (channel, message) => {
    if (channel === REDIS_CHANNEL && !isClosed) {
      try {
        await writer.write(encoder.encode(`data: ${message}\n\n`));
      } catch (err) {
        cleanup();
      }
    }
  });

  // Subscribe and send initial ping
  subscriber
    .subscribe(REDIS_CHANNEL)
    .then(async () => {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', time: Date.now() })}\n\n`)
      );
    })
    .catch((err) => {
      console.error('SSE Redis subscribe error:', err);
      cleanup();
    });

  // Keep-alive heartbeat every 20s
  const interval = setInterval(async () => {
    if (isClosed) {
      clearInterval(interval);
      return;
    }
    try {
      await writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch {
      clearInterval(interval);
      cleanup();
    }
  }, 20000);

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
