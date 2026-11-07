import postgres from 'postgres';

// Credenciais SOMENTE por variável de ambiente (repositório público).
// Sem DATABASE_URL, as consultas falham com um host ".invalid" que explica o motivo.
if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL não definida — configure a variável de ambiente.');
}
const connectionString =
  process.env.DATABASE_URL || 'postgres://env-DATABASE_URL-nao-definida.invalid:5432/app_ipst';

const globalForSql = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql =
  globalForSql.sql ??
  postgres(connectionString, {
    max: 25,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSql.sql = sql;
}

export default sql;
