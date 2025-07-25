const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('pn�ޥ1%:', err.message);
    } else {
        console.log(' pn�ޥ�');
        initTables();
    }
});

function initTables() {
    // �;��oh
    db.run(`
        CREATE TABLE IF NOT EXISTS streamers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            avatar TEXT,
            background TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // �~h
    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // �L�h
    db.run(`
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            difficulty INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // �L�~sTh
    db.run(`
        CREATE TABLE IF NOT EXISTS song_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            song_id INTEGER,
            tag_id INTEGER,
            FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
            UNIQUE(song_id, tag_id)
        )
    `);

    console.log(' pn�h��');
}

module.exports = db;