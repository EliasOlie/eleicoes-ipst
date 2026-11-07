import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { isStressTestEnabled } from '@/lib/election-rules';

export async function GET() {
  const session = await getAdminSession();
  const features = { stressTest: isStressTestEnabled() };
  if (!session) {
    return NextResponse.json({ authenticated: false, features });
  }
  return NextResponse.json({ authenticated: true, admin: session, features });
}
