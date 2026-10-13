// Lets the extension popup code run as a normal website: provides the few chrome.* APIs
// it uses, backed by localStorage. Loaded before every other script on the hosted site.
(function () {
  if (window.chrome && window.chrome.storage && window.chrome.storage.local) return;

  const KEY = "interview-prep-tracker";
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const save = (obj) => {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* private mode / storage blocked */ }
  };

  const local = {
    async get(keys) {
      const all = load();
      if (keys == null) return all;
      const out = {};
      if (typeof keys === "object" && !Array.isArray(keys)) Object.assign(out, keys); // defaults form
      const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      list.forEach((k) => { if (k in all) out[k] = all[k]; });
      return out;
    },
    async set(obj) { save({ ...load(), ...obj }); },
    async remove(keys) {
      const all = load();
      [].concat(keys).forEach((k) => delete all[k]);
      save(all);
    },
    async clear() { save({}); }
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
