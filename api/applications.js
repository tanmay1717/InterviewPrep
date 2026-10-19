// GET /api/applications  -> { data: { applications: [...] }, updated_at } | null   (your own only)
// PUT /api/applications { applications: [...], updated_at }
// Private to the signed-in user: there is deliberately no way to read anyone else's.
import { q } from "../lib/db.js";
import { requireUser } from "../lib/auth.js";
import { body, methodNotAllowed, route } from "../lib/http.js";

const MAX_BYTES = 512 * 1024;
const MAX_ITEMS = 2000;

export default route(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const rows = await q("select data, updated_at from applications where user_id = $1", [userId]);
    return res.json(rows[0] || null);
  }

  if (req.method === "PUT") {
    const { applications, updated_at } = body(req);
    if (!Array.isArray(applications) || applications.some((a) => !a || typeof a !== "object" || Array.isArray(a))) {
      return res.status(400).json({ error: "applications must be a list of objects" });
    }
    if (applications.length > MAX_ITEMS) return res.status(413).json({ error: "Too many applications" });
    const json = JSON.stringify({ applications });
    if (json.length > MAX_BYTES) return res.status(413).json({ error: "Applications data too large" });
    const ts = Date.parse(updated_at);
    await q(
      `insert into applications (user_id, data, updated_at) values ($1, $2::jsonb, $3)
       on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at`,
      [userId, json, new Date(Number.isNaN(ts) ? Date.now() : ts).toISOString()]
    );
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["GET", "PUT"]);
});
