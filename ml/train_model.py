from backend.ml_core import LCExpertModel, DiabetesExpertModel, CovidExpertModel, HeartDiseaseExpertModel, KidneyDiseaseExpertModel, StrokeExpertModel, DementiaExpertModel
import os
import pandas as pd
import numpy as np

def run_trainer():
    experts = {
        'lung_cancer': LCExpertModel(),
        'diabetes': DiabetesExpertModel(),
        'covid19': CovidExpertModel(),
        'heart_disease': HeartDiseaseExpertModel(),
        'kidney_disease': KidneyDiseaseExpertModel(),
        'stroke': StrokeExpertModel(),
        'dementia': DementiaExpertModel()
    }
    
    os.makedirs('models', exist_ok=True)
    
    for key, expert in experts.items():
        csv_path = f'ml/data/{key}_dataset.csv'
        if not os.path.exists(csv_path):
            print(f"Warning: {csv_path} not found. Skipping {key}.")
            continue
            
        print(f"\n--- Training {expert.name} Model ---")
        
        # Define mappings based on dataset inspections
        if key == 'lung_cancer':
            mapping = {f: [f.replace('_', ' ')] for f in expert.feature_names}
            target = ['cancer', 'LUNG_CANCER']
        elif key == 'diabetes':
            mapping = {f: [f.replace('_', '')] for f in expert.feature_names}
            # Special case for blood_pressure -> BloodPressure
            mapping['blood_pressure'] = ['BloodPressure']
            target = ['outcome', 'diagnosis']
        elif key == 'covid19':
            mapping = {f: [f] for f in expert.feature_names}
            target = ['corona_result', 'result']
        elif key == 'heart_disease':
             mapping = {
                'age': ['age'], 'gender': ['sex'], 'cp': ['cp'], 'trestbps': ['trestbps'],
                'chol': ['chol'], 'fbs': ['fbs'], 'restecg': ['restecg'], 'thalach': ['thalach'],
                'exang': ['exang'], 'oldpeak': ['oldpeak'], 'slope': ['slope'], 'ca': ['ca'],
                'thal': ['thal']
            }
             target = ['target']
        elif key == 'stroke':
              # Stroke dataset preprocessing
              mapping = {f: [f] for f in expert.feature_names}
              target = ['stroke']
        elif key == 'dementia':
              # Dementia dataset preprocessing
              mapping = {f: [f] for f in expert.feature_names}
              target = ['dementia', 'dementia_all']
        elif key == 'kidney_disease':
             # Preprocess step due to dirty data (text values, ?, tabs)
             try:
                 df = pd.read_csv(csv_path)
                 # Cleaning map
                 replace_map = {
                     'normal': 0, 'abnormal': 1,
                     'present': 1, 'notpresent': 0,
                     'yes': 1, 'no': 0,
                     'good': 0, 'poor': 1,
                     'ckd': 1, 'notckd': 0,
                     'ckd\t': 1, '\tyes': 1, ' yes': 1
                 }
                 # Apply replacement to whole dataframe for simplicity (safe for this dataset)
                 df = df.replace(replace_map)
                 df = df.replace(['?', '\t?'], np.nan)
                 
                 # Ensure numeric (coerces strings that look like numbers but had junk)
                 for col in df.columns:
                     df[col] = pd.to_numeric(df[col], errors='coerce')
                 
                 # Fill NaN with mode (most frequent)
                 for col in df.columns:
                     df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)
                 
                 # Save cleaned version
                 clean_path = f'ml/data/{key}_dataset_clean.csv'
                 df.to_csv(clean_path, index=False)
                 csv_path = clean_path
                 
                 # Identity mapping since we cleaned it to match features exactly
                 mapping = {f: [f] for f in expert.feature_names}
                 # Special Mapping for specific columns if names differ 
                 # (In ml_core we used standard names, in CSV they are short like 'sg', 'al')
                 # Actually, expert.feature_names uses 'bp', 'sg', 'al' which MATCH the CSV headers.
                 # So identity mapping is correct.
                 target = ['classification']
             except Exception as e:
                 print(f"Error preprocessing kidney data: {e}")
                 continue
            
        expert.train_on_csv(csv_path, mapping, target)
        print(f"Success: {expert.name} model trained and saved.")

if __name__ == "__main__":
    run_trainer()
