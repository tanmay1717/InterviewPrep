// Postgres access. Uses Neon's HTTP driver in production; tests can swap in another
// query function with setQueryFn (e.g. PGlite) so no network DB is needed.
let queryFn = null;

export function setQueryFn(fn) {
  queryFn = fn;
}

export async function q(text, params = []) {
  if (!queryFn) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    queryFn = (t, p) => sql.query(t, p);
  }
  return queryFn(text, params);
}
