const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT data FROM pipeline WHERE user_id = ? ORDER BY updated DESC").all(req.user.uid);
  res.json({ pipeline: rows.map((r) => JSON.parse(r.data)) });
});

// Replace the whole pipeline (simplest reliable sync from the client).
router.put("/", (req, res) => {
  const items = Array.isArray(req.body.pipeline) ? req.body.pipeline : [];
  const del = db.prepare("DELETE FROM pipeline WHERE user_id = ?");
  const ins = db.prepare("INSERT INTO pipeline (id, user_id, data) VALUES (?, ?, ?)");
  db.exec("BEGIN");
  try {
    del.run(req.user.uid);
    items.forEach((it) => ins.run(String(it.id || Date.now() + "" + Math.random()), req.user.uid, JSON.stringify(it)));
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); return res.status(500).json({ error: e.message }); }
  res.json({ ok: true, count: items.length });
});

module.exports = router;
