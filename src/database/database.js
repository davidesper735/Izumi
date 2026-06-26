const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "../../izumi.db")
);

db.pragma("journal_mode = WAL");

db.exec(`
/* =========================
   SNIPES
========================= */
CREATE TABLE IF NOT EXISTS snipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    deleted_at INTEGER NOT NULL
);

/* =========================
   RECORDATORIOS
========================= */
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    message TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    done INTEGER DEFAULT 0
);

/* =========================
   CONFIGURACIÓN SERVIDOR
========================= */
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    language TEXT DEFAULT 'es',
    log_channel TEXT,
    prefix TEXT DEFAULT '#'
);

/* =========================
   ESTADÍSTICAS INTERACT
========================= */
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1
);

/* =========================
   SHIP
========================= */
CREATE TABLE IF NOT EXISTS ships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    percentage INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

/* =========================
   TRADUCCIONES CACHE
========================= */
CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original TEXT NOT NULL,
    translated TEXT NOT NULL,
    target_lang TEXT NOT NULL
);

/* =========================
   COMANDOS USADOS
========================= */
CREATE TABLE IF NOT EXISTS command_usage (
    command_name TEXT PRIMARY KEY,
    uses INTEGER DEFAULT 0
);
`);

// Migraciones — agregan columnas nuevas sin romper la DB existente
const migraciones = [
  `ALTER TABLE guild_settings ADD COLUMN prefix TEXT DEFAULT '#'`,
];

for (const sql of migraciones) {
  try {
    db.prepare(sql).run();
  } catch (e) {
    // Columna ya existe, ignorar
  }
}

console.log("Base de datos inicializada correctamente.");

module.exports = db;