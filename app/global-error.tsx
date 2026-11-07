'use client';

// Erro no próprio layout raiz: precisa de <html>/<body> e não pode depender do CSS global.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#E9ECE8',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#FBFCFA',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,.12)',
            textAlign: 'center',
          }}
        >
          <div style={{ background: '#0A5C36', color: '#fff', padding: '32px 24px' }}>
            <img src="/assets/ipst_logo.jpg" alt="IPST" width={64} height={64} style={{ borderRadius: 16 }} />
            <div style={{ fontSize: 56, fontWeight: 700, color: '#9FD3B1', marginTop: 12 }}>500</div>
          </div>
          <div style={{ padding: 28 }}>
            <h1 style={{ fontSize: 22, margin: '0 0 12px', color: '#15201A' }}>Algo deu errado</h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: '#4A574F', margin: '0 0 20px' }}>
              O sistema teve uma falha inesperada. Tente novamente em alguns segundos. Se persistir, procure a Mesa.
            </p>
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                height: 48,
                border: 0,
                borderRadius: 12,
                background: '#0A5C36',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
            {error.digest && (
              <div style={{ fontSize: 11, color: '#9AA8A0', marginTop: 12, fontFamily: 'monospace' }}>
                código: {error.digest}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
