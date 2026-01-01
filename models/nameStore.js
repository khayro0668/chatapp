const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'chat.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS names (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      joined_at INTEGER
    )`
  );
});

const recordName = (name) =>
  new Promise((resolve) => {
    db.run('INSERT OR IGNORE INTO names (name, joined_at) VALUES (?, ?)', [name, Date.now()], () => {
      resolve();
    });
  });

module.exports = {
  recordName,
  db,
};
