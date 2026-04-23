const bcrypt = require("bcrypt");
const pool = require("../config/db");
const {
    getAllStudents, getStudentById, createStudentRecord,
    updateStudentRecord, deleteStudentFull,
} = require("../models/studentModel");
const { createUser } = require("../models/userModel");
const logActivity = require("../utils/logger");
const { sendEnrollmentEmail } = require("../utils/emailService");

/* Generate 3 random temp passwords */
const generateTempPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const make = () => Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return [make(), make(), make()];
};

const generateSingleTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

/**
 * Retrieve the list of all student profiles.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON array of student profiles or error response.
 */
// GET /api/admin/students
const listStudents = async (req, res) => {
    try {
        const students = await getAllStudents();
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Generate a set of temporary passwords for admin use.
 *
 * @param {object} _req - Express request object (unused).
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON object containing generated temporary passwords.
 */
// GET /api/admin/temp-passwords
const getTempPasswords = async (_req, res) => {
    try {
        res.json({ passwords: generateTempPasswords() });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Retrieve details for a single student by ID.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Student identifier.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON student record or error response.
 */
// GET /api/admin/students/:id
const getStudentDetail = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Create a new student portal user and student profile.
 *
 * This endpoint creates both a user account for portal login and a
 * student record, logs the creation event, and optionally sends a welcome email.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request payload.
 * @param {string} req.body.first_name - Student first name.
 * @param {string} req.body.last_name - Student last name.
 * @param {string} req.body.email - Portal email address.
 * @param {string} [req.body.personal_email] - Personal email for enrollment notifications.
 * @param {string} req.body.registration_number - Student registration number.
 * @param {string} req.body.degree_program - Degree program name.
 * @param {number} req.body.studying_year - Student year of study.
 * @param {number} req.body.semester - Current semester.
 * @param {string} req.body.chosen_password - Initial password for portal login.
 * @param {string} [req.body.nic_number] - Student NIC number.
 * @param {string} [req.body.phone_number] - Contact phone number.
 * @param {string} [req.body.address] - Postal address.
 * @param {string} [req.body.enrolled_date] - Enrollment date.
 * @param {string} [req.body.intake] - Academic intake period.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON response with created student and email status.
 */
// POST /api/admin/students
// Creates both a users entry (portal login) AND a students record
const addStudent = async (req, res) => {
    try {
        const {
            first_name, last_name, email,
            personal_email,           // student's personal/contact email — receives welcome email
            registration_number, degree_program, studying_year, semester,
            nic_number, phone_number, address, enrolled_date,
            chosen_password, intake,
        } = req.body;

        if (!first_name || !last_name || !email || !registration_number || !degree_program || !studying_year || !semester || !chosen_password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Create portal login account (in users table)
        const hashedPassword = await bcrypt.hash(chosen_password, 10);
        const full_name = `${first_name} ${last_name}`;
        await createUser(full_name, email, hashedPassword, "student");

        // Mark is_temp_password = true
        await pool.query("UPDATE users SET is_temp_password = true WHERE email = $1", [email]);

        // Create student profile record
        const student = await createStudentRecord({
            registration_number, first_name, last_name, email,
            nic_number, phone_number, degree_program,
            studying_year, semester, address, enrolled_date, intake: intake || null,
        });

        await logActivity(req.user.id, "CREATE_STUDENT", `Created student profile/login for ${email} (${registration_number})`);

        // Send enrollment email to the student's personal/contact email (if provided)
        const emailTarget = personal_email || null;
        let emailSent = false;
        if (emailTarget) {
            try {
                await sendEnrollmentEmail({
                    toEmail: emailTarget,
                    studentName: `${first_name} ${last_name}`,
                    portalEmail: email,
                    tempPassword: chosen_password,
                    regNumber: registration_number,
                    degreeProgram: degree_program,
                });
                emailSent = true;
                console.log(`[EMAIL] Enrollment credentials sent to ${emailTarget}`);
            } catch (emailErr) {
                console.error(`[EMAIL] Failed to send enrollment email to ${emailTarget}:`, emailErr.message);
            }
        }

        res.status(201).json({
            message: "Student created successfully",
            student,
            email_sent: emailSent,
            email_recipient: emailTarget,
        });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            return res.status(409).json({ message: "A student with this email or registration number already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Update an existing student record with provided details.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Student identifier.
 * @param {object} req.body - Fields to update on the student record.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON response with updated student or error response.
 */
// PUT /api/admin/students/:id
const editStudent = async (req, res) => {
    try {
        const updated = await updateStudentRecord(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: "Student not found" });
        res.json({ message: "Student updated", student: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete a full student record from the system.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Student identifier.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON confirmation or error response.
 */
// DELETE /api/admin/students/:id
const removeStudent = async (req, res) => {
    try {
        await deleteStudentFull(req.params.id);
        await logActivity(req.user.id, "DELETE_STUDENT", `Deleted student record ID ${req.params.id}`);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ── Applications Pipeline ─────────────────────────────────────────────── */

/**
 * Retrieve all student applications and include approver names.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON array of applications or error response.
 */
const getApplications = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.full_name as approver_name
            FROM student_applications a
            LEFT JOIN users u ON a.approved_by = u.id
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching applications" });
    }
};

/**
 * Mark a pending student application as accepted.
 *
 * @param {object} req - Express request object.
 * @param {object} req.user - Authenticated user object.
 * @param {string} req.user.id - ID of the approving admin.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Application identifier.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON confirmation or error response.
 */
const acceptApplication = async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE student_applications SET status = 'accepted', approved_by = $1 WHERE id = $2 AND status = 'pending' RETURNING email",
            [req.user.id, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Application not found or already processed" });

        await logActivity(req.user.id, "ACCEPT_APPLICATION", `Accepted application for ${result.rows[0].email} for portal setup`);
        res.json({ message: "Application accepted. Proceed to add student to portal." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error accepting application" });
    }
};

/**
 * Approve an accepted student application by creating portal credentials and
 * a student record, then finalizing enrollment.
 *
 * @param {object} req - Express request object.
 * @param {object} req.user - Authenticated user object.
 * @param {string} req.user.id - ID of the approving admin.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Application identifier.
 * @param {object} req.body - Request payload containing student details.
 * @param {string} req.body.first_name - Student first name.
 * @param {string} req.body.last_name - Student last name.
 * @param {string} req.body.degree_program - Degree program name.
 * @param {number} req.body.studying_year - Year of study.
 * @param {number} req.body.semester - Current semester.
 * @param {string} [req.body.nic_number] - Student NIC number.
 * @param {string} [req.body.phone_number] - Contact phone number.
 * @param {string} [req.body.address] - Postal address.
 * @param {string} [req.body.intake] - Academic intake period.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON enrollment details or error response.
 */
const approveApplication = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, nic_number, phone_number, address, degree_program, studying_year, semester, intake } = req.body;

    try {
        // 1. Fetch application
        const appRes = await pool.query("SELECT * FROM student_applications WHERE id = $1 AND status = 'accepted'", [id]);
        if (appRes.rowCount === 0) return res.status(404).json({ message: "Application not found or not accepted yet" });
        const app = appRes.rows[0];

        // 2. Generate setup metadata
        const tempPassword = generateSingleTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Map Degree to Prefix
        const map = {
            "Bachelor of Science in Computer Science": "CS",
            "Bachelor of Science in Information Technology": "IT",
            "Bachelor of Engineering": "ENG",
            "Bachelor of Business Administration": "BBA",
            "Bachelor of Science in Data Science": "DS",
            "Bachelor of Arts": "BA",
            "Master of Science in Computer Science": "MCS",
            "Master of Business Administration": "MBA"
        };
        const prefix = map[degree_program] || "STU";

        // Find highest sequential registration number for this prefix and year
        const shortYear = String(new Date().getFullYear()).slice(-2);
        const prefixYear = `${prefix}${shortYear}`;
        
        const lastRegRes = await pool.query(
            "SELECT registration_number FROM students WHERE registration_number LIKE $1 ORDER BY registration_number DESC LIMIT 1",
            [`${prefixYear}%`]
        );

        let nextNum = 1;
        if (lastRegRes.rowCount > 0) {
            const lastReg = lastRegRes.rows[0].registration_number;
            const lastNumStr = lastReg.replace(prefixYear, "");
            const lastNum = parseInt(lastNumStr, 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        
        const regNumber = `${prefixYear}${String(nextNum).padStart(4, '0')}`;
        const portalEmail = `${regNumber.toLowerCase()}@1campus.edu`;

        // Begin database transaction to ensure application approval and student creation succeed together.
        // If any step fails, the transaction is rolled back to keep data consistent.
        await pool.query("BEGIN");

        // - Update application status to enrolled
        await pool.query("UPDATE student_applications SET status = 'enrolled' WHERE id = $1", [id]);

        // - Create User record for portal login with temporary credentials
        const newUserQuery = await pool.query(
            "INSERT INTO users (full_name, email, password, role, is_temp_password) VALUES ($1, $2, $3, 'student', true) RETURNING id",
            [`${first_name} ${last_name}`, portalEmail, hashedPassword]
        );
        const newUserId = newUserQuery.rows[0].id;

        // - Create Student record using the existing model function
        await createStudentRecord({
            registration_number: regNumber,
            first_name, last_name, email: portalEmail,
            nic_number, phone_number: phone_number || null,
            degree_program,
            studying_year: studying_year || 1,
            semester: semester || 1,
            address: address || null,
            intake: intake || null
        });

        await logActivity(req.user.id, "APPROVE_APPLICATION", `Created student portal account for ${portalEmail} (${regNumber})`);

        // Commit the transaction now that both the application update and student creation have succeeded.
        await pool.query("COMMIT");

        // Send enrollment email to the student's personal application email
        let emailSent = false;
        try {
            await sendEnrollmentEmail({
                toEmail: app.email,          // personal email from the application form
                studentName: `${first_name} ${last_name}`,
                portalEmail,
                tempPassword,
                regNumber,
                degreeProgram: degree_program,
            });
            emailSent = true;
            console.log(`[EMAIL] Enrollment credentials sent to ${app.email}`);
        } catch (emailErr) {
            // Non-fatal — log but don't fail the enrollment
            console.error(`[EMAIL] Failed to send enrollment email to ${app.email}:`, emailErr.message);
        }

        res.json({
            message: "Student Portal Account created successfully",
            temp_password: tempPassword,
            reg_number: regNumber,
            portal_email: portalEmail,
            email_sent: emailSent,
            email_recipient: app.email,
        });
    } catch (err) {
        await pool.query("ROLLBACK");
        console.error(err);
        if (err.code === "23505") { // Unique violation on email
            return res.status(409).json({ message: "A user with this email already exists in the system." });
        }
        res.status(500).json({ message: "Server error processing application" });
    }
};

/**
 * Reject a pending student application.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Application identifier.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON confirmation or error response.
 */
const rejectApplication = async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE student_applications SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING email",
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Application not found or already processed" });

        await logActivity(req.user.id, "REJECT_APPLICATION", `Rejected application for ${result.rows[0].email}`);
        res.json({ message: "Application rejected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error rejecting application" });
    }
};

/* ── Module & Lecturer Management Pipeline ─────────────────────────────── */

const listModules = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, 
            COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)) FILTER (WHERE u.id IS NOT NULL), '[]') as assigned_lecturers
            FROM modules m
            LEFT JOIN lecturer_modules lm ON m.id = lm.module_id
            LEFT JOIN users u ON lm.lecturer_id = u.id
            GROUP BY m.id
            ORDER BY m.semester, m.module_code
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching modules" });
    }
};

const getLecturers = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'lecturer' ORDER BY full_name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching lecturers" });
    }
};

const addModule = async (req, res) => {
    const { module_code, module_name, degree_program, semester, studying_year, intake } = req.body;
    if (!module_code || !module_name || !degree_program || !semester || !studying_year || !intake) {
        return res.status(400).json({ message: "Missing required module fields" });
    }

    if (!['Jan-Jun', 'Jul-Dec'].includes(intake)) {
        return res.status(400).json({ message: "Invalid intake. Must be 'Jan-Jun' or 'Jul-Dec'." });
    }

    // Auto-suffix the module code with -Jan or -Jul
    const intakeSuffix = intake === 'Jan-Jun' ? 'Jan' : 'Jul';
    const qualifiedCode = `${module_code}-${intakeSuffix}`;

    try {
        const result = await pool.query(
            "INSERT INTO modules (module_code, module_name, degree_program, semester, studying_year, intake) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [qualifiedCode, module_name, degree_program, semester, studying_year, intake]
        );
        await logActivity(req.user.id, "CREATE_MODULE", `Created module ${qualifiedCode} - ${module_name} (${intake})`);
        res.status(201).json({ message: "Module created", module: result.rows[0] });
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ message: "Module code already exists" });
        res.status(500).json({ message: "Server error creating module" });
    }
};

const deleteModule = async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM modules WHERE id = $1 RETURNING module_code", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Module not found" });

        await logActivity(req.user.id, "DELETE_MODULE", `Deleted module ${result.rows[0].module_code}`);
        res.json({ message: "Module deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error deleting module" });
    }
};

