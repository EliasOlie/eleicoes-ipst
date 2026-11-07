import postgres from 'postgres';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Defina DATABASE_URL no ambiente.');
  process.exit(1);
}

const sql = postgres(connectionString);

function hashPassword(password) {
  const salt = 'ipst_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function migrate() {
  console.log('--- Checking database schema on PostgreSQL ---');

  // 1. Admins Table
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ admins table ready');

  // 2. Election Config Table
  await sql`
    CREATE TABLE IF NOT EXISTS election_config (
      id INT PRIMARY KEY DEFAULT 1,
      title VARCHAR(200) DEFAULT 'Eleição de Oficiais 2026',
      voting_open BOOLEAN DEFAULT FALSE,
      published_quorum INT DEFAULT 0,
      published_at VARCHAR(20) DEFAULT '',
      vagas_diac INT DEFAULT 3,
      vagas_presb INT DEFAULT 2,
      total_comungantes INT DEFAULT 214,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ election_config table ready');

  // 3. Candidates Table
  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id VARCHAR(50) PRIMARY KEY,
      role VARCHAR(20) NOT NULL,
      name VARCHAR(150) NOT NULL,
      weight NUMERIC DEFAULT 2,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ candidates table ready');

  // 4. Members Table
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      checked_in BOOLEAN DEFAULT FALSE,
      checked_at VARCHAR(20) DEFAULT '19:00',
      has_voted BOOLEAN DEFAULT FALSE,
      voted_at TIMESTAMPTZ
    );
  `;
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS voted_on_paper BOOLEAN NOT NULL DEFAULT FALSE`;
  console.log('✓ members table ready');

  // 5. Secret Ballots / Votes Table
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      receipt VARCHAR(20) UNIQUE NOT NULL,
      is_blank BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ -- sigilo: nunca preenchido (horário permitiria ligar cédula a membro)
    );
  `;
  await sql`ALTER TABLE votes ADD COLUMN IF NOT EXISTS is_null BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE votes ALTER COLUMN created_at DROP DEFAULT`;
  console.log('✓ votes table ready');

  // 6. Vote Candidates Table
  await sql`
    CREATE TABLE IF NOT EXISTS vote_candidates (
      id SERIAL PRIMARY KEY,
      vote_id INT REFERENCES votes(id) ON DELETE CASCADE,
      candidate_id VARCHAR(50) REFERENCES candidates(id) ON DELETE CASCADE
    );
  `;
  console.log('✓ vote_candidates table ready');

  // Seed default admin if not exists
  const adminExists = await sql`SELECT id FROM admins WHERE username = 'admin'`;
  if (adminExists.length === 0) {
    // Sem senha padrão no código (repositório público)
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initialPassword || initialPassword.length < 10) {
      console.error('❌ Defina ADMIN_INITIAL_PASSWORD (mínimo 10 caracteres) para criar o admin.');
      await sql.end();
      process.exit(1);
    }
    await sql`
      INSERT INTO admins (username, password_hash, name, role)
      VALUES ('admin', ${hashPassword(initialPassword)}, 'Conselho da Igreja', 'admin')
    `;
    console.log('✓ Admin "admin" criado com a senha de ADMIN_INITIAL_PASSWORD');
  }

  // Ensure election_config exists
  const configExists = await sql`SELECT id FROM election_config WHERE id = 1`;
  if (configExists.length === 0) {
    await sql`
      INSERT INTO election_config (id, title, voting_open, published_quorum, published_at, vagas_diac, vagas_presb, total_comungantes)
      VALUES (1, 'Eleição de Oficiais 2026', false, 0, '', 3, 2, 214)
    `;
  }

  console.log('🎉 Setup complete (sem dados de seed fictícios)!');
  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
