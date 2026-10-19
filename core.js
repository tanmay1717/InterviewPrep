/**
 * Shared logic for the extension popup (popup.js) and the website (web/app.js):
 * storage helpers, progress stats, and cloud sync. Loaded after config/studyplan/problems/calendar/cloud.
 */
// ---------- Storage helpers ----------
const getAll = () => chrome.storage.local.get(null);
const setKeys = (obj) => chrome.storage.local.set(obj);
const $ = (id) => document.getElementById(id);

const PLAN_CATS = ["dsa", "lld", "hld", "behavioral"];
const DIFF_LABEL = { E: "Easy", M: "Med", H: "Hard" };

const ALL_PROBLEMS = CODING_PATTERNS.flatMap((p) =>
  p.problems.map(([slug, title, diff, premium]) => ({ slug, title, diff, premium: !!premium, pattern: p.id }))
);
// Every problem the app knows about (pattern list + 90-day calendar), by slug -> difficulty.
const PROBLEM_DIFF = Object.fromEntries([
  ...Object.values(DSA90.DAYS).flatMap((day) => (day.problems || []).map((p) => [p.slug, p.d])),
  ...ALL_PROBLEMS.map((p) => [p.slug, p.diff])
]);
const SD_KEYS = [
  ...SYSTEM_DESIGN.roadmap.flatMap((w) => w.topics.map((_, i) => sdTopicKey(w.id, i))),
  ...SYSTEM_DESIGN.problems.map((p) => `p-${p.id}`)
];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function timeAgo(iso) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function totalTaskCount() {
  let n = 0;
  for (const w of STUDY_PLAN) {
    PLAN_CATS.forEach((c) => {
      if (w[c]) n += w[c].length;
    });
  }
  return n;
}

function getCurrentWeekInfo() {
  const start = new Date(START_DATE + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.min(Math.max(Math.floor(diffDays / 7), 0), STUDY_PLAN.length - 1);
  return { weekIndex, dayOfWeek: now.getDay(), diffDays };
}

function setRing(el, pct) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  el.style.background = `conic-gradient(var(--accent) ${clamped * 3.6}deg, var(--border) 0deg)`;
  const label = el.querySelector(".ring-inner");
  if (label) label.textContent = `${clamped}%`;
}

