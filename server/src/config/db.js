const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                sender_id INT REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Safely add reply_to_id if it doesn't exist
        await pool.query(`
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS reply_to_id INT REFERENCES chat_messages(id) ON DELETE SET NULL;
        `);

        // Safely add is_deleted if it doesn't exist
        await pool.query(`
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
        `);

        // Safely add is_edited if it doesn't exist
        await pool.query(`
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
        `);

        console.log("DB: chat_messages table verified, including replies and edit support.");
    } catch (err) {
        console.error("DB Init Error:", err);
    }
};

initDb();

module.exports = pool;