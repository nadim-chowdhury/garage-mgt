import { neon } from '@neondatabase/serverless';

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local with your Neon connection string.',
    );
  }
  return url;
}

/**
 * Neon SQL client — a tagged-template function for simple queries
 * and `.query()` for parameterized queries with dynamic SQL.
 *
 * Tagged template usage:
 *   const rows = await sql`SELECT * FROM tenants WHERE id = ${id}`;
 *
 * Parameterized query usage:
 *   const rows = await sql.query("SELECT * FROM tenants WHERE id = $1", [id]);
 */
export const sql = neon(getConnectionString());
