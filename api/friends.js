// GET    /api/friends                -> friendships you're part of, with both profiles
// POST   /api/friends { username }   -> send a request
// PATCH  /api/friends { id }         -> accept a request sent to you
// DELETE /api/friends?id=N           -> decline / cancel / unfriend
import { q } from "../lib/db.js";
import { requireUser } from "../lib/auth.js";
import { body, methodNotAllowed, route } from "../lib/http.js";

export default route(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const rows = await q(
      `select f.id, f.status, f.created_at, f.requester, f.addressee,
              json_build_object('id', r.id, 'username', r.username, 'display_name', r.username) as requester_profile,
              json_build_object('id', a.id, 'username', a.username, 'display_name', a.username) as addressee_profile
         from friendships f
         join users r on r.id = f.requester
         join users a on a.id = f.addressee
        where $1::uuid in (f.requester, f.addressee)
        order by f.created_at desc`,
      [userId]
    );
    return res.json(rows);
  }

  if (req.method === "POST") {
    const name = String(body(req).username || "").trim().toLowerCase().replace(/^@/, "");
    const found = await q("select id from users where username = $1", [name]);
    if (!found.length) return res.status(404).json({ error: `No user named @${name}` });
    if (found[0].id === userId) return res.status(400).json({ error: "That's you!" });
    const rows = await q(
      `insert into friendships (requester, addressee) values ($1, $2)
       on conflict do nothing returning id`,
      [userId, found[0].id]
    );
    if (!rows.length) return res.status(409).json({ error: `You and @${name} already have a request or friendship` });
    return res.status(201).json({ id: rows[0].id });
  }

  if (req.method === "PATCH") {
    const id = Number(body(req).id);
    const rows = await q(
      `update friendships set status = 'accepted'
        where id = $1 and addressee = $2 and status = 'pending' returning id`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: "Request not found" });
    return res.status(204).end();
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    await q("delete from friendships where id = $1 and $2::uuid in (requester, addressee)", [id, userId]);
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["GET", "POST", "PATCH", "DELETE"]);
});
