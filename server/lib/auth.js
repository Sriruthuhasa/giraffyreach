// JWT helpers + auth middleware.
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

function sign(user) {
  return jwt.sign({ uid: user.id, email: user.email }, SECRET, { expiresIn: "30d" });
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

module.exports = { sign, requireAuth, SECRET };