const assignModule = async (req, res) => {
    const { id } = req.params; // module_id
    const { lecturer_id } = req.body;
    if (!lecturer_id) return res.status(400).json({ message: "Lecturer ID is required" });

    try {
        // verify lecturer exists and is a lecturer
        const lectRes = await pool.query("SELECT id, full_name FROM users WHERE id = $1 AND role = 'lecturer'", [lecturer_id]);
        if (lectRes.rowCount === 0) return res.status(404).json({ message: "Lecturer not found or invalid role" });

        await pool.query("INSERT INTO lecturer_modules (lecturer_id, module_id) VALUES ($1, $2)", [lecturer_id, id]);

        await logActivity(req.user.id, "ASSIGN_MODULE", `Assigned module #${id} to lecturer ${lectRes.rows[0].full_name}`);
        res.json({ message: "Lecturer assigned to module successfully" });
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ message: "Lecturer is already assigned to this module" });
        res.status(500).json({ message: "Server error assigning module" });
    }
};

const removeModuleAssignment = async (req, res) => {
    const { id, lecturerId } = req.params;
    try {
        await pool.query("DELETE FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2", [id, lecturerId]);
        await logActivity(req.user.id, "REMOVE_ASSIGNMENT", `Removed lecturer #${lecturerId} assignment from module #${id}`);
        res.json({ message: "Assignment removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error removing assignment" });
    }
};

