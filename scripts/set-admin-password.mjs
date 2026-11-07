#!/usr/bin/env node
/**
 * Define (ou troca) a senha de um admin — use para rotacionar a senha da Mesa.
 *
 *   DATABASE_URL=... NEW_ADMIN_PASSWORD='...' node scripts/set-admin-password.mjs [usuario]
 *
 * A senha vem do ambiente (não da linha de comando) para não ficar no histórico do shell.
 * Cria o usuário se ele não existir.
 */
import postgres from 'postgres';
import crypto from 'crypto';

const url = process.env.DATABASE_URL;
const password = process.env.NEW_ADMIN_PASSWORD;
const username = (process.argv[2] || 'admin').trim().toLowerCase();

if (!url) {
  console.error('❌ Defina DATABASE_URL no ambiente.');
  process.exit(1);
}
if (!password || password.length < 10) {
  console.error('❌ Defina NEW_ADMIN_PASSWORD com no mínimo 10 caracteres.');
  process.exit(1);
}

// Mesmo algoritmo de lib/auth.ts
const hash = crypto.pbkdf2Sync(password, 'ipst_salt_2026', 10000, 64, 'sha512').toString('hex');

const sql = postgres(url);
try {
  const rows = await sql`
    INSERT INTO admins (username, password_hash, name, role)
    VALUES (${username}, ${hash}, 'Conselho da Igreja', 'admin')
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    RETURNING id, username
  `;
  console.log(`✓ Senha atualizada para o usuário "${rows[0].username}".`);
  console.log('  Sessões já abertas continuam válidas até trocar também o SESSION_SECRET.');
} finally {
  await sql.end();
}
