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
- If generating a Multiple Choice Quiz (MCQ), provide exactly 10 questions. Ensure the 4 options for each question are formatted cleanly as a bulleted or numbered list on separate lines. Provide an Answer Key at the very end.
- If generating Short Answer Questions, provide 5 thought-provoking questions.
- If generating an Assignment Idea, provide a clear title, objective, structured rubric, and submission guidelines.
- ALWAYS respond in clean GitHub-flavored Markdown. Do not include markdown code blocks \`\`\` around your entire response.
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
        const markdownContent = completion.choices?.[0]?.message?.content;

        if (!markdownContent) {
            throw new Error("AI returned empty response");
        }

        res.json({ content: markdownContent });

    } catch (err) {
        console.error("AI Generation Error:", err);
        res.status(500).json({ message: "Failed to generate assessment. Ensure your Groq API key is valid. Details: " + err.message });
    }
};

module.exports = {
    getMyModules,
    getModuleMaterials,
    uploadModuleMaterial,
    deleteModuleMaterial,
    generateAIAssessment
};
