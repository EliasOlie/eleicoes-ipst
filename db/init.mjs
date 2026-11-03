import postgres from 'postgres';
import crypto from 'crypto';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

const sql = postgres(connectionString);

function hashPassword(password) {
  const salt = 'ipst_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export const INITIAL_DIAC = [
  ['d1', 'André Lucas Ferraz', 5],
  ['d2', 'Benedito Alves Nogueira', 3],
  ['d3', 'Cícero Monteiro Lima', 4],
  ['d4', 'Daniel Bezerra Torres', 2],
  ['d5', 'Elias Cavalcanti Souza', 3.5],
  ['d6', 'Fábio Rodrigues Araújo', 1.5],
];

export const INITIAL_PRESB = [
  ['p1', 'Gilberto Magalhães Silva', 5],
  ['p2', 'Hélio Pereira Barbosa', 3],
  ['p3', 'Isaías Ferreira Lima', 4],
  ['p4', 'Jonas Araújo Bezerra', 1.5],
];

const FIRST = [
  'Maria', 'José', 'Ana', 'João', 'Francisca', 'Antônio', 'Josefa', 'Paulo',
  'Raimunda', 'Pedro', 'Luzia', 'Carlos', 'Rita', 'Marcos', 'Helena',
  'Severino', 'Joana', 'Lucas', 'Débora', 'Samuel'
];

const LAST = [
  'Silva', 'Ferreira', 'Lima', 'Souza', 'Alves', 'Nogueira', 'Pereira',
  'Barbosa', 'Rodrigues', 'Cavalcanti', 'Monteiro', 'Magalhães', 'Araújo',
  'Torres', 'Bezerra'
];

let seed = 42;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pad = (n) => String(n).padStart(2, '0');

function generateMembers() {
  seed = 42;
  const list = [];
  for (let i = 0; i < 86; i++) {
    const fn = FIRST[Math.floor(rnd() * FIRST.length)];
    const ln1 = LAST[Math.floor(rnd() * LAST.length)];
    const ln2 = LAST[Math.floor(rnd() * LAST.length)];
    const name = `${fn} ${ln1} ${ln2}`;
    const d = () => Math.floor(rnd() * 10);
    const phone = `(87) 9 9${d()}${d()}${d()}-${d()}${d()}${d()}${d()}`;
    const mins = Math.floor(rnd() * 45);
    list.push({ id: i + 1, name, phone, time: `19:${pad(mins)}` });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

async function migrate() {
  console.log('--- Initializing database schema on PostgreSQL ---');

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
      published_quorum INT DEFAULT 77,
      published_at VARCHAR(20) DEFAULT '19:45',
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
  console.log('✓ members table ready');

  // 5. Secret Ballots / Votes Table (Zero connection to members table for ballot secrecy)
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      receipt VARCHAR(20) UNIQUE NOT NULL,
      is_blank BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
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
    const defaultHash = hashPassword('ipst2026');
    await sql`
      INSERT INTO admins (username, password_hash, name, role)
      VALUES ('admin', ${defaultHash}, 'Conselho da Igreja', 'admin')
    `;
    console.log('✓ Seeded default admin: admin / ipst2026');
  }

  // Seed election_config if not exists
  const configExists = await sql`SELECT id FROM election_config WHERE id = 1`;
  if (configExists.length === 0) {
    await sql`
      INSERT INTO election_config (id, title, voting_open, published_quorum, published_at, vagas_diac, vagas_presb, total_comungantes)
      VALUES (1, 'Eleição de Oficiais 2026', false, 77, '19:45', 3, 2, 214)
    `;
    console.log('✓ Seeded initial election_config');
  }

  // Seed candidates if not exists
  const candidateCount = await sql`SELECT count(*)::int as count FROM candidates`;
  if (candidateCount[0].count === 0) {
    for (const [id, name, weight] of INITIAL_DIAC) {
      await sql`
        INSERT INTO candidates (id, role, name, weight)
        VALUES (${id}, 'diac', ${name}, ${weight})
      `;
    }
    for (const [id, name, weight] of INITIAL_PRESB) {
      await sql`
        INSERT INTO candidates (id, role, name, weight)
        VALUES (${id}, 'presb', ${name}, ${weight})
      `;
    }
    console.log('✓ Seeded 6 Diáconos and 4 Presbíteros');
  }

  // Seed members if not exists
  const memberCount = await sql`SELECT count(*)::int as count FROM members`;
  if (memberCount[0].count === 0) {
    const members = generateMembers();
    seed = 100;
    for (const m of members) {
      const isChecked = rnd() < 0.9;
      await sql`
        INSERT INTO members (name, phone, checked_in, checked_at)
        VALUES (${m.name}, ${m.phone}, ${isChecked}, ${m.time})
      `;
    }
    console.log(`✓ Seeded ${members.length} members with initial ata check-ins`);
  }

  console.log('🎉 Database initialization complete!');
  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
