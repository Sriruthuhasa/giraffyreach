// SQLite via Node's built-in module — no native compilation, runs anywhere on Node 22.5+/24.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "giraffyreach.db");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    pw_hash    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data    TEXT NOT NULL DEFAULT '{}',
    resume  TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pipeline (
    id       TEXT PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data     TEXT NOT NULL,
    updated  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_pipeline_user ON pipeline(user_id);

  CREATE TABLE IF NOT EXISTS alerts (
    id       TEXT PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);

  CREATE TABLE IF NOT EXISTS outreach_events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token     TEXT NOT NULL,
    label     TEXT,
    kind      TEXT NOT NULL,
    meta      TEXT,
    ts        TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_events_token ON outreach_events(token);
`);

module.exports = db;
