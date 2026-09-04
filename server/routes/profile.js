const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const row = db.prepare("SELECT data, resume FROM profiles WHERE user_id = ?").get(req.user.uid);
  res.json({ me: JSON.parse((row && row.data) || "{}"), resume: (row && row.resume) || "" });
});

router.put("/", (req, res) => {
  const me = JSON.stringify(req.body.me || {});
  const resume = String(req.body.resume || "");
  db.prepare("INSERT INTO profiles (user_id, data, resume) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, resume=excluded.resume")
    .run(req.user.uid, me, resume);
  res.json({ ok: true });
});

module.exports = router;
