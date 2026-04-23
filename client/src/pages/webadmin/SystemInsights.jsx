import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import "./SystemInsights.css";

function SystemInsights() {
    const [data, setData] = useState([]);
    const [advisoryMessage, setAdvisoryMessage] = useState(null);
    const [overallAverage, setOverallAverage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/webadmin/system-insights");
            
            const formattedData = res.data.data.map(item => {
                const date = new Date(item.timestamp);
                return {
                    ...item,
                    timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullDate: date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                };
            });

            setData(formattedData);
            setAdvisoryMessage(res.data.advisoryMessage);
            setOverallAverage(res.data.overallAverage);
            setError("");
        } catch (err) {
            console.error("Error fetching insights:", err);
            setError("Failed to load system insights data.");
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{ backgroundColor: 'var(--surface-1)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{dataPoint.fullDate}</p>
                    {payload.map(entry => (
                        <p key={entry.name} style={{ color: entry.color, margin: '0.2rem 0' }}>
                            {entry.name}: {entry.value} logins
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="insights-container"><div className="sm-loading"><div className="sm-spinner"></div></div></div>;
    }

    if (error) {
        return <div className="insights-container"><div className="sm-error">{error}</div></div>;
    }

    return (
        <div className="insights-container">
            <div className="insights-header">
                <h2 className="insights-title">System Insights & AI Reporting</h2>
                <p className="insights-subtitle">Historical analysis and AI-driven predictions for server load management.</p>
            </div>

            {advisoryMessage && (
                <div className="advisory-card">
                    <i className="bi bi-exclamation-triangle-fill advisory-icon" />
                    <div>
                        <div style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>Admin Advisory Warning</div>
                        <div style={{ opacity: 0.9 }}>{advisoryMessage}</div>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Average Hourly Logins (7 Days)</div>
                    <div className="stat-value">{overallAverage}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">System Health</div>
                    <div className="stat-value" style={{ color: advisoryMessage ? "#ff453a" : "#32d74b" }}>
                        {advisoryMessage ? "Caution" : "Optimal"}
                    </div>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-header">
                    <div className="chart-title">System Usage Forecast (48h Window)</div>
                </div>
                <div style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis 
                                dataKey="timeLabel" 
                                stroke="var(--text-secondary)" 
                                tick={{ fill: 'var(--text-secondary)' }}
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="var(--text-secondary)" 
                                tick={{ fill: 'var(--text-secondary)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                            
                            <Line 
                                type="monotone" 
                                dataKey="actualUsage" 
                                name="Actual Usage" 
                                stroke="var(--brand-primary)" 
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="predictedUsage" 
                                name="AI Predicted Usage" 
                                stroke="#f5a623" 
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default SystemInsights;
