// Packages the Chrome extension into a zip that the website offers as a download.
// The zipped copy is ready to use: config.js points at the site it was downloaded from,
// and the manifest gets a fixed "key" so every install has the same extension ID
// (needed if you set up Google OAuth for Gmail detection). Your local working folder is untouched.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const FILES = [
  "manifest.json", "background.js",
  "popup.html", "popup.css", "popup.js",
  "options.html", "options.css", "options.js",
  "studyplan.js", "problems.js", "calendar.js", "cloud.js", "core.js", "theme.js",
  "icons/icon16.png", "icons/icon48.png", "icons/icon128.png"
];
const FOLDER = "interview-prep-extension";

// ---- minimal zip writer (deflate + CRC-32, no dependencies) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const DOS_TIME = 0, DOS_DATE = (2026 - 1980) << 9 | 1 << 5 | 1; // fixed date keeps builds reproducible
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(0, 30); // extra + comment lengths
    central.writeUInt32LE(0, 34); // disk + internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + compressed.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// Chrome derives an extension's ID from its public key: SHA-256, first 32 hex digits, 0-f -> a-p.
export function extensionId(keyBase64) {
  return crypto.createHash("sha256").update(Buffer.from(keyBase64, "base64")).digest("hex")
    .slice(0, 32).split("").map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
}

export function packageExtension(root, outDir, siteUrl) {
  const origin = new URL(siteUrl).origin;
  const key = fs.readFileSync(path.join(root, "web", "extension-key.txt"), "utf8").trim();

  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  manifest.key = key;
  // Leave Google sign-in config out of the download until a real client ID is set.
  if (manifest.oauth2 && String(manifest.oauth2.client_id || "").includes("PASTE_YOUR")) delete manifest.oauth2;
  // Make sure the extension may call this site's API (custom domains, localhost while developing).
  const pattern = `${origin}/*`;
  const covered = manifest.host_permissions.some((p) => p === pattern ||
    (p.startsWith("https://*.") && origin.startsWith("https://") && origin.endsWith(p.slice(9, -2))));
  if (!covered) manifest.host_permissions.push(pattern.replace(/:\d+\/\*$/, "/*"));

  const readme = `# Interview Prep Tracker - browser extension

Version ${manifest.version} · works with ${origin}

Your next day on the 90 Days DSA Calendar one click away in the toolbar, plus two things the
website can't do: Gmail application detection and a daily study reminder. It signs in with your
website account, so your calendar, system design progress, added questions, resources and job
applications stay in sync everywhere.

Works in Chrome, Microsoft Edge, Brave and Arc.

## Install (about a minute)

1. **Keep this folder somewhere permanent**, e.g. Documents. The browser loads the extension
   from it, so don't delete or move it after installing.
2. **Open the extensions page** - paste into the address bar:
   - Chrome / Arc: chrome://extensions
   - Edge: edge://extensions
   - Brave: brave://extensions
3. **Turn on "Developer mode"** (switch in the top-right corner; in Edge it's on the left).
4. **Click "Load unpacked"** and select this \`interview-prep-extension\` folder
   (the one containing manifest.json).
5. **Pin it**: click the puzzle-piece icon in the toolbar and pin "Interview Prep Tracker".
6. **Sign in**: open it, go to the **Friends** tab and sign in with your website account.
   No account yet? Create one there or at ${origin}

## Update to a new version

1. Download the latest zip from ${origin}/#extension
2. Replace this folder with the new one (same location).
3. On the extensions page, click the reload icon ↻ on the Interview Prep Tracker card.

Your progress lives in your account, so updating never loses anything.

## What's inside the popup

- **Home** - today's day on the 90-day calendar with its problems and a "Mark day done" box,
  plus your streak and stats.
- **Practice** - 150 pattern-wise coding problems and the system design roadmap.
- **Plan** - the 9-week study plan.
- **Friends** - sign in, add friends by username, leaderboard and compare.
- **Apps** - your job applications, synced privately to your account.
- **Links** - resources, including any you added on the website.
- Moon/sun button in the header switches between dark and light themes.

## Privacy

- Friends see your study progress only - never anything about your applications.
- Applications sync to a private part of your account that only you can read.
- The extension only talks to ${origin} (your account) and, if you enable it, Gmail.

## Reminders and Gmail detection

- **Daily reminder** - works straight away. Right-click the extension icon > Options to set the time.
- **Gmail detection** - when it's available, a "Connect Gmail" button appears in the Apps tab.
  It finds job-application emails and adds them for you to confirm.

## Troubleshooting

- **"Manifest file is missing or unreadable"** - you selected the zip or a parent folder.
  Select the folder that directly contains manifest.json.
- **The browser shows a "Developer mode" reminder** - that's normal for extensions installed
  from a folder instead of the Web Store. Click Keep / Dismiss.
- **Can't sign in** - check you can sign in at ${origin} with the same email and password.
- **Extension disappeared** - the folder was moved or deleted. Put it back and click
  "Load unpacked" again; your progress is still in your account.
`;

  const entries = FILES.map((f) => {
    let data = fs.readFileSync(path.join(root, f));
    if (f === "manifest.json") data = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
    return { name: `${FOLDER}/${f}`, data };
  });
  entries.push({ name: `${FOLDER}/config.js`, data: Buffer.from(`// Points the extension at the site it was downloaded from.\nconst API_BASE_URL = "${origin}";\n`) });
  entries.push({ name: `${FOLDER}/README.md`, data: Buffer.from(readme) });

  const zipBuf = zip(entries);
  fs.writeFileSync(path.join(outDir, `${FOLDER}.zip`), zipBuf);
  const info = { version: manifest.version, size: zipBuf.length, id: extensionId(key), site: origin };
  fs.writeFileSync(path.join(outDir, "extension.json"), JSON.stringify(info) + "\n");
  return info;
}