/**
 * Generate an official university letter using the Groq AI completion API.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request payload.
 * @param {string} [req.body.studentId] - Optional student identifier to include student details.
 * @param {string} req.body.letterType - Type of letter to generate (e.g. acceptance, confirmation).
 * @param {string} [req.body.context] - Additional context or reason for the letter.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} JSON object containing the generated letter or error response.
 */
const generateLetter = async (req, res) => {
    try {
        const { studentId, letterType, context } = req.body;
        
        let studentInfo = "";
        if (studentId) {
            const studentResult = await pool.query(
                `SELECT first_name, last_name, registration_number, degree_program, studying_year, semester 
                 FROM students WHERE id = $1`, [studentId]
            );
            if (studentResult.rowCount > 0) {
                const st = studentResult.rows[0];
                studentInfo = `\nStudent Details:\n- Name: ${st.first_name} ${st.last_name}\n- Registration Number: ${st.registration_number}\n- Degree: ${st.degree_program}\n- Year: ${st.studying_year}, Semester: ${st.semester}\n`;
            }
        }

        // Build a formal AI prompt that instructs the model to generate a fully formed letter.
        // Includes optional student details, letter type, and any supplemental context.
        const systemPrompt = `You are a highly professional university administrator at 1CAMPUS University. Your task is to generate official university letters based on the provided details. Use formal, professional, and empathetic tone when required. Format the response clearly with paragraphs. Do not use placeholders that the user must fill; invent reasonable generic details or rely entirely on the provided context. Ensure the letter is ready to be printed or emailed immediately. Sign the letter as '1CAMPUS Administration'.`;
        
        const prompt = `Generate a ${letterType} letter. \n${studentInfo}\nAdditional Context/Reason: ${context || 'None'}\n\nPlease generate the full official letter.`;
        
        // Call the Groq chat completions endpoint with the assembled prompt.
        // The response should contain the generated letter text in the first completion choice.
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Groq Error: ${response.status} - ${errBody}`);
        }

        const completion = await response.json();
        const letter = completion.choices?.[0]?.message?.content || "Failed to generate letter.";
        
        res.json({ letter });
    } catch (err) {
        console.error("Error generating letter:", err);
        res.status(500).json({ message: "Server error generating letter" });
    }
};

module.exports = {
    listStudents, getTempPasswords, getStudentDetail, addStudent, editStudent, removeStudent,
    getApplications, acceptApplication, approveApplication, rejectApplication,
    listModules, getLecturers, addModule, deleteModule, assignModule, removeModuleAssignment,
    generateLetter
};
