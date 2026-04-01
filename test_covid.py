from backend.ml_core import ExpertRegistry
import os

def test_covid_prediction():
    registry = ExpertRegistry()
    data = {
        "cough": 1,
        "fever": 1,
        "sore_throat": 1,
        "shortness_of_breath": 1,
        "head_ache": 1,
        "age_60_and_above": 1,
        "gender": 1
    }
    
    print("Testing COVID-19 Prediction...")
    try:
        result = registry.predict("covid19", data)
        print("Result:", result)
    except Exception as e:
        print("Error during prediction:", e)

if __name__ == "__main__":
    test_covid_prediction()
