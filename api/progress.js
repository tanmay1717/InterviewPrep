// GET /api/progress            -> { data, updated_at } | null   (your own)
// GET /api/progress?friends=1  -> [{ user_id, data, updated_at }]  (accepted friends only; only their shared resources)
// PUT /api/progress { data, updated_at }
import { q } from "../lib/db.js";
import { requireUser } from "../lib/auth.js";
import { body, methodNotAllowed, route } from "../lib/http.js";

const MAX_BYTES = 256 * 1024;

export default route(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    if (req.query.friends) {
      const rows = await q(
        `select p.user_id, p.data, p.updated_at
           from progress p
           join friendships f on f.status = 'accepted'
            and ((f.requester = $1 and f.addressee = p.user_id)
              or (f.addressee = $1 and f.requester = p.user_id))`,
        [userId]
      );
      // Friends only receive resources their owner chose to share.
      for (const row of rows) {
        if (row.data && Array.isArray(row.data.customResources)) {
          row.data.customResources = row.data.customResources.filter((r) => r && r.shared === true);
        }
      }
      return res.json(rows);
    }
    const rows = await q("select data, updated_at from progress where user_id = $1", [userId]);
    return res.json(rows[0] || null);
  }

  if (req.method === "PUT") {
    const { data, updated_at } = body(req);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ error: "data must be an object" });
    }
    const json = JSON.stringify(data);
    if (json.length > MAX_BYTES) return res.status(413).json({ error: "Progress data too large" });
    const ts = Date.parse(updated_at);
    await q(
      `insert into progress (user_id, data, updated_at) values ($1, $2::jsonb, $3)
       on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at`,
      [userId, json, new Date(Number.isNaN(ts) ? Date.now() : ts).toISOString()]
    );
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["GET", "PUT"]);
});
