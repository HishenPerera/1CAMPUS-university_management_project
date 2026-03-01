/**
 * seedUsers.js — Run with: node seedUsers.js
 * Inserts 3 lecturer, 3 admin_staff, and 3 web_admin test users.
 */

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
});

const users = [
    // Lecturers
    { full_name: "Dr. Alice Johnson", email: "alice.johnson@1campus.edu", password: "Lect@1234", role: "lecturer" },
    { full_name: "Dr. Brian Smith", email: "brian.smith@1campus.edu", password: "Lect@5678", role: "lecturer" },
    { full_name: "Dr. Clara Williams", email: "clara.williams@1campus.edu", password: "Lect@9012", role: "lecturer" },

    // Admin Staff (stdadmin)
    { full_name: "Mark Davis", email: "mark.davis@1campus.edu", password: "Admin@1234", role: "admin_staff" },
    { full_name: "Nina Patel", email: "nina.patel@1campus.edu", password: "Admin@5678", role: "admin_staff" },
    { full_name: "Oscar Lee", email: "oscar.lee@1campus.edu", password: "Admin@9012", role: "admin_staff" },

    // Web Admins
    { full_name: "Sara Chen", email: "sara.chen@1campus.edu", password: "Web@12345", role: "web_admin" },
    { full_name: "Tom Rivera", email: "tom.rivera@1campus.edu", password: "Web@56789", role: "web_admin" },
    { full_name: "Uma Sharma", email: "uma.sharma@1campus.edu", password: "Web@90123", role: "web_admin" },
];

async function seed() {
    console.log("Seeding users...\n");
    for (const u of users) {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [u.email]);
        if (existing.rows.length > 0) {
            console.log(`⚠️  Skipped (already exists): ${u.email}`);
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        await pool.query(
            "INSERT INTO users (full_name, email, password, role) VALUES ($1,$2,$3,$4)",
            [u.full_name, u.email, hashed, u.role]
        );
        console.log(`✅ Created [${u.role}] ${u.full_name} — ${u.email} / ${u.password}`);
    }
    console.log("\nDone.");
    await pool.end();
}

seed().catch((err) => {
    console.error("Seed error:", err.message);
    pool.end();
});
