const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT data FROM alerts WHERE user_id = ?").all(req.user.uid);
  res.json({ alerts: rows.map((r) => JSON.parse(r.data)) });
});

router.put("/", (req, res) => {
  const items = Array.isArray(req.body.alerts) ? req.body.alerts : [];
  const del = db.prepare("DELETE FROM alerts WHERE user_id = ?");
  const ins = db.prepare("INSERT INTO alerts (id, user_id, data) VALUES (?, ?, ?)");
  db.exec("BEGIN");
  try {
    del.run(req.user.uid);
    items.forEach((a) => ins.run(String(a.id || Date.now() + "" + Math.random()), req.user.uid, JSON.stringify(a)));
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); return res.status(500).json({ error: e.message }); }
  res.json({ ok: true, count: items.length });
});

module.exports = router;
