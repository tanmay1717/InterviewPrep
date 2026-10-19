// Builds the hosted website into public/: the web/ UI plus the data and logic files it shares with the extension.
// Run by Vercel on every deploy (see vercel.json) and by `npm run dev`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packageExtension } from "./package-extension.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const copy = (from, to = path.basename(from)) => fs.copyFileSync(path.join(root, from), path.join(out, to));
["studyplan.js", "problems.js", "calendar.js", "cloud.js", "core.js"].forEach((f) => copy(f));
copy("web/index.html");
copy("web/app.css");
copy("web/app.js");
copy("web/shim.js", "web-shim.js");
copy("icons/icon128.png", "icon.png");

// The website talks to its own origin's /api.
fs.writeFileSync(path.join(out, "config.js"), 'const API_BASE_URL = "";\n');

// The downloadable extension, pre-configured for this site. On Vercel the production domain
// comes from its system env vars; set SITE_URL to override (e.g. a custom domain).
const siteUrl = process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
  || "http://localhost:3000";
const ext = packageExtension(root, out, siteUrl);

console.log("Built website into", path.relative(root, out) + "/");
console.log(`Packaged extension v${ext.version} for ${ext.site} (${Math.round(ext.size / 1024)} KB, ID ${ext.id})`);
