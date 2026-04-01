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
        if (!validate()) return;

        setIsAnalyzing(true);
        try {
            // Convert empty strings to null for backend
            const sanitizedData = { ...clinicalData };
            ['glucose', 'bmi', 'heart_rate'].forEach(key => {
                if (sanitizedData[key] === '') sanitizedData[key] = null;
                else sanitizedData[key] = parseFloat(sanitizedData[key]);
            });

            const response = await axios.post('http://localhost:8000/predict', {
                patient_name: patientInfo.name,
                dob: patientInfo.dob,
                gender: patientInfo.gender,
                patient_data: sanitizedData
            }, { timeout: 30000 });
            onResult(response.data);
        } catch (err) {
            console.error(err);
            setError("Analysis Core Timeout. Verify engine connectivity.");
        } finally {
            setIsAnalyzing(false);
        }
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
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-section-title">
                    <User size={14} />
                    Personal Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
            `}} />
        </div >
    );
};

export default IntakePortal;
