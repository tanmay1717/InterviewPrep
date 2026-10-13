// Small helpers shared by the API routes.
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({ error: "Method not allowed" });
}

// Wraps a handler so unexpected errors become a JSON 500 instead of a crash page.
export function route(handler) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  };
}
