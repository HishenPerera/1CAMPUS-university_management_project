import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./ManageQuizzes.css";

function ManageQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/lecturer/quizzes");
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load your quizzes.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this quiz? All student marks will be permanently lost.")) return;
        try {
            await axios.delete(`/lecturer/quizzes/${id}`);
            setQuizzes(quizzes.filter(q => q.id !== id));
        } catch (err) {
            alert("Failed to delete quiz.");
        }
    };

    const viewResults = async (quiz) => {
        setSelectedQuiz(quiz);
        setShowModal(true);
        setLoadingSubmissions(true);
        try {
            const res = await axios.get(`/lecturer/quizzes/${quiz.id}/submissions`);
            setSubmissions(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to load submissions.");
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const downloadPDF = () => {
        if (!selectedQuiz || submissions.length === 0) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text("Result Sheet", 105, 15, { align: "center" });
        
        doc.setFontSize(12);
        doc.text(`Quiz: ${selectedQuiz.title}`, 20, 30);
        doc.text(`Module: ${selectedQuiz.module_code} - ${selectedQuiz.module_name}`, 20, 37);
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 44);
        doc.text(`Difficulty: ${selectedQuiz.difficulty}`, 20, 51);

        // Table
        const tableColumn = ["Registration No", "Student Name", "Score", "Total Questions", "Percentage"];
        const tableRows = submissions.map(s => [
            s.registration_number || "N/A",
            s.student_name,
            s.score ?? 0,
            s.total_questions ?? 0,
            `${((s.score / s.total_questions) * 100).toFixed(1)}%`
        ]);

        doc.autoTable({
            startY: 60,
            head: [tableColumn],
            body: tableRows,
            theme: "striped",
            headStyles: { fillColor: [26, 127, 232], textColor: [255, 255, 255] },
        });

        doc.save(`${selectedQuiz.module_code}_Results.pdf`);
    };

    if (loading) return <div className="mq-loading">Loading your quizzes...</div>;

    return (
        <div className="mq-container">
            <div className="mq-header">
                <i className="bi bi-journal-check mq-header-icon" />
                <div>
                    <h2>Manage Published Quizzes</h2>
                    <p>Track student performance and manage your AI-generated assessments.</p>
                </div>
            </div>

            {error && <div className="mq-error">{error}</div>}

            <div className="mq-grid">
                {quizzes.length === 0 ? (
                    <div className="mq-empty">
                        <i className="bi bi-clipboard-x" />
                        <p>You haven't published any quizzes yet.</p>
                    </div>
                ) : (
                    quizzes.map(q => (
                        <div key={q.id} className="mq-card">
                            <div className="mq-card-badge">{q.module_code}</div>
                            <h3>{q.title}</h3>
                            <p className="mq-card-topic">{q.topic}</p>
                            
                            <div className="mq-card-stats">
                                <div className="mq-stat">
                                    <strong>{q.total_submissions}</strong>
                                    <span>Attempts</span>
                                </div>
                                <div className="mq-stat">
                                    <strong>{q.difficulty}</strong>
                                    <span>Level</span>
                                </div>
                            </div>

                            <div className="mq-card-footer">
                                <button className="mq-btn-results" onClick={() => viewResults(q)}>
                                    <i className="bi bi-bar-chart-fill" /> View Results
                                </button>
                                <button className="mq-btn-delete" onClick={() => handleDelete(q.id)}>
                                    <i className="bi bi-trash3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Results Modal */}
            {showModal && (
                <div className="mq-modal-overlay">
                    <div className="mq-modal">
                        <div className="mq-modal-header">
                            <div>
                                <h3>Results: {selectedQuiz?.title}</h3>
                                <span>{selectedQuiz?.module_code} — {submissions.length} Students Attempted</span>
                            </div>
                            <button className="mq-btn-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg" /></button>
                        </div>

                        <div className="mq-modal-body">
                            {loadingSubmissions ? (
                                <div className="mq-modal-loading">Loading results...</div>
                            ) : submissions.length === 0 ? (
                                <div className="mq-modal-empty">No students have taken this quiz yet.</div>
                            ) : (
                                <div className="mq-table-wrapper">
                                    <table className="mq-table">
                                        <thead>
                                            <tr>
                                                <th>Registration No</th>
                                                <th>Student Name</th>
                                                <th>Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {submissions.map(s => (
                                                <tr key={s.id}>
                                                    <td><strong>{s.registration_number || "N/A"}</strong></td>
                                                    <td>{s.student_name}</td>
                                                    <td>
                                                        <span className="mq-score-text">
                                                            {s.score !== null ? `${s.score} / ${s.total_questions}` : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {s.score === null ? (
                                                            <span className="mq-badge-abandoned">Abandoned</span>
                                                        ) : (
                                                            <span className="mq-badge-completed">Completed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="mq-modal-footer">
                            <button 
                                className="mq-btn-pdf" 
                                onClick={downloadPDF}
                                disabled={submissions.length === 0}
                            >
                                <i className="bi bi-file-earmark-pdf-fill" /> Download Result Sheet (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageQuizzes;
