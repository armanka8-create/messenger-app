const SQLite = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new SQLite(path.join(__dirname, 'messenger.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    last_seen INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    read INTEGER DEFAULT 0,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(from_user_id, to_user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
`);

class Database {
  static createUser(username, password, displayName) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)');
    try {
      const result = stmt.run(username, passwordHash, displayName);
      return { id: result.lastInsertRowid, username, display_name: displayName };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Username already exists');
      }
      throw err;
    }
  }

  static getUserByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static getUserById(id) {
    const stmt = db.prepare('SELECT id, username, display_name, status, last_seen FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  static updateUserStatus(userId, status) {
    const stmt = db.prepare('UPDATE users SET status = ?, last_seen = ? WHERE id = ?');
    stmt.run(status, Date.now(), userId);
  }

  static getAllUsers(excludeUserId) {
    const stmt = db.prepare('SELECT id, username, display_name, status, last_seen FROM users WHERE id != ?');
    return stmt.all(excludeUserId);
  }

  static saveMessage(fromUserId, toUserId, content, type = 'text') {
    const stmt = db.prepare('INSERT INTO messages (from_user_id, to_user_id, content, type) VALUES (?, ?, ?, ?)');
    const result = stmt.run(fromUserId, toUserId, content, type);
    return {
      id: result.lastInsertRowid,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      content,
      type,
      timestamp: Math.floor(Date.now() / 1000),
      read: 0
    };
  }

  static getMessages(userId1, userId2, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(userId1, userId2, userId2, userId1, limit).reverse();
  }

  static markMessagesAsRead(fromUserId, toUserId) {
    const stmt = db.prepare('UPDATE messages SET read = 1 WHERE from_user_id = ? AND to_user_id = ? AND read = 0');
    stmt.run(fromUserId, toUserId);
  }

  static getUnreadCount(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE to_user_id = ? AND read = 0');
    return stmt.get(userId).count;
  }
}

module.exports = Database;
