function showStatus(msg) {
  const el = document.getElementById("status-msg");
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 3000);
}

async function load() {
  const data = await chrome.storage.local.get([
    "reminderTime", "gmailSyncEnabled", "syncIntervalMinutes", "keywords"
  ]);
  document.getElementById("reminder-time").value = data.reminderTime || "20:00";
  document.getElementById("gmail-enabled").checked = data.gmailSyncEnabled !== false;
  document.getElementById("sync-interval").value = String(data.syncIntervalMinutes || 180);
  document.getElementById("keywords").value = (data.keywords || [
    "greenhouse.io", "lever.co", "myworkdayjobs.com", "icims.com",
    "smartrecruiters.com", "ashbyhq.com", "jobvite.com", "taleo.net"
  ]).join(", ");
}

document.getElementById("save-reminder").addEventListener("click", async () => {
  const reminderTime = document.getElementById("reminder-time").value || "20:00";
  await chrome.storage.local.set({ reminderTime });
  chrome.runtime.sendMessage({ type: "UPDATE_REMINDER_TIME", reminderTime });
  showStatus("Reminder time saved.");
});

document.getElementById("save-gmail").addEventListener("click", async () => {
  const gmailSyncEnabled = document.getElementById("gmail-enabled").checked;
  const syncIntervalMinutes = Number(document.getElementById("sync-interval").value);
  const keywords = document.getElementById("keywords").value
    .split(",").map((s) => s.trim()).filter(Boolean);
  await chrome.storage.local.set({ gmailSyncEnabled, syncIntervalMinutes, keywords });
  chrome.runtime.sendMessage({ type: "UPDATE_SYNC_INTERVAL", syncIntervalMinutes });
  showStatus("Gmail settings saved.");
});

document.getElementById("connect-gmail").addEventListener("click", () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      showStatus("Couldn't connect to Gmail. Please try again.");
      return;
    }
    showStatus("Gmail connected.");
  });
});

document.getElementById("sync-now").addEventListener("click", () => {
  showStatus("Syncing...");
  chrome.runtime.sendMessage({ type: "SYNC_NOW" }, (resp) => {
    if (resp && resp.ok) showStatus(`Sync complete - ${resp.newCount} new item(s).`);
    else showStatus("Sync failed - connect Gmail first.");
  });
});

document.getElementById("clear-data").addEventListener("click", async () => {
  if (!confirm("This will permanently delete all tracked applications and study plan progress. Continue?")) return;
  await chrome.storage.local.clear();
  showStatus("All data cleared.");
  // Gmail detection only shows once a Google client ID is configured for this extension.
const oauth = chrome.runtime.getManifest().oauth2;
document.getElementById("gmail-card").hidden = !(oauth && oauth.client_id && !oauth.client_id.includes("PASTE_YOUR"));

load();
});

load();
