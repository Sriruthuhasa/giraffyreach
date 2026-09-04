const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sign, requireAuth } = require("../lib/auth");

const router = express.Router();

router.post("/register", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8)
    return res.status(400).json({ error: "email and password (min 8 chars) required" });
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: "email already registered" });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare("INSERT INTO users (email, pw_hash) VALUES (?, ?)").run(email.toLowerCase(), hash);
  const user = { id: info.lastInsertRowid, email: email.toLowerCase() };
  db.prepare("INSERT INTO profiles (user_id, data, resume) VALUES (?, '{}', '')").run(user.id);
  res.json({ token: sign(user), user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get((email || "").toLowerCase());
  if (!row || !bcrypt.compareSync(password || "", row.pw_hash))
    return res.status(401).json({ error: "invalid credentials" });
  res.json({ token: sign(row), user: { id: row.id, email: row.email } });
});

router.get("/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(req.user.uid);
  res.json({ user: row });
});

module.exports = router;
