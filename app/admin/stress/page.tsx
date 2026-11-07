import { notFound } from 'next/navigation';
import { isStressTestEnabled } from '@/lib/election-rules';
import { StressClient } from './stress-client';

// Feature flag: sem ENABLE_STRESS_TEST=true a página não existe (404).
// Obs.: com cacheComponents esta página é pré-renderizada no build, então mudar a
// flag na Vercel exige novo deploy. A API (/api/test/stress) lê a flag a cada requisição.
export default function AdminStressPage() {
  if (!isStressTestEnabled()) notFound();
  return <StressClient />;
}
