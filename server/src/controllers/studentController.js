const pool = require("../config/db");
const Groq = require("groq-sdk");

// GET /api/student/profile — fetch own profile from students table
const getMyProfile = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Retrieve email from users table since JWT only has id
        const userResult = await pool.query(
            "SELECT email, full_name, profile_image FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });

        const email = userResult.rows[0].email;
        const profileImagePath = userResult.rows[0].profile_image;

        const studentResult = await pool.query(
            `SELECT s.*, s.first_name || ' ' || s.last_name AS full_name
       FROM students s
       WHERE s.email = $1`,
            [email]
        );

        if (!studentResult.rows[0]) {
            // No student record yet — return basic info only
            return res.json({
                email,
                full_name: userResult.rows[0].full_name,
                profile_image: profileImagePath || null,
                hasProfile: false,
            });
        }

        res.json({
            ...studentResult.rows[0],
            profile_image: profileImagePath || null,
            hasProfile: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/student/profile — update own editable fields only
const updateMyProfile = async (req, res) => {
    try {
        const { phone_number, address } = req.body;

        // Get email from DB
        const userResult = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
        const email = userResult.rows[0].email;

        const result = await pool.query(
            `UPDATE students
       SET phone_number = COALESCE($1, phone_number),
           address      = COALESCE($2, address)
       WHERE email = $3
       RETURNING *`,
            [phone_number || null, address || null, email]
        );

        if (!result.rows[0]) return res.status(404).json({ message: "Student profile not found" });

        res.json({ message: "Profile updated", student: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/student/modules — fetch modules matching the student's degree, year, and semester
const getMyModules = async (req, res) => {
    try {
        // Get email from JWT user id
        const userResult = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
        const email = userResult.rows[0].email;

        // Fetch student's enrollment info
        const studentResult = await pool.query(
            "SELECT degree_program, studying_year, semester FROM students WHERE email = $1",
            [email]
        );
        if (!studentResult.rows[0]) {
            return res.status(404).json({ message: "Student record not found" });
        }

        const { degree_program, studying_year, semester } = studentResult.rows[0];

        // Fetch matching modules with assigned lecturers
        const modulesResult = await pool.query(
            `SELECT m.*,
                COALESCE(
                    json_agg(
                        json_build_object('id', u.id, 'name', u.full_name)
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'
                ) AS assigned_lecturers
            FROM modules m
            LEFT JOIN lecturer_modules lm ON m.id = lm.module_id
            LEFT JOIN users u ON lm.lecturer_id = u.id
            WHERE m.degree_program = $1
              AND m.studying_year  = $2
              AND m.semester       = $3
            GROUP BY m.id
            ORDER BY m.module_code`,
            [degree_program, studying_year, semester]
        );

        res.json({
            degree_program,
            studying_year,
            semester,
            modules: modulesResult.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/student/ai-advisor — AI academic advisor chatbot
const aiAdvisor = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message) return res.status(400).json({ message: "Message is required" });

        // Get student email
        const userResult = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
        const email = userResult.rows[0].email;

        // Get student profile
        const studentResult = await pool.query(
            `SELECT s.first_name, s.last_name, s.degree_program, s.studying_year, s.semester
             FROM students s WHERE s.email = $1`,
            [email]
        );
        if (!studentResult.rows[0]) return res.status(404).json({ message: "Student record not found" });
        const st = studentResult.rows[0];

        // Get student's current modules
        const modulesResult = await pool.query(
            `SELECT m.module_code, m.module_name,
                COALESCE(
                    string_agg(u.full_name, ', ') FILTER (WHERE u.id IS NOT NULL),
                    'TBA'
                ) AS lecturers
             FROM modules m
             LEFT JOIN lecturer_modules lm ON m.id = lm.module_id
             LEFT JOIN users u ON lm.lecturer_id = u.id
             WHERE m.degree_program = $1 AND m.studying_year = $2 AND m.semester = $3
             GROUP BY m.id`,
            [st.degree_program, st.studying_year, st.semester]
        );

        const moduleList = modulesResult.rows.length > 0
            ? modulesResult.rows.map(m => `  - ${m.module_code}: ${m.module_name} (Lecturer: ${m.lecturers})`).join("\n")
            : "  - No modules assigned yet";

        const systemPrompt = `You are an expert AI Academic Advisor for 1CAMPUS University. 
You are speaking with a student whose profile is:
- Name: ${st.first_name} ${st.last_name}
- Degree Program: ${st.degree_program}
- Current Year: Year ${st.studying_year}
- Current Semester: Semester ${st.semester}
- Enrolled Modules this semester:
${moduleList}

Your role is to:
1. Provide personalised academic guidance tailored to their degree and year.
2. Give study tips for their specific modules and suggest learning resources.
3. Advise on career paths aligned with their degree program.
4. Help them plan their academics, manage workload, and stay motivated.
5. Answer any university-related questions helpfully and encouragingly.

Keep responses concise, friendly, and actionable. Use bullet points and clear formatting where helpful. Address the student by their first name.`;

        // Build messages for Groq (OpenAI-compatible format)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({ role: h.role === "user" ? "user" : "assistant", content: h.content })),
            { role: "user", content: message },
        ];

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 1024,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
        res.json({ reply });
    } catch (err) {
        console.error("AI Advisor error:", err?.message || err);
        res.status(500).json({
            message: `AI service error: ${err?.message || "Unknown error"}`,
        });
    }
};

module.exports = { getMyProfile, updateMyProfile, getMyModules, aiAdvisor };
