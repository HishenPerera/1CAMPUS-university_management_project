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

        // Attendance system tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_sessions (
                id SERIAL PRIMARY KEY,
                module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                lecturer_id INTEGER NOT NULL,
                title TEXT NOT NULL DEFAULT 'Attendance',
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                week_label TEXT NOT NULL,
                is_open BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Safely add title column if migrating from old schema (no-op if already exists)
        await pool.query(`
            ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Attendance'
        `);

        // Drop old unique constraint if it exists (allows multiple sessions per week)
        await pool.query(`
            DO $$ BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'attendance_sessions'::regclass
                    AND contype = 'u'
                ) THEN
                    ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_module_id_year_month_week_label_key;
                END IF;
            END $$;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_records (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL,
                marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(session_id, student_id)
            )
        `);

        console.log("DB: attendance_sessions and attendance_records tables verified.");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                lecturer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("DB: notices table verified.");
    } catch (err) {
        console.error("DB Init Error:", err);
    }
};

initDb();

module.exports = pool;