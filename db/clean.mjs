import postgres from 'postgres';
import Redis from 'ioredis';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Defina DATABASE_URL no ambiente.');
  process.exit(1);
}

const sql = postgres(connectionString);

async function clean() {
  console.log('--- Cleaning database test data ---');

  await sql`TRUNCATE TABLE vote_candidates, votes, members RESTART IDENTITY CASCADE;`;
  console.log('✓ Truncated votes, vote_candidates, and members');

  await sql`
    UPDATE election_config
    SET voting_open = FALSE,
        published_quorum = 0,
        published_at = '',
        vagas_diac = 3,
        vagas_presb = 2,
        total_comungantes = 300
    WHERE id = 1;
  `;
  console.log('✓ Reset election_config to initial unstarted state');

  const [membersCount, votesCount, candidatesCount, adminsCount] = await Promise.all([
    sql`SELECT count(*) FROM members`,
    sql`SELECT count(*) FROM votes`,
    sql`SELECT count(*) FROM candidates`,
    sql`SELECT count(*) FROM admins`,
  ]);

  console.log('Current DB state:', {
    members: membersCount[0].count,
    votes: votesCount[0].count,
    candidates: candidatesCount[0].count,
    admins: adminsCount[0].count,
  });

  // Notify redis if accessible
  try {
    if (!process.env.REDIS_URL) throw new Error('REDIS_URL não definida — evento não publicado');
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    await redis.publish('app_ipst:election_events', JSON.stringify({ type: 'DATABASE_CLEANED' }));
    await redis.quit();
    console.log('✓ Published cleanup event to Redis');
  } catch (err) {
    console.log('Note on Redis event publish:', err.message);
  }

  await sql.end();
  console.log('🎉 Database cleaned successfully!');
}

clean().catch((err) => {
  console.error('Clean error:', err);
  process.exit(1);
});
