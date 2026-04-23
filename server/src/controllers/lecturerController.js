const pool = require("../config/db");


// GET /api/lecturer/modules
const getMyModules = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const result = await pool.query(`
            SELECT m.* 
            FROM modules m
            JOIN lecturer_modules lm ON m.id = lm.module_id
            WHERE lm.lecturer_id = $1
            ORDER BY m.semester, m.module_code
        `, [lecturerId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching lecturer modules:", err);
        res.status(500).json({ message: "Server error fetching your modules" });
    }
};

// GET /api/lecturer/modules/:id/materials
const getModuleMaterials = async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    try {
        const lecturerId = req.user.id;
        // Verify ownership
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [id, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to view this module's materials." });
        }

        let query = "SELECT * FROM module_materials WHERE module_id = $1 AND lecturer_id = $2";
        let params = [id, lecturerId];

        if (year) {
            query += " AND year = $3";
            params.push(year);
        }
        
        query += " ORDER BY month ASC, week_label ASC, created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching materials:", err);
        res.status(500).json({ message: "Server error fetching materials." });
    }
};

// POST /api/lecturer/modules/:id/materials
const uploadModuleMaterial = async (req, res) => {
    const { id } = req.params;
    const lecturerId = req.user.id;
    const { year, month, week_label, file_type, file_name, file_url } = req.body;
    
    try {
        // Verify ownership
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [id, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to upload materials to this module." });
        }

        // Determine actual file_url and file_name if uploaded
        let finalUrl = file_url;
        let finalName = file_name;

        if (req.file) {
            finalUrl = "/uploads/materials/" + req.file.filename;
            finalName = file_name || req.file.originalname;
        }

        if (!finalUrl || !finalName) {
            return res.status(400).json({ message: "File or link must be provided." });
        }

        const result = await pool.query(`
            INSERT INTO module_materials (module_id, lecturer_id, year, month, week_label, file_name, file_url, file_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [id, lecturerId, year, month, week_label, finalName, finalUrl, file_type]);

        res.status(201).json({ message: "Material uploaded successfully", material: result.rows[0] });
    } catch (err) {
        console.error("Error uploading material:", err);
        res.status(500).json({ message: "Failed to upload material." });
    }
};

// DELETE /api/lecturer/modules/materials/:material_id
const deleteModuleMaterial = async (req, res) => {
    const { material_id } = req.params;
    const lecturerId = req.user.id;
    
    try {
        const materialCheck = await pool.query(
            "SELECT * FROM module_materials WHERE id = $1 AND lecturer_id = $2", 
            [material_id, lecturerId]
        );

        if (materialCheck.rowCount === 0) {
            return res.status(404).json({ message: "Material not found or unauthorized." });
        }

        await pool.query("DELETE FROM module_materials WHERE id = $1", [material_id]);

        // If it's an uploaded file, we optionally could delete from disk `fs.unlinkSync`
        // but for simplicity/safety we just remove from DB right now.
        const fs = require('fs');
        const path = require('path');
        const mat = materialCheck.rows[0];
        if (mat.file_url.startsWith('/uploads/materials/')) {
            const filepath = path.join(__dirname, '../../', mat.file_url);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        res.json({ message: "Material deleted successfully." });
    } catch (err) {
        console.error("Error deleting material:", err);
        res.status(500).json({ message: "Failed to delete material." });
    }
};

// POST /api/lecturer/modules/:id/ai-assessment
const generateAIAssessment = async (req, res) => {
    const { id } = req.params;
    const lecturerId = req.user.id;
    const { topic, difficulty, type } = req.body;

    if (!topic || !difficulty || !type) {
        return res.status(400).json({ message: "Missing required fields (topic, difficulty, type)." });
    }

    try {
        // 1. Verify lecturer owns module and get module details
        const moduleQuery = await pool.query(`
            SELECT m.module_name, m.degree_program, m.studying_year, m.semester 
            FROM module_materials mm
            RIGHT JOIN modules m ON m.id = $1
            JOIN lecturer_modules lm ON m.id = lm.module_id
            WHERE lm.lecturer_id = $2 AND lm.module_id = $1
            LIMIT 1
        `, [id, lecturerId]);

        if (moduleQuery.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to generate content for this module." });
        }

        const mod = moduleQuery.rows[0];

        // 2. Build the System Prompt
        const systemPrompt = `
You are an expert university professor and an AI teaching assistant.
Your task is to generate high-quality academic assessments.
Module Details:
- Name: ${mod.module_name}
- Degree: ${mod.degree_program}
- Year/Semester: Year ${mod.studying_year}, Semester ${mod.semester}

Task: Generate a ${difficulty} level ${type} focusing on the topic: "${topic}".
Instructions:
- If generating a Multiple Choice Quiz (MCQ), you MUST respond with a valid JSON object. DO NOT include any markdown formatting, text, or explanations outside the JSON. The JSON structure should be:
  {
    "title": "Quiz Title",
    "questions": [
      {
        "question": "Question text?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correct_answer_index": 0
      }
    ]
  }
  Provide exactly 10 questions for MCQs.
- If generating Short Answer Questions, provide exactly 5 questions in clean Markdown format.
- If generating an Assignment Idea, provide a clear title, objective, structured rubric, and submission guidelines in clean Markdown format.
- For non-MCQ types, ALWAYS respond in clean GitHub-flavored Markdown. Do not include markdown code blocks \`\`\` around your entire response.
`;

        // 3. Call Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 2000,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Please generate the assessment exactly as requested." }
                ]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter Error: ${response.status} - ${errBody}`);
        }

        const completion = await response.json();
        let content = completion.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("AI returned empty response");
        }

        // Standardize: if it's MCQ, try to ensure it's valid JSON (remove markdown blocks if AI ignored instructions)
        if (type === "Multiple Choice Quiz") {
            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.replace(/^```json/, "").replace(/```$/, "").trim();
            } else if (content.startsWith("```")) {
                content = content.replace(/^```/, "").replace(/```$/, "").trim();
            }
        }

        res.json({ content, is_json: type === "Multiple Choice Quiz" });

    } catch (err) {
        console.error("AI Generation Error:", err);
        res.status(500).json({ message: "Failed to generate assessment. Details: " + err.message });
    }
};

