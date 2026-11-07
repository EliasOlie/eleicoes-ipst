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
    // disconnect() não espera o Redis responder (quit() travaria com o Redis fora)
    subscriber.disconnect();
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

  // Subscribe and send initial ping. Se o Redis não responder em 5s, fecha o
  // stream: o navegador entra em erro/reconexão e o cliente usa o polling de reserva.
  const subscribeTimeout = setTimeout(() => {
    console.error('SSE: Redis indisponível, encerrando stream');
    cleanup();
  }, 5000);

  subscriber
    .subscribe(REDIS_CHANNEL)
    .then(async () => {
      clearTimeout(subscribeTimeout);
      if (isClosed) return;
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', time: Date.now() })}\n\n`)
      );
    })
    .catch((err) => {
      clearTimeout(subscribeTimeout);
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
