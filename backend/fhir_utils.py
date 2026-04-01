from datetime import datetime
import uuid

def map_to_fhir_questionnaire_response(data, screening_type="General"):
    """
    Maps intake form data to a HL7 FHIR QuestionnaireResponse JSON.
    """
    response = {
        "resourceType": "QuestionnaireResponse",
        "id": str(uuid.uuid4()),
        "status": "completed",
        "authored": datetime.utcnow().isoformat() + "Z",
        "item": []
    }
    
    # Generic mapping that handles snake_case to Title Case
    for key, value in data.items():
        if key == "screening_type": continue
        
        display_name = key.replace('_', ' ').title()
        
        # Specific overrides for better clinical clarity
        overrides = {
            "bmi": "Body Mass Index (BMI)",
            "pedigree": "Diabetes Pedigree Function",
            "glucose": "Plasma Glucose Concentration"
        }
        
        text = overrides.get(key.lower(), display_name)
        
        response["item"].append({
            "linkId": key,
            "text": text,
            "answer": [{"valueDecimal": float(value)} if isinstance(value, (int, float)) else {"valueString": str(value)}]
        })
            
    return response