function bar(done, total, cls = "") {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="bar ${cls}"><div class="bar-fill" style="width:${pct}%"></div></div>`;
}

// ---------- Stats (used for you and for friends) ----------
// What gets synced to your account (and is readable by accepted friends).
// Applications are deliberately left out - not even a count leaves the device.
function shareData(d) {
  return {
    studyProgress: d.studyProgress || {},
    solvedProblems: d.solvedProblems || {},
    sdProgress: d.sdProgress || {},
    dayProgress: d.dayProgress || {},
    customProblems: d.customProblems || {},
    customResources: d.customResources || []
  };
}

function computeStats(data) {
  const study = data.studyProgress || {};
  const solved = data.solvedProblems || {};
  const sd = data.sdProgress || {};
  const days = data.dayProgress || {};

  // Built-in problems plus any the user added to calendar days.
  const diffMap = { ...PROBLEM_DIFF };
  Object.values(data.customProblems || {}).flat().forEach((p) => {
    const key = customKey(p);
    if (!diffMap[key]) diffMap[key] = p.d;
  });
  const byDiff = { E: 0, M: 0, H: 0 };
  const byPattern = {};
  Object.entries(diffMap).forEach(([slug, diff]) => { if (solved[slug] && byDiff[diff] !== undefined) byDiff[diff]++; });
  ALL_PROBLEMS.forEach((p) => {
    if (solved[p.slug]) byPattern[p.pattern] = (byPattern[p.pattern] || 0) + 1;
  });

  const dates = new Set(Object.values(solved).filter((v) => typeof v === "string"));
  const weekStart = daysAgo(6);
  const thisWeek = Object.values(solved).filter((v) => typeof v === "string" && v >= weekStart).length;
  let streak = 0;
  let offset = dates.has(dateStr()) ? 0 : 1; // streak survives until the end of today
  while (dates.has(daysAgo(offset))) { streak++; offset++; }

  const planTotal = totalTaskCount();
  return {
    planDone: Object.values(study).filter(Boolean).length,
    planTotal,
    planPct: planTotal ? (Object.values(study).filter(Boolean).length / planTotal) * 100 : 0,
    coding: byDiff.E + byDiff.M + byDiff.H,
    codingTotal: Object.keys(diffMap).length,
    byDiff,
    byPattern,
    thisWeek,
    streak,
    sdDone: SD_KEYS.filter((k) => sd[k]).length,
    sdTotal: SD_KEYS.length,
    daysDone: Object.keys(DSA90.DAYS).filter((d) => days[d]).length,
    daysTotal: DSA90.TOTAL
  };
}

// ---------- Cloud sync ----------
// Last-write-wins per account, except the first sign-in on a machine, which merges both sides.
function mergeProgress(local, remote) {
  const orMerge = (a = {}, b = {}) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) if (v) out[k] = v;
    return out;
  };
  const solved = { ...(local.solvedProblems || {}) };
  const customProblems = { ...(local.customProblems || {}) };
  for (const [day, list] of Object.entries(remote.customProblems || {})) {
    const ids = new Set((customProblems[day] || []).map((p) => p.id));
    customProblems[day] = [...(customProblems[day] || []), ...list.filter((p) => !ids.has(p.id))];
  }
  const resIds = new Set((local.customResources || []).map((r) => r.id));
  const customResources = [...(local.customResources || []), ...(remote.customResources || []).filter((r) => !resIds.has(r.id))];
  for (const [k, v] of Object.entries(remote.solvedProblems || {})) {
    if (!solved[k] || (v && v < solved[k])) solved[k] = v;
  }
  return {
    studyProgress: orMerge(local.studyProgress, remote.studyProgress),
    sdProgress: orMerge(local.sdProgress, remote.sdProgress),
    dayProgress: orMerge(local.dayProgress, remote.dayProgress),
    solvedProblems: solved,
    customProblems,
    customResources
  };
}

let pushChain = Promise.resolve();
function queuePush() {
  pushChain = pushChain.then(async () => {
    if (!Cloud.isConfigured() || !(await Cloud.getSession())) return;
    const d = await getAll();
    try {
      await Cloud.pushProgress(shareData(d), d.localUpdatedAt || new Date().toISOString());
      await setKeys({ lastSyncedAt: new Date().toISOString() });
    } catch (e) {
      console.warn("Progress push failed (will retry next open):", e);
    }
    updateSyncLabel();
  });
  return pushChain;
}

async function markChanged() {
  await setKeys({ localUpdatedAt: new Date().toISOString() });
  queuePush();
}

async function syncOnOpen() {
  if (!Cloud.isConfigured()) return;
  const session = await Cloud.getSession();
  if (!session) return;
  try {
    let d = await getAll();
    const previousUser = d.syncedUserId;
    if (!d.profile) await Cloud.getMyProfile();
    const remote = await Cloud.pullProgress();
    d = await getAll();

    if (d.syncedUserId !== session.user.id) {
      // First sign-in here: keep progress made before signing in (merge with the account).
      // But if this device last synced a *different* account, never mix that person's
      // progress into this one - start from this account's own data instead.
      const base = d.syncedUserId ? {} : d;
      await setKeys({
        ...mergeProgress(base, (remote && remote.data) || {}),
        syncedUserId: session.user.id,
        localUpdatedAt: new Date().toISOString()
      });
      await queuePush();
    } else if (remote && (!d.localUpdatedAt || Date.parse(remote.updated_at) > Date.parse(d.localUpdatedAt))) {
      await setKeys({
        studyProgress: remote.data.studyProgress || {},
        solvedProblems: remote.data.solvedProblems || {},
        sdProgress: remote.data.sdProgress || {},
        dayProgress: remote.data.dayProgress || {},
        customProblems: remote.data.customProblems || {},
        customResources: remote.data.customResources || [],
        localUpdatedAt: remote.updated_at,
        lastSyncedAt: new Date().toISOString()
      });
    } else if (!remote || Date.parse(d.localUpdatedAt) > Date.parse(remote.updated_at)) {
      await queuePush();
    } else {
      await setKeys({ lastSyncedAt: new Date().toISOString() });
    }
    // Older versions uploaded application counts; overwrite them with a copy that has none.
    if (remote && remote.data && ("appCount" in remote.data || "appStatus" in remote.data)) await queuePush();
    await syncApplications(previousUser, session.user.id);
  } catch (e) {
    console.warn("Sync failed:", e);
  }
}

// ---------- Applications sync (private to you, never part of what friends receive) ----------
// Same rules as progress: newest copy wins; the first sign-in on a device merges in applications
// already saved there, unless the device was last used by a different account.
async function syncApplications(previousUser, userId) {
  const remote = await Cloud.pullApplications();
  const remoteApps = (remote && remote.data && remote.data.applications) || [];
  const d = await getAll();
  if (previousUser !== userId) {
    const local = previousUser ? [] : (d.applications || []);
    const ids = new Set(remoteApps.map((a) => a.id));
    await setKeys({ applications: [...remoteApps, ...local.filter((a) => !ids.has(a.id))], appsUpdatedAt: new Date().toISOString() });
    await queueAppsPush();
  } else if (remote && (!d.appsUpdatedAt || Date.parse(remote.updated_at) > Date.parse(d.appsUpdatedAt))) {
    await setKeys({ applications: remoteApps, appsUpdatedAt: remote.updated_at });
  } else if (d.appsUpdatedAt && (!remote || Date.parse(d.appsUpdatedAt) > Date.parse(remote.updated_at))) {
    await queueAppsPush();
  }
}

let appsPushChain = Promise.resolve();
function queueAppsPush() {
  appsPushChain = appsPushChain.then(async () => {
    if (!Cloud.isConfigured() || !(await Cloud.getSession())) return;
    const d = await getAll();
    try {
      await Cloud.pushApplications(d.applications || [], d.appsUpdatedAt || new Date().toISOString());
    } catch (e) {
      console.warn("Applications push failed (will retry next open):", e);
    }
  });
  return appsPushChain;
}

// Call after any change to the applications list.
async function markAppsChanged() {
  await setKeys({ appsUpdatedAt: new Date().toISOString() });
  queueAppsPush();
}

async function updateSyncLabel() {
  const el = $("sync-label");
  if (!el) return;
  const { lastSyncedAt } = await chrome.storage.local.get("lastSyncedAt");
  el.textContent = `Synced ${timeAgo(lastSyncedAt)}`;
}

// Marks a 90-day calendar day done/undone. Done also marks its problems solved;
// undoing clears them unless another finished day includes the same problem.
async function setDayDone(day, done) {
  const d = await getAll();
  const dayProgress = d.dayProgress || {};
  const solved = d.solvedProblems || {};
  if (done) dayProgress[day] = true;
  else delete dayProgress[day];
  const custom = d.customProblems || {};
  const slugs = dayProblemKeys(day, custom);
  if (done) {
    slugs.forEach((s) => { if (!solved[s]) solved[s] = dateStr(); });
  } else {
    const stillDone = new Set(Object.keys(dayProgress).flatMap((k) => dayProblemKeys(k, custom)));
    slugs.forEach((s) => { if (!stillDone.has(s)) delete solved[s]; });
  }
  await setKeys({ dayProgress, solvedProblems: solved });
  await markChanged();
}

function nextDay(dayProgress = {}) {
  for (let i = 1; i <= DSA90.TOTAL; i++) if (!dayProgress[i]) return i;
  return null;
}

// ---------- User-added questions and resources ----------
// Custom calendar questions: { [day]: [{ id, slug?, n, url, d }] }. LeetCode ones are keyed by slug
// so they count once even if they also appear elsewhere; any other link is keyed by its id.
const customKey = (p) => p.slug || p.id;
const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function dayProblemKeys(day, custom = {}) {
  return [
    ...(DSA90.DAYS[day].problems || []).map((p) => p.slug),
    ...(custom[day] || []).map(customKey)
  ];
}

// Only http(s) links are allowed, so a pasted "javascript:" URL can never end up in an href.
function safeUrl(text) {
  try {
    const u = new URL(String(text).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Accepts a LeetCode link, any other link, a plain problem name (searched on LeetCode),
// or a name followed by a link ("Equilibrium Point https://...") to set the title yourself.
function parseProblemInput(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  const found = /\bhttps?:\/\/\S+/i.exec(t);
  const url = found && safeUrl(found[0]);
  const typedTitle = found ? t.replace(found[0], "").replace(/[\s|:,-]+$|^[\s|:,-]+/g, "").trim() : "";
  if (url) {
    const m = /leetcode\.com\/problems\/([a-z0-9-]+)/i.exec(url);
    if (m) {
      const slug = m[1].toLowerCase();
      return { slug, n: (typedTitle || titleFromSlug(slug)).slice(0, 120), url: `https://leetcode.com/problems/${slug}/` };
    }
    return { n: (typedTitle || titleFromUrl(url)).slice(0, 120), url };
  }
  if (/^[a-z]+:\S*$/i.test(t)) return null; // a link, but not http(s)
  return { n: t.slice(0, 120), url: `https://leetcode.com/problemset/?search=${encodeURIComponent(t)}` };
}

