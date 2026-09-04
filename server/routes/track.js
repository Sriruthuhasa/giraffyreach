// PUBLIC tracking endpoints hit by recruiters' mail clients / browsers. No auth.
const express = require("express");
const { pool } = require("../db");

const router = express.Router();
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

async function userForToken(token) {
  const r = await pool.query("SELECT user_id, label FROM outreach_events WHERE token = $1 LIMIT 1", [token]);
  return r.rows[0] || null;
}

router.get("/o/:token.gif", async (req, res) => {
  try {
    const t = req.params.token;
    const owner = await userForToken(t);
    if (owner) await pool.query(
      "INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES ($1, $2, $3, 'open', $4)",
      [owner.user_id, t, owner.label, req.get("user-agent") || ""]
    );
  } catch (e) { /* never fail the pixel */ }
  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.send(PIXEL);
});

router.get("/c/:token", async (req, res) => {
  const t = req.params.token;
  const u = req.query.u ? decodeURIComponent(req.query.u) : null;
  try {
    const owner = await userForToken(t);
    if (owner) await pool.query(
      "INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES ($1, $2, $3, 'click', $4)",
      [owner.user_id, t, owner.label, u || ""]
    );
  } catch (e) { /* ignore */ }
  if (u && /^https?:\/\//i.test(u)) return res.redirect(u);
  res.status(204).end();
});

module.exports = router;
