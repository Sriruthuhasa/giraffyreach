// PUBLIC tracking endpoints hit by recruiters' mail clients / browsers. No auth.
const express = require("express");
const db = require("../db");

const router = express.Router();

// 1x1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

function userForToken(token) {
  const row = db.prepare("SELECT user_id, label FROM outreach_events WHERE token = ? LIMIT 1").get(token);
  return row || null;
}

// Open pixel.
router.get("/o/:token.gif", (req, res) => {
  const t = req.params.token;
  const owner = userForToken(t);
  if (owner) db.prepare("INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES (?, ?, ?, 'open', ?)")
    .run(owner.user_id, t, owner.label, req.get("user-agent") || "");
  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.send(PIXEL);
});

// Click redirect.
router.get("/c/:token", (req, res) => {
  const t = req.params.token;
  const u = req.query.u ? decodeURIComponent(req.query.u) : null;
  const owner = userForToken(t);
  if (owner) db.prepare("INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES (?, ?, ?, 'click', ?)")
    .run(owner.user_id, t, owner.label, u || "");
  if (u && /^https?:\/\//i.test(u)) return res.redirect(u);
  res.status(204).end();
});

module.exports = router;
