const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        discord_id TEXT PRIMARY KEY,
        riot_name TEXT,
        riot_tag TEXT
    )
`);

module.exports = db;