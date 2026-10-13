// Builds the hosted website into public/: the web/ UI plus the data and logic files it shares with the extension.
// Run by Vercel on every deploy (see vercel.json) and by `npm run dev`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

console.log("Built website into", path.relative(root, out) + "/");