// Best-effort readable title from a URL: the most word-like path segment, minus ids and extensions.
function titleFromUrl(url) {
  const u = new URL(url);
  const words = u.pathname.split("/").filter(Boolean)
    .map((seg) => decodeURIComponent(seg).replace(/\.\w+$/, "").replace(/[-_]\d{4,}$/, ""))
    .filter((seg) => /[a-z]{3}/i.test(seg) && !/^(problems?|questions?|practice|p|courses?|watch|article)$/i.test(seg));
  const best = words.sort((a, b) => b.length - a.length)[0];
  return best ? titleFromSlug(best) : u.hostname.replace(/^www\./, "");
}

async function addCustomProblem(day, text, diff) {
  const parsed = parseProblemInput(text);
  if (!parsed) throw new Error("Enter a problem name or an http(s) link");
  const d = await getAll();
  const custom = d.customProblems || {};
  const existing = dayProblemKeys(day, custom);
  if (parsed.slug && existing.includes(parsed.slug)) throw new Error("That problem is already on this day");
  const item = { id: newId(), ...parsed, d: ["E", "M", "H"].includes(diff) ? diff : "M" };
  custom[day] = [...(custom[day] || []), item];
  const updates = { customProblems: custom };
  // Adding to a finished day counts it as solved straight away.
  if ((d.dayProgress || {})[day]) {
    const solved = d.solvedProblems || {};
    if (!solved[customKey(item)]) solved[customKey(item)] = dateStr();
    updates.solvedProblems = solved;
  }
  await setKeys(updates);
  await markChanged();
}

