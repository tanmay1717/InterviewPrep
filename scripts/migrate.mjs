// Creates the tables in your Neon database. Usage: `npm run db:migrate`
// Reads DATABASE_URL from the environment or from .env in the project root.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (!process.env.DATABASE_URL && fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set - add it to .env (see .env.example)");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of schema) {
  await sql.query(stmt);
  console.log("ok:", stmt.split("\n")[0]);
}
console.log("Database ready.");
