import React, { useState } from 'react';
import axios from 'axios';
import { User, ClipboardList, Activity, Check, Send, AlertCircle, ChevronDown, Droplets, Wind, Thermometer, Calendar } from 'lucide-react';

const IntakePortal = ({ onResult }) => {
    const [patientInfo, setPatientInfo] = useState({
        name: '',
        dob: '',
        gender: 1 // 1 for Male, 0 for Female
    });

    const [clinicalData, setClinicalData] = useState({
        // Common Symptoms
        smoking: 0, coughing: 0, fever: 0, sore_throat: 0, 
        head_ache: 0, chest_pain: 0, fatigue: 0, wheezing: 0, 
        allergy: 0, memory_loss: 0, confusion: 0,
        // Common Vitals
        glucose: '',
        bmi: '',
        heart_rate: ''
    });

    const [error, setError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const validate = () => {
        if (!patientInfo.name || !patientInfo.dob) {
            setError("Clinical Requirement: Patient Name and Date of Birth are mandatory.");
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate() || isAnalyzing) return;

        setIsAnalyzing(true);
        setError('');

        const sanitizedData = { ...clinicalData };
        ['glucose', 'bmi', 'heart_rate'].forEach(key => {
            if (sanitizedData[key] === '') sanitizedData[key] = null;
            else sanitizedData[key] = parseFloat(sanitizedData[key]);
        });

        const getBaseUrl = () => {
            if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
            if (typeof window !== 'undefined') return window.location.origin;
            return '';
        };
        const API_URL = getBaseUrl();
        
        // Retry logic implementation
        const attemptRequest = async (retries = 3, backoff = 1000) => {
            try {
                const response = await axios.post(`${API_URL}/api/generate-report`, {
                    patient_name: patientInfo.name,
                    dob: patientInfo.dob,
                    gender: patientInfo.gender,
                    patient_data: sanitizedData
                }, { 
                    timeout: 60000,
                    headers: { 'Content-Type': 'application/json' }
                });
                onResult(response.data);
            } catch (err) {
                if (retries > 0 && (!err.response || err.response.status >= 500)) {
                    console.log(`Retrying... attempts left: ${retries}`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    return attemptRequest(retries - 1, backoff * 2);
                }
                const errorMessage = err.response?.data?.detail || err.message || "Unknown Error";
                console.error("Diagnostic Engine Failure:", err);
                
                if (err.code === 'ECONNABORTED') {
                    setError(`TIMEOUT ERROR (60s): The clinical engine failed to respond in time. Output: ${errorMessage}`);
                } else {
                    setError(`CONNECTIVITY ERROR: Analysis core unreachable at ${API_URL}. Raw Error: ${errorMessage}`);
                }
            } finally {
                setIsAnalyzing(false);
            }
        };

        await attemptRequest();
    };

    const renderToggle = (field, label) => {
        return (
            <div
                className={`toggle-item ${clinicalData[field] ? 'active' : ''}`}
                onClick={() => setClinicalData(prev => ({ ...prev, [field]: prev[field] === 0 ? 1 : 0 }))}
            >
                <span style={{ fontSize: '0.85rem' }}>{label}</span>
                <div className="checkbox-visual">
                    {clinicalData[field] === 1 && <Check size={12} color="white" />}
                </div>
            </div>
        );
    };

    return (
        <div className="glass-card">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                    <ClipboardList size={20} color="#00d2ff" />
                    Unified Health Assessment
                </h3>
                <div className="status-badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    Multi-Engine Mode Active
                </div>
            </div>

            {error && (
                <div style={{ 
                    background: 'rgba(244, 63, 94, 0.2)', 
                    border: '2px solid var(--accent-rose)', 
                    color: 'white', 
                    padding: '1rem', 
                    borderRadius: '1rem', 
                    marginBottom: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.5rem', 
                    fontSize: '0.85rem',
                    boxShadow: '0 8px 32px rgba(244, 63, 94, 0.3)',
                    animation: 'shake 0.4s ease-in-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <AlertCircle size={20} />
                        DIAGNOSTIC ENGINE FAULT
                    </div>
                    <div style={{ opacity: 0.9, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-section-title">
                    <User size={14} />
                    Personal Information
                </div>

                <div className="personal-info-grid">
                    <div className="form-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="input-field"
                            value={patientInfo.name}
                            onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Date of Birth</label>
                        <input
                            type="date"
                            className="input-field"
                            value={patientInfo.dob}
                            onChange={(e) => setPatientInfo({ ...patientInfo, dob: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Gender</label>
                        <select
                            className="input-field"
                            value={patientInfo.gender}
                            onChange={(e) => setPatientInfo({ ...patientInfo, gender: parseInt(e.target.value) })}
                        >
                            <option value={1}>Male</option>
                            <option value={0}>Female</option>
                        </select>
                    </div>
                </div>

                <div className="form-section-title">
                    <ClipboardList size={14} />
                    Common Symptoms
                </div>

                <div className="toggle-grid" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                    {renderToggle('smoking', 'Smoking')}
                    {renderToggle('coughing', 'Chronic Cough')}
                    {renderToggle('fever', 'Fever')}
                    {renderToggle('sore_throat', 'Sore Throat')}
                    {renderToggle('head_ache', 'Headache')}
                    {renderToggle('chest_pain', 'Chest Pain')}
                    {renderToggle('fatigue', 'Fatigue')}
                    {renderToggle('wheezing', 'Wheezing')}
                    {renderToggle('allergy', 'Allergies')}
                    {renderToggle('allergy', 'Allergies')}
                    {renderToggle('memory_loss', 'Memory Loss')}
                    {renderToggle('confusion', 'Confusion')}
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isAnalyzing}
                    style={{ marginTop: '2rem', zIndex: 9999, position: 'relative', width: '100%', pointerEvents: 'auto', cursor: isAnalyzing ? 'wait' : 'pointer' }}
                >
                    {isAnalyzing ? (
                        <span>Cross-Referencing All Diagnostic Engines...</span>
                    ) : (
                        <>
                            Generate Comprehensive Diagnostic Report
                            <Send size={16} />
                        </>
                    )}
                </button>
            </form >
            <style dangerouslySetInnerHTML={{
                __html: `
                .glass-card {
                    isolation: isolate;
                }
                .input-label {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-dim);
                    margin-bottom: 0.4rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .personal-info-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                @media (max-width: 640px) {
                    .personal-info-grid {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }
                    .toggle-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @media (hover: hover) {
                    .toggle-item:hover { background: rgba(255, 255, 255, 0.06); }
                }
                /* Ensure touch targets are reactive */
                .btn-primary:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                }
            `}} />
        </div >
    );
};

export default IntakePortal;
