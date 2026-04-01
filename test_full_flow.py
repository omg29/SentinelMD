from backend.ml_core import ExpertRegistry
from pydantic import BaseModel
from typing import Dict, Any

class IntakeRequest(BaseModel):
    screening_type: str
    patient_data: Dict[str, Any]

def test_full_flow():
    registry = ExpertRegistry()
    raw_data = {
        "screening_type": "covid19",
        "patient_data": {
            "cough": 1,
            "fever": 1,
            "sore_throat": 1,
            "shortness_of_breath": 1,
            "head_ache": 1,
            "age_60_and_above": 1,
            "gender": 1
        }
    }
    
    # Validate with Pydantic
    req = IntakeRequest(**raw_data)
    print("Pydantic validation: SUCCESS")
    
    # Predict
    print(f"Predicting for: {req.screening_type}")
    prediction = registry.predict(req.screening_type, req.patient_data)
    print("Prediction Result:", prediction)

if __name__ == "__main__":
    test_full_flow()
