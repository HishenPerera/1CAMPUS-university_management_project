import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./StudentQuizzes.css";

function StudentQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Quiz Player State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    // Countdown Timer Effect
    useEffect(() => {
        let timer;
        if (activeQuiz && activeQuiz.timer_minutes > 0 && !result && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && activeQuiz && activeQuiz.timer_minutes > 0 && !result) {
            // Auto submit when time is up
            submitQuiz(true);
        }
        return () => clearInterval(timer);
    }, [activeQuiz, timeLeft, result]);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/student/quizzes");
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load quizzes. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    const startQuiz = async (quiz) => {
        const confirmMsg = `Are you sure you want to start this quiz? \n\n` +
            `• Difficulty: ${quiz.difficulty}\n` +
            `• Time: ${quiz.timer_minutes > 0 ? quiz.timer_minutes + " mins" : "Unlimited"}\n\n` +
            `⚠️ WARNING: You only get ONE attempt. If you exit or disconnect, you cannot re-enter.`;
            
        if (!confirm(confirmMsg)) return;

        try {
            // 1. Record the start of the attempt (prevents re-entry and returns questions)
            const res = await axios.post(`/student/quizzes/${quiz.id}/start`);
            
            setQuestions(res.data.questions);
            setActiveQuiz(quiz);
            setCurrentQuestionIdx(0);
            setUserAnswers({});
            setResult(null);
            
            if (quiz.timer_minutes > 0) {
                setTimeLeft(quiz.timer_minutes * 60);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to start quiz.");
        }
    };

    const handleAnswerSelect = (questionId, optionIdx) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
    };

    const nextQuestion = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        }
    };

    const submitQuiz = async (isAuto = false) => {
        if (!isAuto && Object.keys(userAnswers).length < questions.length) {
            if (!confirm("You haven't answered all questions. Submit anyway?")) return;
        }

        if (isAuto) alert("Time is up! Submitting your quiz automatically.");

        setSubmitting(true);
        try {
            const res = await axios.post(`/student/quizzes/${activeQuiz.id}/submit`, {
                answers: userAnswers
            });
            setResult(res.data);
            fetchQuizzes(); // Refresh list to show score
        } catch (err) {
            alert("Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    const closeQuiz = () => {
        if (!result && confirm("Closing this window will count as an incomplete attempt. Proceed?")) {
            setActiveQuiz(null);
            setQuestions([]);
            setResult(null);
        } else if (result) {
            setActiveQuiz(null);
            setQuestions([]);
            setResult(null);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="sq-loading">Loading available quizzes...</div>;

    return (
        <div className="sq-container">
            <div className="sq-header">
                <i className="bi bi-cpu sq-header-icon" />
                <div>
                    <h2>AI-Powered Quizzes</h2>
                    <p>Test your knowledge on module topics with AI-generated assessments.</p>
                </div>
            </div>

            {error && <div className="sq-error">{error}</div>}

            <div className="sq-grid">
                {quizzes.length === 0 ? (
                    <div className="sq-empty">
                        <i className="bi bi-clipboard-x" />
                        <p>No quizzes available for your modules yet.</p>
                    </div>
                ) : (
                    quizzes.map(q => (
                        <div key={q.id} className={`sq-card ${q.is_submitted ? 'submitted' : ''}`}>
                            <div className="sq-card-tag">{q.module_code}</div>
                            <h3>{q.title}</h3>
                            <p className="sq-card-topic">Topic: {q.topic}</p>
                            <div className="sq-card-meta">
                                <span><i className="bi bi-bar-chart" /> {q.difficulty}</span>
                                <span><i className="bi bi-person" /> {q.lecturer_name}</span>
                                {q.timer_minutes > 0 && <span><i className="bi bi-clock" /> {q.timer_minutes}m</span>}
                            </div>
                            
                            {q.is_submitted ? (
                                <div className="sq-card-result">
                                    <div className="sq-score-pill">
                                        Score: {q.score !== null ? `${q.score}/${q.submitted_total}` : 'Abandoned'}
                                    </div>
                                    <span className="sq-status-done"><i className="bi bi-check-circle-fill" /> Attempted</span>
                                </div>
                            ) : (
                                <button className="sq-btn-start" onClick={() => startQuiz(q)}>
                                    Start Quiz <i className="bi bi-arrow-right" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Quiz Player Modal */}
            {activeQuiz && (
                <div className="sq-modal-overlay">
                    <div className="sq-modal">
                        <div className="sq-modal-header">
                            <div>
                                <h3>{activeQuiz.title}</h3>
                                <span>{activeQuiz.module_code} — Question {currentQuestionIdx + 1} of {questions.length}</span>
                            </div>
                            <div className="sq-modal-timer-box">
                                {activeQuiz.timer_minutes > 0 && !result && (
                                    <div className={`sq-timer ${timeLeft < 60 ? 'warning' : ''}`}>
                                        <i className="bi bi-clock-history" /> {formatTime(timeLeft)}
                                    </div>
                                )}
                                {!submitting && !result && <button className="sq-btn-close" onClick={closeQuiz}><i className="bi bi-x-lg" /></button>}
                            </div>
                        </div>

                        <div className="sq-modal-body">
                            {result ? (
                                <div className="sq-result-view">
                                    <div className="sq-result-icon">
                                        <i className="bi bi-trophy-fill" />
                                    </div>
                                    <h4>Quiz Completed!</h4>
                                    <div className="sq-final-score">
                                        <span>Your Score</span>
                                        <strong>{result.score} / {result.total_questions}</strong>
                                    </div>
                                    <p>Your results have been recorded for your lecturer to review.</p>
                                    <button className="sq-btn-finish" onClick={closeQuiz}>Finish</button>
                                </div>
                            ) : (
                                <>
                                    <div className="sq-question-box">
                                        <p className="sq-question-text">{questions[currentQuestionIdx]?.question_text}</p>
                                        <div className="sq-options-list">
                                            {questions[currentQuestionIdx]?.options.map((option, idx) => (
                                                <button 
                                                    key={idx}
                                                    className={`sq-option-item ${userAnswers[questions[currentQuestionIdx].id] === idx ? 'selected' : ''}`}
                                                    onClick={() => handleAnswerSelect(questions[currentQuestionIdx].id, idx)}
                                                >
                                                    <span className="sq-option-letter">{String.fromCharCode(65 + idx)}</span>
                                                    <span className="sq-option-text">{option}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {!result && (
                            <div className="sq-modal-footer">
                                <div className="sq-progress-bar">
                                    <div 
                                        className="sq-progress-fill" 
                                        style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="sq-nav-btns">
                                    <button 
                                        className="sq-btn-nav" 
                                        disabled={currentQuestionIdx === 0}
                                        onClick={prevQuestion}
                                    >
                                        <i className="bi bi-chevron-left" /> Previous
                                    </button>
                                    
                                    {currentQuestionIdx === questions.length - 1 ? (
                                        <button className="sq-btn-submit" onClick={() => submitQuiz(false)} disabled={submitting}>
                                            {submitting ? "Submitting..." : "Submit Quiz"}
                                        </button>
                                    ) : (
                                        <button className="sq-btn-nav primary" onClick={nextQuestion}>
                                            Next <i className="bi bi-chevron-right" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentQuizzes;
