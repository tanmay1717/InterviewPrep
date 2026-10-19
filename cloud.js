/**
 * Client for the Vercel API (api/*.js), which stores data in Neon.
 * Used by both the extension popup and the hosted website.
 * Session is kept in chrome.storage.local under "session" (localStorage on the website, via web/shim.js).
 */
const Cloud = (() => {
  const isConfigured = () => typeof API_BASE_URL === "string" && !API_BASE_URL.includes("YOUR-APP");

  class CloudError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  async function getSession() {
    const { session } = await chrome.storage.local.get("session");
    if (session && session.expires_at < Date.now()) {
      await chrome.storage.local.remove(["session", "profile"]);
      return null;
    }
    return session || null;
  }

  async function saveSession(data) {
    const session = {
      access_token: data.token,
      expires_at: Date.now() + data.expiresIn * 1000,
      user: data.user
    };
    await chrome.storage.local.set({ session, profile: data.profile });
    return session;
  }

  async function call(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const session = await getSession();
      if (!session) throw new CloudError("Not signed in", 401);
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    let res;
    try {
      res = await fetch(API_BASE_URL + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch {
      throw new CloudError("Can't reach the server - check your connection", 0);
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (res.status === 401 && auth) await chrome.storage.local.remove(["session", "profile"]);
    if (!res.ok) throw new CloudError((data && data.error) || `Server error (${res.status})`, res.status);
    return data;
  }

  // ---------- Auth ----------
  async function signUp(email, password, username) {
    username = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw new CloudError("Username must be 3-20 chars: lowercase letters, numbers, underscore");
    }
    const data = await call("/api/auth", { method: "POST", auth: false, body: { action: "signup", email, password, username } });
    await saveSession(data);
    return { needsConfirmation: false };
  }

  // login can be an email or a username.
  async function signIn(login, password) {
    return saveSession(await call("/api/auth", { method: "POST", auth: false, body: { action: "signin", login, password } }));
  }

  // Keeps "syncedUserId" on purpose: if someone else signs in next on this device,
  // syncOnOpen sees a different account and replaces local progress instead of merging it.
  async function signOut() {
    await chrome.storage.local.remove(["session", "profile", "lastSyncedAt"]);
  }

  async function getMyProfile() {
    const profile = await call("/api/me");
    await chrome.storage.local.set({ profile });
    return profile;
  }

  // ---------- Progress ----------
  const pullProgress = () => call("/api/progress");
  const pushProgress = (data, updatedAt) =>
    call("/api/progress", { method: "PUT", body: { data, updated_at: updatedAt } });
  const friendsProgress = () => call("/api/progress?friends=1");

  // ---------- Applications (private: only ever your own) ----------
  const pullApplications = () => call("/api/applications");
  const pushApplications = (applications, updatedAt) =>
    call("/api/applications", { method: "PUT", body: { applications, updated_at: updatedAt } });

  // ---------- Friends ----------
  const listFriendships = () => call("/api/friends");
  const sendFriendRequest = (username) => call("/api/friends", { method: "POST", body: { username } });
  const acceptFriend = (id) => call("/api/friends", { method: "PATCH", body: { id: Number(id) } });
  const removeFriendship = (id) => call(`/api/friends?id=${encodeURIComponent(id)}`, { method: "DELETE" });

  return {
    isConfigured, getSession, signUp, signIn, signOut, getMyProfile,
    pullProgress, pushProgress, friendsProgress, pullApplications, pushApplications,
    listFriendships, sendFriendRequest, acceptFriend, removeFriendship
  };
})();
