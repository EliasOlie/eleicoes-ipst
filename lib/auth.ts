import crypto from 'crypto';
import { cookies } from 'next/headers';

const SALT = 'ipst_salt_2026';
export const COOKIE_NAME = 'ipst_admin_session';

/**
 * Segredo que assina o cookie da Mesa. Obrigatório e sem valor padrão: com o
 * código público, um segredo conhecido permitiria forjar o login de admin.
 * Gere com: openssl rand -base64 48
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET ausente ou curta (mínimo 32 caracteres).');
  }
  return secret;
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const calculated = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
}

export interface SessionData {
  id: number;
  username: string;
  name: string;
  role: string;
  exp: number;
}

export function createSessionToken(data: Omit<SessionData, 'exp'>): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload: SessionData = { ...data, exp };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getSecret())
      .update(encoded)
      .digest('base64url');

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const payload: SessionData = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
