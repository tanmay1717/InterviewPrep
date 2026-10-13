// Password hashing (scrypt) and HS256 login tokens, using only node:crypto.
import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be set (32+ characters)");
  return s;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, "base64"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function signToken(userId) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const sig = crypto.createHmac("sha256", secret()).update(`${header}.${payload}`).digest("base64url");
  return { token: `${header}.${payload}.${sig}`, expiresIn: TOKEN_TTL_SECONDS };
}

export function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = crypto.createHmac("sha256", secret()).update(`${header}.${payload}`).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!claims.sub || !claims.exp || claims.exp < Date.now() / 1000) return null;
    return claims.sub;
  } catch {
    return null;
  }
}

// Returns the signed-in user's id, or sends a 401 and returns null.
export function requireUser(req, res) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  const userId = m && verifyToken(m[1]);
  if (!userId) {
    res.status(401).json({ error: "Not signed in or session expired" });
    return null;
  }
  return userId;
}
