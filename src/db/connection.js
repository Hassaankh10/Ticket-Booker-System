const path = require("path");
const Database = require("better-sqlite3");
const config = require("../utils/config");

const dbPath =
  config.db.sqlitePath ||
  path.resolve(__dirname, "..", "..", "ticket_booking_system.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = db;
