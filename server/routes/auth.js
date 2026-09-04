const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { sign, requireAuth } = require("../lib/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8)
    return res.status(400).json({ error: "email and password (min 8 chars) required" });
  try {
    const ex = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (ex.rows.length) return res.status(409).json({ error: "email already registered" });
    const hash = bcrypt.hashSync(password, 10);
    const ins = await pool.query(
      "INSERT INTO users (email, pw_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hash]
    );
    const user = { id: ins.rows[0].id, email: ins.rows[0].email };
    await pool.query("INSERT INTO profiles (user_id, data, resume) VALUES ($1, '{}', '')", [user.id]);
    res.json({ token: sign(user), user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const r = await pool.query("SELECT * FROM users WHERE email = $1", [(email || "").toLowerCase()]);
    const row = r.rows[0];
    if (!row || !bcrypt.compareSync(password || "", row.pw_hash))
      return res.status(401).json({ error: "invalid credentials" });
    res.json({ token: sign(row), user: { id: row.id, email: row.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/me", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT id, email, created_at FROM users WHERE id = $1", [req.user.uid]);
  res.json({ user: r.rows[0] });
});

module.exports = router;
