from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
try:
    from .ml_core import ExpertRegistry
    from .fhir_utils import map_to_fhir_questionnaire_response
except ImportError:
    from ml_core import ExpertRegistry
    from fhir_utils import map_to_fhir_questionnaire_response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI(title="SentinelMD Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
    return response

registry = ExpertRegistry()

class IntakeRequest(BaseModel):
    patient_name: str
    dob: str  # YYYY-MM-DD
    gender: int
    patient_data: Dict[str, Any]

import json
import os
from datetime import datetime

SUBMISSIONS_FILE = 'patient_submissions.json'

def calculate_age(dob_str):
    try:
        birth_date = datetime.strptime(dob_str, '%Y-%m-%d')
        today = datetime.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    except:
        return 0

def save_submission(data):
    submissions = []
    if os.path.exists(SUBMISSIONS_FILE):
        with open(SUBMISSIONS_FILE, 'r') as f:
            try:
                submissions = json.load(f)
            except:
                pass
    submissions.append(data)
    with open(SUBMISSIONS_FILE, 'w') as f:
        json.dump(submissions, f, indent=4)

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/submissions")
async def get_submissions():
    if os.path.exists(SUBMISSIONS_FILE):
        try:
            with open(SUBMISSIONS_FILE, 'r') as f:
                submissions = json.load(f)
                # Migration/Patching: If an old submission is missing new engines, re-calculate them
                for sub in submissions:
                    # Some old records might not have 'predictions' or enough engines
                    current_preds = sub.get('predictions', {})
                    if not current_preds or len(current_preds) < 10:
                        patient_info = sub.get('patient_data', {})
                        unified_payload = {
                            **patient_info,
                            "age": sub.get('age', patient_info.get('age', 0)),
                            "gender": sub.get('gender', patient_info.get('gender', 1)),
                            "patient_name": sub.get('patient_name', 'Unknown'),
                            "dob": sub.get('dob', '')
                        }
                        try:
                            sub['predictions'] = registry.predict_multi(unified_payload)
                        except Exception as e:
                            print(f"Migration error for {sub.get('id')}: {e}")
                return submissions
        except Exception as e:
            print(f"File read error: {e}")
            return []
    return []

@app.post("/api/generate-report")
async def predict(req: IntakeRequest):
    try:
        # Inject age and gender into patient_data for the registry
        calculated_age = calculate_age(req.dob)
        unified_payload = {
            **req.patient_data,
            "age": calculated_age,
            "gender": req.gender,
            "patient_name": req.patient_name,
            "dob": req.dob
        }
        
        # Perform multi-disease prediction
        predictions = registry.predict_multi(unified_payload)
        
        fhir_json = map_to_fhir_questionnaire_response(unified_payload, "Unified Diagnostic Screening")
        
        result = {
            "id": fhir_json["id"],
            "patient_name": req.patient_name,
            "age": calculated_age,
            "timestamp": datetime.now().isoformat(),
            "patient_data": req.patient_data,
            "predictions": predictions,
            "fhir_report": fhir_json
        }
        
        save_submission(result)
        return result
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def update_submission(submission_id, data):
    submissions = []
    if os.path.exists(SUBMISSIONS_FILE):
        with open(SUBMISSIONS_FILE, 'r') as f:
            try:
                submissions = json.load(f)
            except:
                pass
    
    updated = False
    for i, sub in enumerate(submissions):
        if sub['id'] == submission_id:
            # Merge patient data
            if 'patient_data' in data:
                sub['patient_data'].update(data['patient_data'])
            
            # Recalculate age/gender/dob context for prediction
            unified_payload = {
                **sub['patient_data'],
                "age": sub['age'],
                "gender": sub['patient_data'].get('gender', 1),
                "patient_name": sub['patient_name'],
                "dob": sub.get('patient_data', {}).get('dob', '')
            }
            
            # Re-run prediction
            try:
                predictions = registry.predict_multi(unified_payload)
                sub['predictions'] = predictions
                sub['fhir_report'] = map_to_fhir_questionnaire_response(unified_payload, "Unified Diagnostic Screening (Updated)")
                sub['timestamp'] = datetime.now().isoformat()
                submissions[i] = sub
                updated = True
                data = sub # Return full object
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"Re-prediction error: {e}")
            break
            
    if updated:
        with open(SUBMISSIONS_FILE, 'w') as f:
            json.dump(submissions, f, indent=4)
        return data
    return None

class UpdateRequest(BaseModel):
    patient_data: Dict[str, Any]

@app.put("/api/submissions/{submission_id}")
async def update_submission_endpoint(submission_id: str, req: UpdateRequest):
    result = update_submission(submission_id, req.dict())
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