// POST /api/lecturer/modules/:id/quizzes (Publish)
const publishQuiz = async (req, res) => {
    const { id: moduleId } = req.params;
    const lecturerId = req.user.id;
    const { title, topic, difficulty, questions, timer_minutes } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid quiz data." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Insert Quiz Metadata
        const quizRes = await client.query(`
            INSERT INTO quizzes (module_id, lecturer_id, title, topic, difficulty, timer_minutes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [moduleId, lecturerId, title, topic, difficulty, timer_minutes || 0]);

        const quizId = quizRes.rows[0].id;

        // 2. Insert Questions
        for (const q of questions) {
            await client.query(`
                INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index)
                VALUES ($1, $2, $3, $4)
            `, [quizId, q.question, JSON.stringify(q.options), q.correct_answer_index]);
        }

        await client.query("COMMIT");
        res.status(201).json({ message: "Quiz published successfully!", quizId });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error publishing quiz:", err);
        res.status(500).json({ message: "Failed to publish quiz." });
    } finally {
        client.release();
    }
};

// GET /api/lecturer/quizzes — fetch all quizzes published by lecturer
const getPublishedQuizzes = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const result = await pool.query(`
            SELECT q.*, m.module_code, m.module_name,
                   (SELECT COUNT(*) FROM quiz_submissions WHERE quiz_id = q.id) as total_submissions
            FROM quizzes q
            JOIN modules m ON q.module_id = m.id
            WHERE q.lecturer_id = $1
            ORDER BY q.created_at DESC
        `, [lecturerId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching published quizzes:", err);
        res.status(500).json({ message: "Server error fetching quizzes" });
    }
};

// GET /api/lecturer/quizzes/:id/submissions — fetch student marks for a quiz
const getQuizSubmissions = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const lecturerId = req.user.id;

        // Verify ownership
        const ownershipCheck = await pool.query(
            "SELECT 1 FROM quizzes WHERE id = $1 AND lecturer_id = $2",
            [quizId, lecturerId]
        );
        if (ownershipCheck.rowCount === 0) {
            return res.status(403).json({ message: "Unauthorized access to this quiz." });
        }

        const result = await pool.query(`
            SELECT qs.*, u.full_name as student_name, s.registration_number
            FROM quiz_submissions qs
            JOIN users u ON qs.student_id = u.id
            LEFT JOIN students s ON u.email = s.email
            WHERE qs.quiz_id = $1
            ORDER BY qs.score DESC
        `, [quizId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching quiz submissions:", err);
        res.status(500).json({ message: "Server error fetching submissions" });
    }
};

// DELETE /api/lecturer/quizzes/:id — delete a quiz
const deleteQuiz = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const lecturerId = req.user.id;

        const deleteResult = await pool.query(
            "DELETE FROM quizzes WHERE id = $1 AND lecturer_id = $2",
            [quizId, lecturerId]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: "Quiz not found or unauthorized." });
        }

        res.json({ message: "Quiz deleted successfully." });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        res.status(500).json({ message: "Server error deleting quiz" });
    }
};

// POST /api/lecturer/modules/:id/attendance — create a new named attendance session
const postAttendanceSession = async (req, res) => {
    const { id: moduleId } = req.params;
    const lecturerId = req.user.id;
    const { title, year, month, week_label } = req.body;

    if (!title || year === undefined || month === undefined || !week_label) {
        return res.status(400).json({ message: "title, year, month, and week_label are required." });
    }

    try {
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [moduleId, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized for this module." });
        }

        const result = await pool.query(`
            INSERT INTO attendance_sessions (module_id, lecturer_id, title, year, month, week_label, is_open)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING *
        `, [moduleId, lecturerId, title.trim(), year, month, week_label]);

        res.status(201).json({ message: "Attendance session created and opened.", session: result.rows[0] });
    } catch (err) {
        console.error("Error creating attendance session:", err);
        res.status(500).json({ message: "Server error creating attendance session." });
    }
};

// PATCH /api/lecturer/attendance/:session_id/toggle — open or close a specific session
const toggleAttendanceSession = async (req, res) => {
    const { session_id } = req.params;
    const lecturerId = req.user.id;

    try {
        const sessionCheck = await pool.query(
            "SELECT * FROM attendance_sessions WHERE id = $1 AND lecturer_id = $2",
            [session_id, lecturerId]
        );
        if (sessionCheck.rowCount === 0) {
            return res.status(403).json({ message: "Session not found or unauthorized." });
        }

        const current = sessionCheck.rows[0];
        const result = await pool.query(
            "UPDATE attendance_sessions SET is_open = $1 WHERE id = $2 RETURNING *",
            [!current.is_open, session_id]
        );

        const updated = result.rows[0];
        res.json({
            message: updated.is_open ? "Attendance session reopened." : "Attendance session closed.",
            session: updated
        });
    } catch (err) {
        console.error("Error toggling attendance session:", err);
        res.status(500).json({ message: "Server error toggling session." });
    }
};

// DELETE /api/lecturer/attendance/:session_id — delete a session
const deleteAttendanceSession = async (req, res) => {
    const { session_id } = req.params;
    const lecturerId = req.user.id;

    try {
        const result = await pool.query(
            "DELETE FROM attendance_sessions WHERE id = $1 AND lecturer_id = $2 RETURNING id",
            [session_id, lecturerId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Session not found or unauthorized." });
        }
        res.json({ message: "Attendance session deleted." });
    } catch (err) {
        console.error("Error deleting attendance session:", err);
        res.status(500).json({ message: "Server error deleting session." });
    }
};

// GET /api/lecturer/modules/:id/attendance — get all attendance sessions for a module+year
const getAttendanceSessions = async (req, res) => {
    const { id: moduleId } = req.params;
    const lecturerId = req.user.id;
    const { year } = req.query;

    try {
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [moduleId, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized for this module." });
        }

        let query = `
            SELECT att.*,
                   (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = att.id) AS total_present
            FROM attendance_sessions att
            WHERE att.module_id = $1
        `;
        const params = [moduleId];
        if (year) {
            query += " AND att.year = $2";
            params.push(year);
        }
        query += " ORDER BY att.month ASC, att.week_label ASC, att.created_at ASC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching attendance sessions:", err);
        res.status(500).json({ message: "Server error fetching attendance sessions." });
    }
};

// GET /api/lecturer/attendance/:session_id/records — view who attended
const getAttendanceRecords = async (req, res) => {
    const { session_id } = req.params;
    const lecturerId = req.user.id;

    try {
        const sessionCheck = await pool.query(
            "SELECT * FROM attendance_sessions WHERE id = $1 AND lecturer_id = $2",
            [session_id, lecturerId]
        );
        if (sessionCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to view this session." });
        }

        const result = await pool.query(`
            SELECT ar.*, u.full_name as student_name, s.registration_number, s.degree_program, s.studying_year
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.id
            LEFT JOIN students s ON u.email = s.email
            WHERE ar.session_id = $1
            ORDER BY ar.marked_at ASC
        `, [session_id]);

        res.json({ session: sessionCheck.rows[0], records: result.rows });
    } catch (err) {
        console.error("Error fetching attendance records:", err);
        res.status(500).json({ message: "Server error fetching records." });
    }
};

// GET /api/lecturer/attendance/:session_id/download — download CSV report
const downloadAttendanceReport = async (req, res) => {
    const { session_id } = req.params;
    const lecturerId = req.user.id;

    try {
        const sessionCheck = await pool.query(
            `SELECT att.*, m.module_name, m.module_code
             FROM attendance_sessions att
             JOIN modules m ON att.module_id = m.id
             WHERE att.id = $1 AND att.lecturer_id = $2`,
            [session_id, lecturerId]
        );
        if (sessionCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to download this report." });
        }

        const session = sessionCheck.rows[0];

        const result = await pool.query(`
            SELECT u.full_name as student_name, s.registration_number,
                   s.degree_program, s.studying_year, s.semester,
                   ar.marked_at
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.id
            LEFT JOIN students s ON u.email = s.email
            WHERE ar.session_id = $1
            ORDER BY ar.marked_at ASC
        `, [session_id]);

        const records = result.rows;

        // Build CSV
        const header = ["No.", "Student Name", "Registration Number", "Degree Program", "Year", "Semester", "Marked At"];
        const rows = records.map((r, i) => [
            i + 1,
            r.student_name || "",
            r.registration_number || "",
            r.degree_program || "",
            r.studying_year || "",
            r.semester || "",
            r.marked_at ? new Date(r.marked_at).toLocaleString() : ""
        ]);

        const csvLines = [
            `Attendance Report`,
            `Module: ${session.module_name} (${session.module_code})`,
            `Session: ${session.title}`,
            `Week: ${session.week_label}`,
            `Status: ${session.is_open ? "Open" : "Closed"}`,
            `Total Present: ${records.length}`,
            `Generated: ${new Date().toLocaleString()}`,
            ``,
            header.map(h => `"${h}"`).join(","),
            ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        ];

        const csvContent = csvLines.join("\r\n");
        const safeTitle = session.title.replace(/[^a-z0-9]/gi, "_");
        const filename = `attendance_${session.module_code}_${safeTitle}.csv`;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (err) {
        console.error("Error generating attendance report:", err);
        res.status(500).json({ message: "Server error generating report." });
    }
};

module.exports = {
    getMyModules,
    getModuleMaterials,
    uploadModuleMaterial,
    deleteModuleMaterial,
    generateAIAssessment,
    publishQuiz,
    getPublishedQuizzes,
    getQuizSubmissions,
    deleteQuiz,
    postAttendanceSession,
    toggleAttendanceSession,
    deleteAttendanceSession,
    getAttendanceSessions,
    getAttendanceRecords,
    downloadAttendanceReport
};

