import { useState, useEffect, useMemo } from "react";
import axios from "../../api/axiosInstance";
import "./AILetterGenerator.css";

const LETTER_TYPES = [
    "Certificate of Enrollment",
    "Recommendation Letter",
    "Warning Letter",
    "Disciplinary Action Letter",
    "Leave of Absence Approval",
    "General Notice"
];

function AILetterGenerator() {
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [searchStudent, setSearchStudent] = useState("");
    const [letterType, setLetterType] = useState(LETTER_TYPES[0]);
    const [context, setContext] = useState("");
    
    const [generatedLetter, setGeneratedLetter] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await axios.get("/admin/students");
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to load students", err);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchStudent) return students;
        const q = searchStudent.toLowerCase();
        return students.filter(s => 
            s.first_name?.toLowerCase().includes(q) || 
            s.last_name?.toLowerCase().includes(q) || 
            s.registration_number?.toLowerCase().includes(q)
        );
    }, [students, searchStudent]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError("");
        setGeneratedLetter("");
        setGenerating(true);
        setCopied(false);

        try {
            const res = await axios.post("/admin/generate-letter", {
                studentId: selectedStudentId || null,
                letterType,
                context
            });
            setGeneratedLetter(res.data.letter);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate letter. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>Print Letter</title>');
        printWindow.document.write('<style>body { font-family: "Times New Roman", serif; padding: 40px; line-height: 1.6; white-space: pre-wrap; } .header { text-align: center; margin-bottom: 40px; } .logo { font-size: 24px; font-weight: bold; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="header"><div class="logo">1CAMPUS UNIVERSITY</div><div class="sub">Office of the Registrar</div><hr/></div>');
        printWindow.document.write('<div>' + generatedLetter + '</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="ailg-wrapper">
            <div className="ailg-header">
                <div>
                    <h2 className="ailg-title"><i className="bi bi-magic" /> AI Letter Generator</h2>
                    <p className="ailg-subtitle">Draft official university communications instantly using artificial intelligence.</p>
                </div>
            </div>

            {error && <div className="ailg-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            <div className="ailg-grid">
                <div className="ailg-form-card">
                    <h3 className="ailg-card-title"><i className="bi bi-sliders" /> Letter Parameters</h3>
                    <form onSubmit={handleGenerate} className="ailg-form">
                        
                        <div className="ailg-form-group">
                            <label className="ailg-label">Select Student (Optional)</label>
                            <div className="ailg-search-wrap">
                                <i className="bi bi-search ailg-search-icon" />
                                <input 
                                    type="text" 
                                    className="ailg-search" 
                                    placeholder="Search by name or Reg No..."
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                />
                            </div>
                            <div className="ailg-select-wrap">
                                <select 
                                    className="ailg-select"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    disabled={loadingStudents}
                                >
                                    <option value="">-- No Student / General Letter --</option>
                                    {filteredStudents.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.registration_number} - {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ailg-form-group">
                            <label className="ailg-label">Letter Type</label>
                            <div className="ailg-select-wrap">
                                <select 
                                    className="ailg-select"
                                    value={letterType}
                                    onChange={(e) => setLetterType(e.target.value)}
                                >
                                    {LETTER_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                    <option value="Custom">Custom / Other</option>
                                </select>
                            </div>
                            {letterType === "Custom" && (
                                <input 
                                    type="text" 
                                    className="ailg-input mt-2" 
                                    placeholder="Specify custom letter type..." 
                                    value={letterType}
                                    onChange={(e) => setLetterType(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="ailg-form-group">
                            <label className="ailg-label">Additional Context / Reason</label>
                            <textarea 
                                className="ailg-textarea" 
                                rows={4}
                                placeholder="E.g., The student missed 3 consecutive lectures without notice. Warn them about maintaining 80% attendance."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="ailg-submit-btn" disabled={generating}>
                            {generating ? (
                                <><span className="ailg-spinner" /> Generating...</>
                            ) : (
                                <><i className="bi bi-stars" /> Generate Draft</>
                            )}
                        </button>
                    </form>
                </div>

                <div className="ailg-result-card">
                    <div className="ailg-result-header">
                        <h3 className="ailg-card-title"><i className="bi bi-file-earmark-text" /> Output Preview</h3>
                        {generatedLetter && (
                            <div className="ailg-result-actions">
                                <button className="ailg-action-btn" onClick={handleCopy} title="Copy to clipboard">
                                    <i className={copied ? "bi bi-check2" : "bi bi-clipboard"} /> {copied ? "Copied" : "Copy"}
                                </button>
                                <button className="ailg-action-btn ailg-print-btn" onClick={handlePrint} title="Print / Save PDF">
                                    <i className="bi bi-printer" /> Print
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className={`ailg-result-body ${generating ? "ailg-generating" : ""}`}>
                        {generating ? (
                            <div className="ailg-loading-placeholder">
                                <i className="bi bi-magic ailg-magic-icon" />
                                <p>Drafting official document...</p>
                            </div>
                        ) : generatedLetter ? (
                            <textarea 
                                className="ailg-result-content" 
                                value={generatedLetter}
                                onChange={(e) => setGeneratedLetter(e.target.value)}
                                spellCheck="false"
                            />
                        ) : (
                            <div className="ailg-empty-placeholder">
                                <i className="bi bi-file-earmark-plus" />
                                <p>Set your parameters and click Generate to see the letter here.</p>
                            </div>
                        )}
                    </div>
                    {generatedLetter && (
                        <div className="ailg-result-footer">
                            <i className="bi bi-info-circle" /> You can edit the text directly before printing.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AILetterGenerator;
