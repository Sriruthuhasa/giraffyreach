// Outreach tracking: create tokens, read open/click events (authenticated).
const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

// Create a tracking token for one outreach (e.g. a recruiter email).
router.post("/track", (req, res) => {
  const token = crypto.randomBytes(9).toString("hex");
  const label = String((req.body && req.body.label) || "");
  // Register with a placeholder 'created' row so it belongs to this user.
  db.prepare("INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES (?, ?, ?, 'created', '')")
    .run(req.user.uid, token, label);
  const base = process.env.PUBLIC_URL || (req.protocol + "://" + req.get("host"));
  res.json({
    token,
    pixel: `${base}/track/o/${token}.gif`,
    clickBase: `${base}/track/c/${token}?u=`, // append encodeURIComponent(targetUrl)
  });
});

// Read this user's outreach events.
router.get("/events", (req, res) => {
  const rows = db.prepare(
    "SELECT token, label, kind, meta, ts FROM outreach_events WHERE user_id = ? ORDER BY ts DESC LIMIT 500"
  ).all(req.user.uid);
  res.json({ events: rows });
});

module.exports = router;
