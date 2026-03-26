import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import "./AIAssessment.css";

function AIAssessment() {
    const [modules, setModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(true);
    const [error, setError] = useState("");

    const [selectedModule, setSelectedModule] = useState("");
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Intermediate");
    const [type, setType] = useState("Multiple Choice Quiz");

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await axios.get("/lecturer/modules");
                setModules(res.data);
                if (res.data.length > 0) {
                    setSelectedModule(res.data[0].id.toString());
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load your modules. Please refresh.");
            } finally {
                setLoadingModules(false);
            }
        };
        fetchModules();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError("");
        setResult("");
        setGenerating(true);
        setCopied(false);

        if (!selectedModule || !topic.trim()) {
            setError("Please select a module and enter a topic.");
            setGenerating(false);
            return;
        }

        try {
            const res = await axios.post(`/lecturer/modules/${selectedModule}/ai-assessment`, {
                topic: topic.trim(),
                difficulty,
                type
            });
            setResult(res.data.content);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to generate assessment. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="aia-page">
            <div className="aia-header">
                <i className="bi bi-robot aia-header-icon" />
                <div>
                    <h2 className="aia-title">AI Assessment Generator</h2>
                    <p className="aia-subtitle">Instantly generate quizzes, short answer questions, and assignment ideas for your modules.</p>
                </div>
            </div>

            {error && <div className="aia-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            <div className="aia-content">
                <div className="aia-sidebar">
                    <form className="aia-form" onSubmit={handleGenerate}>
                        <div className="aia-form-group">
                            <label>Target Module</label>
                            {loadingModules ? (
                                <div className="aia-loading-text">Loading modules...</div>
                            ) : modules.length === 0 ? (
                                <div className="aia-loading-text">No modules assigned to you.</div>
                            ) : (
                                <select 
                                    className="aia-select" 
                                    value={selectedModule} 
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    required
                                >
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.module_code} — {m.module_name} (Yr {m.studying_year})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="aia-form-group">
                            <label>Assessment Type</label>
                            <select className="aia-select" value={type} onChange={e => setType(e.target.value)}>
                                <option value="Multiple Choice Quiz">Multiple Choice Quiz (MCQ)</option>
                                <option value="Short Answer Questions">Short Answer Questions</option>
                                <option value="Assignment Idea">Practical Assignment Idea</option>
                            </select>
                        </div>

                        <div className="aia-form-group">
                            <label>Difficulty Level</label>
                            <select className="aia-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option value="Easy">Easy (Beginner)</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced (Expert)</option>
                            </select>
                        </div>

                        <div className="aia-form-group">
                            <label>Topic / Concept</label>
                            <input 
                                type="text" 
                                className="aia-input" 
                                placeholder="e.g. Normalization, Polymorphism, Thermodynamics" 
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="aia-btn-generate" 
                            disabled={generating || loadingModules || modules.length === 0 || !topic.trim()}
                        >
                            {generating ? (
                                <><span className="spinner-border spinner-border-sm mr-2" /> Generating...</>
                            ) : (
                                <><i className="bi bi-magic" /> Generate Assessment</>
                            )}
                        </button>
                    </form>
                </div>

                <div className="aia-main">
                    <div className="aia-result-box">
                        <div className="aia-result-header">
                            <h3><i className="bi bi-file-earmark-text" /> Generated Output</h3>
                            {result && (
                                <button className={`aia-btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy to clipboard">
                                    {copied ? <><i className="bi bi-check-lg" /> Copied!</> : <><i className="bi bi-clipboard" /> Copy</>}
                                </button>
                            )}
                        </div>
                        
                        <div className="aia-result-body">
                            {generating ? (
                                <div className="aia-generating-state">
                                    <div className="aia-pulse-ring"></div>
                                    <p>Our AI is drafting your assessment...</p>
                                    <span>This usually takes 5-10 seconds.</span>
                                </div>
                            ) : result ? (
                                <div className="aia-result-text markdown-body">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{result}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="aia-empty-state">
                                    <i className="bi bi-vector-pen aia-empty-icon" />
                                    <p>Fill out the form on the left to generate content.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIAssessment;
