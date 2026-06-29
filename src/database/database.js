const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS snipes (
      id SERIAL PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      deleted_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lol_profiles (
  user_id TEXT PRIMARY KEY,
  game_name TEXT NOT NULL,
  tag_line TEXT NOT NULL,
  region TEXT NOT NULL
);

    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      language TEXT DEFAULT 'es',
      log_channel TEXT,
      prefix TEXT DEFAULT '#'
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ships (
      id SERIAL PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      percentage INTEGER NOT NULL,
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS translations (
      id SERIAL PRIMARY KEY,
      original TEXT NOT NULL,
      translated TEXT NOT NULL,
      target_lang TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS command_usage (
      command_name TEXT PRIMARY KEY,
      uses INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at BIGINT NOT NULL,
      done INTEGER DEFAULT 0
    );
  `);

  console.log('Base de datos inicializada correctamente.');
}

module.exports = { pool, init };