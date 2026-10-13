importScripts("studyplan.js");

const DEFAULT_SETTINGS = {
  reminderTime: "20:00", // 24h HH:MM, local time
  gmailSyncEnabled: true,
  syncIntervalMinutes: 180,
  keywords: [
    "greenhouse.io",
    "lever.co",
    "myworkdayjobs.com",
    "icims.com",
    "smartrecruiters.com",
    "ashbyhq.com",
    "jobvite.com",
    "taleo.net"
  ],
  processedMessageIds: [],
  applications: [],
  lastSyncTimestamp: null
};

// ---------- Setup on install ----------
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(null);
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set(merged);
  scheduleDailyReminder(merged.reminderTime);
  scheduleGmailSync(merged.syncIntervalMinutes);
});

chrome.runtime.onStartup.addListener(async () => {
  const { reminderTime, syncIntervalMinutes } = await chrome.storage.local.get([
    "reminderTime",
    "syncIntervalMinutes"
  ]);
  scheduleDailyReminder(reminderTime || DEFAULT_SETTINGS.reminderTime);
  scheduleGmailSync(syncIntervalMinutes || DEFAULT_SETTINGS.syncIntervalMinutes);
});

// ---------- Alarms ----------
function scheduleDailyReminder(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  chrome.alarms.create("dailyReminder", {
    when: next.getTime(),
    periodInMinutes: 1440
  });
}

function scheduleGmailSync(intervalMinutes) {
  chrome.alarms.create("gmailSync", {
    delayInMinutes: 1,
    periodInMinutes: Math.max(30, intervalMinutes || 180)
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReminder") sendDailyReminder();
  if (alarm.name === "gmailSync") syncGmail();
});

// ---------- Messages from popup/options ----------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SYNC_NOW") {
    syncGmail().then((count) => sendResponse({ ok: true, newCount: count }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // async response
  }
  if (msg.type === "UPDATE_REMINDER_TIME") {
    scheduleDailyReminder(msg.reminderTime);
    sendResponse({ ok: true });
  }
  if (msg.type === "UPDATE_SYNC_INTERVAL") {
    scheduleGmailSync(msg.syncIntervalMinutes);
    sendResponse({ ok: true });
  }
});

// ---------- Daily reminder ----------
function getCurrentWeekAndDay() {
  const start = new Date(START_DATE + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.min(Math.max(Math.floor(diffDays / 7), 0), STUDY_PLAN.length - 1);
  const dayOfWeek = now.getDay(); // 0-6
  return { week: STUDY_PLAN[weekIndex], dayOfWeek, diffDays };
}

function sendDailyReminder() {
  const { week, dayOfWeek, diffDays } = getCurrentWeekAndDay();
  if (diffDays < 0) return; // plan hasn't started yet

  const focus = DAILY_FOCUS_ROTATION[dayOfWeek];
  let title = `Interview Prep - Week ${week.week}: ${week.theme}`;
  let body;

  if (focus === "rest") {
    body = "Rest day. A light skim of your notes is optional - no new material.";
  } else if (focus === "mock") {
    body = "Mock interview / review day. Do one timed practice round or review weak spots.";
  } else {
    const list = week[focus] || [];
    body = list.length
      ? `Today's focus: ${focus.toUpperCase()} - ${list[0]}`
      : "Open the tracker to see today's tasks.";
  }

  chrome.notifications.create(`daily-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message: body,
    priority: 1
  });
}

// ---------- Gmail sync ----------
function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError || new Error("No auth token"));
      } else {
        resolve(token);
      }
    });
  });
}

function buildGmailQuery(keywords) {
  const domainClauses = keywords.map((k) => `from:${k}`).join(" OR ");
  const subjectClauses = [
    'subject:"applying"',
    'subject:"application"',
    'subject:"applied"',
    'subject:"thank you for your interest"'
  ].join(" OR ");
  return `newer_than:45d (${domainClauses} OR ${subjectClauses})`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function extractCompany(fromHeader, subject) {
  const domainMatch = fromHeader.match(/@([\w.-]+)/);
  const domain = domainMatch ? domainMatch[1].toLowerCase() : "";
  const atsDomains = [
    "greenhouse.io", "lever.co", "myworkdayjobs.com", "icims.com",
    "smartrecruiters.com", "ashbyhq.com", "jobvite.com", "taleo.net", "workday.com"
  ];
  const isAts = atsDomains.some((d) => domain.includes(d));

  if (!isAts && domain) {
    const base = domain.split(".")[0];
    if (base && !["noreply", "no-reply", "mail", "notifications"].includes(base)) {
      return capitalize(base);
    }
  }

  const patterns = [
    /application (?:to|at|with) ([A-Z][\w&.,' -]{2,40})/i,
    /thank you for applying to ([A-Z][\w&.,' -]{2,40})/i,
    /your application (?:to|for) ([A-Z][\w&.,' -]{2,40})/i,
    /interest in ([A-Z][\w&.,' -]{2,40})/i
  ];
  for (const p of patterns) {
    const m = subject.match(p);
    if (m) return m[1].trim().replace(/[.,]$/, "");
  }

  const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    const cleaned = nameMatch[1]
      .replace(/careers|recruiting|talent acquisition|hiring|no-?reply|jobs/gi, "")
      .trim();
    if (cleaned) return cleaned;
  }

  return "Unknown (please edit)";
}

async function syncGmail() {
  const settings = await chrome.storage.local.get([
    "gmailSyncEnabled",
    "keywords",
    "processedMessageIds",
    "applications"
  ]);
  if (settings.gmailSyncEnabled === false) return 0;

  let token;
  try {
    token = await getAuthToken(false); // silent; user must connect via popup first
  } catch (e) {
    console.log("Gmail not connected yet:", e);
    return 0;
  }

  const query = buildGmailQuery(settings.keywords || DEFAULT_SETTINGS.keywords);
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(query)}`;

  const listResp = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listResp.ok) {
    console.error("Gmail list error", await listResp.text());
    return 0;
  }
  const listData = await listResp.json();
  const messages = listData.messages || [];
  const processed = new Set(settings.processedMessageIds || []);
  const applications = settings.applications || [];
  let newCount = 0;

  for (const m of messages) {
    if (processed.has(m.id)) continue;

    const metaUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
    const metaResp = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!metaResp.ok) continue;
    const meta = await metaResp.json();
    const headers = (meta.payload && meta.payload.headers) || [];
    const from = (headers.find((h) => h.name === "From") || {}).value || "";
    const subject = (headers.find((h) => h.name === "Subject") || {}).value || "";
    const date = (headers.find((h) => h.name === "Date") || {}).value || new Date().toISOString();

    const company = extractCompany(from, subject);

    applications.push({
      id: `gmail-${m.id}`,
      company,
      position: "",
      dateApplied: new Date(date).toISOString().slice(0, 10),
      status: "Applied",
      source: "gmail-auto",
      confirmed: false,
      subject,
      notes: ""
    });

    processed.add(m.id);
    newCount++;
  }

  await chrome.storage.local.set({
    applications,
    processedMessageIds: Array.from(processed),
    lastSyncTimestamp: new Date().toISOString()
  });

  if (newCount > 0) {
    chrome.notifications.create(`sync-${Date.now()}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Interview Prep Tracker",
      message: `Found ${newCount} possible new application${newCount > 1 ? "s" : ""}. Review them in the Applications tab.`,
      priority: 1
    });
  }

  return newCount;
}
