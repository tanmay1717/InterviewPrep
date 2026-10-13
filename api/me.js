// GET /api/me -> { id, username, display_name, email }
import { q } from "../lib/db.js";
import { requireUser } from "../lib/auth.js";
import { methodNotAllowed, route } from "../lib/http.js";

export default route(async (req, res) => {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const userId = requireUser(req, res);
  if (!userId) return;
  const rows = await q("select id, username, username as display_name, email from users where id = $1", [userId]);
  if (!rows.length) return res.status(401).json({ error: "Account no longer exists" });
  return res.json(rows[0]);
});
