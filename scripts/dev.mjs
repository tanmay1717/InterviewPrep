// Local server: the website + api/*.js, like Vercel does in production. Usage: `npm run dev`
// Uses Neon when DATABASE_URL is set in .env; otherwise a local Postgres (PGlite) stored in .localdb/.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);

const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET missing - add it to .env (see .env.example)");
  process.exit(1);
}

const { setQueryFn } = await import("../lib/db.js");
let dbLabel = "Neon (DATABASE_URL)";
if (!process.env.DATABASE_URL) {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.join(root, ".localdb"));
  await db.exec(fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8"));
  setQueryFn(async (text, params) => (await db.query(text, params)).rows);
  dbLabel = "local Postgres in .localdb/ (set DATABASE_URL in .env to use Neon)";
}

execFileSync(process.execPath, [path.join(root, "scripts", "build-web.mjs")], { stdio: "inherit" });

const handlers = {};
for (const name of ["auth", "me", "progress", "friends"]) {
  handlers[name] = (await import(`../api/${name}.js`)).default;
}
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const publicDir = path.join(root, "public");

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const m = /^\/api\/(\w+)$/.exec(url.pathname);
  if (m && handlers[m[1]]) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    req.query = Object.fromEntries(url.searchParams);
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
    // The response helpers Vercel's Node runtime provides.
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };
    console.log(req.method, url.pathname + url.search);
    return handlers[m[1]](req, res);
  }
  const file = path.join(publicDir, url.pathname === "/" ? "index.html" : url.pathname);
  if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`\nInterview Prep Tracker running at http://localhost:${PORT}`);
  console.log(`Database: ${dbLabel}\n`);
});
