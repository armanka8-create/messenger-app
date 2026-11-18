const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Use Railway's DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database schema
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT DEFAULT 'offline',
        last_seen BIGINT,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        read INTEGER DEFAULT 0,
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
    `);
    console.log('✅ Database initialized');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    return false;
  }
}

// Export init function so server can await it
module.exports.initDatabase = initDatabase;

class Database {
  // User operations
  async createUser(username, password, displayName) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *',
      [username, passwordHash, displayName]
    );
    return result.rows[0];
  }

  async getUserByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  async getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getAllUsers() {
    const result = await pool.query('SELECT id, username, display_name, status, last_seen FROM users');
    return result.rows;
  }

  async updateUserStatus(userId, status) {
    await pool.query(
      'UPDATE users SET status = $1, last_seen = $2 WHERE id = $3',
      [status, Date.now(), userId]
    );
  }

  async verifyPassword(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const valid = await bcrypt.compare(password, user.password_hash);
    return valid ? user : null;
  }

  // Message operations
  async createMessage(fromUserId, toUserId, content, type = 'text') {
    const result = await pool.query(
      'INSERT INTO messages (from_user_id, to_user_id, content, type, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fromUserId, toUserId, content, type, Date.now()]
    );
    return result.rows[0];
  }

  async getMessages(userId1, userId2) {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (from_user_id = $1 AND to_user_id = $2) 
          OR (from_user_id = $2 AND to_user_id = $1)
       ORDER BY timestamp ASC`,
      [userId1, userId2]
    );
    return result.rows;
  }

  async markMessagesAsRead(fromUserId, toUserId) {
    await pool.query(
      'UPDATE messages SET read = 1 WHERE from_user_id = $1 AND to_user_id = $2 AND read = 0',
      [fromUserId, toUserId]
    );
  }

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE to_user_id = $1 AND read = 0',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new Database();
