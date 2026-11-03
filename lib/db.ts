import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

const globalForSql = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql =
  globalForSql.sql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSql.sql = sql;
}

export default sql;
