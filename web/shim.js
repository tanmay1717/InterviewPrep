// Lets the extension popup code run as a normal website: provides the few chrome.* APIs
// it uses, backed by localStorage. Loaded before every other script on the hosted site.
//
// Storage is split per account so two people using the same browser never see each
// other's data: the login session lives in a shared "global" bucket, and everything
// else (progress, applications, added questions...) lives in a bucket for the
// signed-in user. Signing out simply switches back to the empty "guest" bucket.
(function () {
  if (window.chrome && window.chrome.storage && window.chrome.storage.local) return;

  const ROOT = "interview-prep-tracker";
  const GLOBAL_KEYS = new Set(["session"]);

  const read = (name) => {
    try { return JSON.parse(localStorage.getItem(`${ROOT}:${name}`)) || {}; } catch { return {}; }
  };
  const write = (name, obj) => {
    try { localStorage.setItem(`${ROOT}:${name}`, JSON.stringify(obj)); } catch { /* private mode / storage blocked */ }
  };
  const bucket = () => {
    const { session } = read("global");
    return session && session.user && session.user.id ? `user:${session.user.id}` : "guest";
  };

  // One-time move from the old single-blob format (before per-account storage).
  try {
    const legacy = localStorage.getItem(ROOT);
    if (legacy) {
      const old = JSON.parse(legacy) || {};
      const { session, ...rest } = old;
      if (session) write("global", { ...read("global"), session });
      write(session && session.user ? `user:${session.user.id}` : "guest", rest);
      localStorage.removeItem(ROOT);
    }
  } catch { /* ignore a corrupt legacy blob */ }

  const local = {
    async get(keys) {
      const all = { ...read(bucket()), ...read("global") };
      if (keys == null) return all;
      const out = {};
      if (typeof keys === "object" && !Array.isArray(keys)) Object.assign(out, keys); // defaults form
      const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      list.forEach((k) => { if (k in all) out[k] = all[k]; });
      return out;
    },
    async set(obj) {
      const globalPart = {};
      const userPart = {};
      for (const [k, v] of Object.entries(obj)) (GLOBAL_KEYS.has(k) ? globalPart : userPart)[k] = v;
      // Save the session first so the rest lands in the bucket of the user who just signed in.
      if (Object.keys(globalPart).length) write("global", { ...read("global"), ...globalPart });
      if (Object.keys(userPart).length) { const b = bucket(); write(b, { ...read(b), ...userPart }); }
    },
    async remove(keys) {
      const b = bucket();
      const g = read("global");
      const u = read(b);
      [].concat(keys).forEach((k) => { delete g[k]; delete u[k]; });
      write(b, u);
      write("global", g);
    },
    async clear() {
      write(bucket(), {});
      write("global", {});
    }
  };

  const shim = {
    storage: { local },
    runtime: { sendMessage(_msg, cb) { if (cb) cb({ ok: false, error: "Only available in the Chrome extension" }); } },
    identity: { getAuthToken(_opts, cb) { if (cb) cb(null); } }
  };
  try {
    Object.defineProperty(window, "chrome", { value: shim, configurable: true, writable: true });
  } catch {
    window.chrome = shim;
  }
  document.documentElement.classList.add("is-web");
})();
