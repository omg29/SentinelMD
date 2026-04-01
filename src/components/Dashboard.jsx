import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Target, FileJson, TrendingUp, Info, Stethoscope, ChevronRight, Wind, Droplets, Thermometer, Save, Activity, Brain } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ result, onUpdate }) => {
    const [activeExpert, setActiveExpert] = useState('lung_cancer');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editVitals, setEditVitals] = useState({
        bmi: result?.patient_data?.bmi || '',
        glucose: result?.patient_data?.glucose || '',
        heart_rate: result?.patient_data?.heart_rate || ''
    });

    useEffect(() => {
        if (result && result.predictions && Object.keys(result.predictions).length > 0) {
            try {
                const highest = Object.entries(result.predictions).reduce((prev, current) =>
                    (prev[1].score > current[1].score) ? prev : current
                )[0];
                setActiveExpert(highest);
            } catch (e) {
                console.error("Selection error:", e);
            }
        }
    }, [result]);

    useEffect(() => {
        if (result?.patient_data) {
            setEditVitals({
                bmi: result.patient_data.bmi || '',
                glucose: result.patient_data.glucose || '',
                heart_rate: result.patient_data.heart_rate || ''
            });
        }
    }, [result?.id]);

    if (!result) return (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <Stethoscope size={48} color="#475569" />
            </div>
            <h4 style={{ color: '#475569', fontWeight: 500 }}>Awaiting Patient Data</h4>
            <p style={{ color: '#475569', fontSize: '0.9rem', maxWidth: '300px', marginTop: '0.5rem' }}>Complete the health assessment to generate unified clinical diagnostics.</p>
        </div>
    );

    const { predictions, fhir_report, patient_name, age, patient_data } = result;

    const handleUpdateVitals = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            const payload = {
                patient_data: {
                    bmi: editVitals.bmi ? parseFloat(editVitals.bmi) : null,
                    glucose: editVitals.glucose ? parseInt(editVitals.glucose) : null,
                    heart_rate: editVitals.heart_rate ? parseInt(editVitals.heart_rate) : null
                }
            };
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await axios.put(`${API_URL}/api/submissions/${result.id}`, payload);
            if (onUpdate) onUpdate(response.data);
        } catch (err) {
            console.error(err);
            alert("Error updating measurements: Diagnostic engine sync failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const activeData = predictions[activeExpert] || {
        score: 0,
        category: 'Unknown',
        drivers: [],
        recommendation: 'No data available for this screening type.'
    };

    const chartData = {
        labels: (activeData.drivers || []).map(d => d.feature.replace(/_/g, ' ')),
        datasets: [
            {
                label: 'Risk Driving Impact (SHAP)',
                data: (activeData.drivers || []).map(d => d.impact),
                backgroundColor: (activeData.drivers || []).map(d => d.impact > 0 ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.6)'),
                borderRadius: 6,
                barThickness: 20
            },
        ],
    };

    const chartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#f8fafc', font: { weight: '500' } } }
        }
    };

    const getRiskClass = (category) => {
        const cat = category.toLowerCase();
        if (cat.includes('high')) return 'risk-high';
        if (cat.includes('moderate')) return 'risk-moderate';
        return 'risk-low';
    };

    const experts = [
        { id: 'lung_cancer', name: 'Lung Cancer', icon: <Wind size={16} /> },
        { id: 'diabetes', name: 'Diabetes', icon: <Droplets size={16} /> },
        { id: 'covid19', name: 'COVID-19', icon: <Thermometer size={16} /> },
        { id: 'heart_disease', name: 'Heart Disease', icon: <Activity size={16} /> },
        { id: 'kidney_disease', name: 'Kidney Disease', icon: <Info size={16} /> },
        { id: 'stroke', name: 'Stroke', icon: <Target size={16} /> },
        { id: 'dementia', name: 'Dementia', icon: <Brain size={16} /> },
        { id: 'respiratory_disease', name: 'Respiratory Disease', icon: <Wind size={16} /> }
    ];

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Patient Health Overview</h3>
                    <div className="patient-meta-row">
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                            Patient: <strong>{patient_name}</strong> • Age: <strong>{age}</strong>
                        </p>
                        <div className="vitals-input-group">
                           <input 
                             type="number" 
                             className="vitals-mini-input" 
                             placeholder="BMI" 
                             value={editVitals.bmi} 
                             onChange={(e) => setEditVitals({...editVitals, bmi: e.target.value})}
                           />
                           <input 
                             type="number" 
                             className="vitals-mini-input" 
                             placeholder="Glucose" 
                             value={editVitals.glucose} 
                             onChange={(e) => setEditVitals({...editVitals, glucose: e.target.value})}
                           />
                           <input 
                             type="number" 
                             className="vitals-mini-input" 
                             placeholder="HR" 
                             value={editVitals.heart_rate} 
                             onChange={(e) => setEditVitals({...editVitals, heart_rate: e.target.value})}
                           />
                           <button 
                             onClick={handleUpdateVitals} 
                             disabled={isUpdating}
                             className="vitals-save-btn"
                           >
                             {isUpdating ? '...' : <Save size={12} />}
                           </button>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 600 }}>System Integrity</p>
                    <div className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }}></div>
                        Engines Synchronized
                    </div>
                </div>
            </div>

            {/* Disease Summary Cards */}
            <div className="disease-summary-grid">
                {experts.map(exp => {
                    const data = predictions[exp.id];
                    if (!data) return (
                        <div key={exp.id} className="risk-summary-card" style={{ opacity: 0.5 }}>
                            <div className="icon-box" style={{ background: 'rgba(255,255,255,0.05)' }}>{exp.icon}</div>
                            <p className="exp-label">{exp.name}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)' }}>Data Unavailable</span>
                        </div>
                    );

                    return (
                        <div
                            key={exp.id}
                            onClick={() => setActiveExpert(exp.id)}
                            className={`risk-summary-card ${activeExpert === exp.id ? 'active' : ''}`}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div className="icon-box" style={{ background: activeExpert === exp.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}>
                                    {exp.icon}
                                </div>
                                <span className={`risk-tag ${getRiskClass(data.category || 'unknown')}`}>
                                    {(data.category || 'Unknown').split(' ')[0]}
                                </span>
                            </div>
                            <p className="exp-label">{exp.name}</p>
                            <h4 className="exp-score">{(data.score * 100).toFixed(0)}%</h4>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Analysis Area */}
            <div className="analysis-detail-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '1rem' }}>
                        <TrendingUp size={18} />
                        Detailed Profile: {experts.find(e => e.id === activeExpert).name}
                    </h4>
                    <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                        Model: XGBoost v2.1 • Feature Set: SHAP Optimized
                    </div>
                </div>

                <div className="analysis-grid-container">
                    <div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={14} />
                            XAI Feature Attribution (SHAP Impact)
                        </p>
                        <div style={{ height: '220px' }}>
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>Clinical Strategy</p>
                            <div style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', color: '#e2e8f0' }}>{activeData.recommendation}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <p style={{ fontSize: '0.7rem', color: '#475569' }}>Confidence Score: <span style={{ color: '#94a3b8' }}>{(activeData.score * 100).toFixed(2)}%</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileJson size={14} />
                    Comprehensive HL7 FHIR Stream
                </h4>
                <pre style={{ fontSize: '0.7rem', background: '#0b0f1a', padding: '1rem', borderRadius: '0.75rem', overflow: 'auto', maxHeight: '100px', border: '1px solid rgba(255,255,255,0.03)', color: '#475569' }}>
                    {JSON.stringify(fhir_report, null, 2)}
                </pre>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .risk-summary-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 1rem;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .risk-summary-card:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateY(-2px);
                }
                .risk-summary-card.active {
                    background: rgba(0, 210, 255, 0.05);
                    border-color: var(--primary);
                    box-shadow: 0 4px 20px rgba(0, 210, 255, 0.1);
                }
                .exp-label { font-size: 0.8rem; color: #94a3b8; margin: 0; }
                .exp-score { font-size: 1.5rem; margin: 0.25rem 0 0 0; }
                .risk-tag { font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 2rem; font-weight: 600; text-transform: uppercase; }
                .risk-high { background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }
                .risk-moderate { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
                .risk-low { background: rgba(16, 185, 129, 0.15); color: #10b981; }
                .analysis-detail-box {
                    background: rgba(0,0,0,0.15);
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                }
                .icon-box {
                    width: 32px;
                    height: 32px;
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .vitals-mini-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    padding: 2px 8px;
                    color: #f8fafc;
                    font-size: 0.75rem;
                    width: 65px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .vitals-mini-input:focus {
                    border-color: var(--primary);
                    background: rgba(255,255,255,0.1);
                }
                .vitals-save-btn {
                    background: var(--primary);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.2s;
                }
                .vitals-save-btn:hover {
                    opacity: 0.8;
                }
                .vitals-save-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .disease-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .analysis-grid-container {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .patient-meta-row {
                    display: flex;
                    gap: 1.5rem;
                    margin-top: 0.5rem;
                    align-items: center;
                }
                .vitals-input-group {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }
                @media (max-width: 900px) {
                    .disease-summary-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .analysis-grid-container {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 640px) {
                    .disease-summary-grid {
                        grid-template-columns: 1fr;
                    }
                    .patient-meta-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .vitals-input-group {
                        flex-wrap: wrap;
                    }
                    .vitals-mini-input {
                        width: 60px;
                    }
                }
            `}} />
        </div>
    );
};

export default Dashboard;
