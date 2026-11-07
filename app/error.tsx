'use client';

import { useEffect } from 'react';
import { StatusPage, primaryBtn, secondaryBtn } from '@/components/status-page';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Algo deu errado"
      message="Houve uma falha ao carregar esta tela. Seu voto não é afetado por este erro: tente novamente em alguns segundos. Se persistir, procure a Mesa."
      actions={
        <>
          <button type="button" onClick={() => reset()} className={primaryBtn}>
            Tentar novamente
          </button>
          <button type="button" onClick={() => (window.location.href = '/')} className={secondaryBtn}>
            Voltar ao início
          </button>
          {error.digest && (
            <span className="text-[11px] text-[#9AA8A0] font-mono pt-1">código: {error.digest}</span>
          )}
        </>
      }
    />
  );
}
