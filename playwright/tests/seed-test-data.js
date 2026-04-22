require("dotenv").config({ path: 'server/.env' });
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

async function seed() {
    console.log("Seeding test data...");
    
    const users = [
        { name: "Mhsp Student", email: "it260001@1campus.edu", password: "Mhsp@123", role: "student" },
        { name: "Charuka Admin", email: "charuka.h@1campus.edu", password: "Charuka@123", role: "admin_staff" },
        { name: "Mohiru Lecturer", email: "mohiru.t@1campus.edu", password: "Mohiru@123", role: "lecturer" }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await pool.query(
            "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password = $3, full_name = $1, role = $4",
            [u.name, u.email, hashedPassword, u.role]
        );
        console.log(`User seeded/updated: ${u.email}`);
    }

    // Ensure Student Profile exists
    await pool.query(
        `INSERT INTO students (registration_number, first_name, last_name, email, degree_program, studying_year, semester, intake)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET registration_number = $1, first_name = $2, last_name = $3, degree_program = $5, studying_year = $6, semester = $7, intake = $8`,
        ["IT260001", "Mhsp", "Student", "it260001@1campus.edu", "Computer Science", 1, 1, "Jan-Jun"]
    );

    console.log("Test data seeded successfully.");
    await pool.end();
}

seed().catch(err => {
    console.error("Seed error:", err);
    pool.end();
});
