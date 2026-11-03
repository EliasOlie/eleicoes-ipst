import postgres from 'postgres';
import Redis from 'ioredis';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

const sql = postgres(connectionString);

async function clean() {
  console.log('--- Cleaning database test data ---');

  await sql`TRUNCATE TABLE vote_candidates, votes, members RESTART IDENTITY CASCADE;`;
  console.log('✓ Truncated votes, vote_candidates, and members');

  await sql`
    UPDATE election_config
    SET voting_open = FALSE,
        published_quorum = 0,
        published_at = ''
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
    const redis = new Redis('redis://app_ipst:MYS4oA1YIUO7aXS9KKWifBK4@vpsql.eliasolie.com.br:6380', {
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
