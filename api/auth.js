// GET  /api/auth?username=x                         -> { available }
// POST /api/auth { action: "signup", email, password, username } -> { token, expiresIn, user, profile }
// POST /api/auth { action: "signin", email, password }           -> same
import { q } from "../lib/db.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { body, methodNotAllowed, route, USERNAME_RE, EMAIL_RE } from "../lib/http.js";

function session(user) {
  const { token, expiresIn } = signToken(user.id);
  return {
    token,
    expiresIn,
    user: { id: user.id, email: user.email },
    profile: { id: user.id, username: user.username, display_name: user.username }
  };
}

export default route(async (req, res) => {
  if (req.method === "GET") {
    const username = String(req.query.username || "").toLowerCase();
    if (!USERNAME_RE.test(username)) return res.json({ available: false });
    const rows = await q("select 1 from users where username = $1", [username]);
    return res.json({ available: rows.length === 0 });
  }
  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  const { action, password } = body(req);
  const email = String(body(req).email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Enter a valid email and password" });
  }

  if (action === "signup") {
    const username = String(body(req).username || "").trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: "Username must be 3-20 chars: lowercase letters, numbers, underscore" });
    }
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const taken = await q("select email, username from users where email = $1 or username = $2", [email, username]);
    if (taken.some((u) => u.username === username)) return res.status(409).json({ error: "That username is taken" });
    if (taken.length) return res.status(409).json({ error: "An account with that email already exists - sign in instead" });
    const rows = await q(
      `insert into users (email, username, password_hash) values ($1, $2, $3)
       on conflict do nothing returning id, email, username`,
      [email, username, hashPassword(password)]
    );
    if (!rows.length) return res.status(409).json({ error: "Email or username already in use" });
    return res.status(201).json(session(rows[0]));
  }

  if (action === "signin") {
    const rows = await q("select id, email, username, password_hash from users where email = $1", [email]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      return res.status(401).json({ error: "Wrong email or password" });
    }
    return res.json(session(rows[0]));
  }

  return res.status(400).json({ error: "Unknown action" });
});