async function removeCustomProblem(day, id) {
  const d = await getAll();
  const custom = d.customProblems || {};
  const item = (custom[day] || []).find((p) => p.id === id);
  if (!item) return;
  custom[day] = custom[day].filter((p) => p.id !== id);
  if (!custom[day].length) delete custom[day];
  const solved = d.solvedProblems || {};
  const key = customKey(item);
  const stillUsed = Object.keys(d.dayProgress || {}).some((k) => dayProblemKeys(k, custom).includes(key));
  if (!stillUsed && !item.slug) delete solved[key];
  await setKeys({ customProblems: custom, solvedProblems: solved });
  await markChanged();
}

async function addCustomResource(group, name, link) {
  const url = safeUrl(link);
  if (!url) throw new Error("Enter a full link starting with http:// or https://");
  const title = String(name || "").trim() || new URL(url).hostname;
  const section = String(group || "").trim() || "My resources";
  const d = await getAll();
  const list = d.customResources || [];
  list.push({ id: newId(), group: section.slice(0, 60), name: title.slice(0, 140), url });
  await setKeys({ customResources: list });
  await markChanged();
}

async function removeCustomResource(id) {
  const d = await getAll();
  await setKeys({ customResources: (d.customResources || []).filter((r) => r.id !== id) });
  await markChanged();
}

// Built-in resource groups plus the user's own, as { group: [{ name, url, id? }] }.
function allResources(customResources = []) {
  const groups = {};
  for (const [g, links] of Object.entries(RESOURCES)) groups[g] = links.map((l) => ({ ...l }));
  for (const r of customResources) {
    const url = safeUrl(r.url);
    if (!url) continue;
    (groups[r.group] = groups[r.group] || []).push({ id: r.id, name: r.name, url });
  }
  return groups;
}

// Short source name shown on "learn" links, e.g. "System Design Primer", "MDN".
function sourceName(url) {
  const sources = [
    ["system-design-primer", "System Design Primer"], ["hellointerview.com", "Hello Interview"],
    ["refactoring.guru", "Refactoring Guru"], ["developer.mozilla.org", "MDN"], ["owasp.org", "OWASP"],
    ["aws.amazon.com", "AWS"], ["wikipedia.org", "Wikipedia"], ["youtu", "YouTube"], ["microservices.io", "microservices.io"],
    ["use-the-index-luke.com", "Use The Index, Luke"], ["jwt.io", "jwt.io"], ["digitalocean.com", "DigitalOcean"],
    ["visual-paradigm.com", "Visual Paradigm"], ["allthingsdistributed.com", "Amazon paper"]
  ];
  const hit = sources.find(([needle]) => url.includes(needle));
  return hit ? hit[1] : new URL(url).hostname.replace(/^www\./, "");
}
