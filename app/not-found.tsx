import Link from 'next/link';
import { StatusPage, primaryBtn } from '@/components/status-page';

export const metadata = { title: 'Página não encontrada — Eleição IPST 2026' };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Página não encontrada"
      message="O endereço digitado não existe. Confira o link ou volte para a tela de votação."
      actions={
        <Link href="/" className={primaryBtn}>
          Ir para a votação
        </Link>
      }
    />
  );
}
