# Sentinel MD - Early-Stage Lung Cancer CDSS

## How to Run

### 1. Training the Model
If you want to re-train the model on your dataset:
```powershell
# Ensure you are in the project root
python -m ml.train_model
```

### 2. Running the Backend (FastAPI)
The backend handles the ML inference and FHIR mapping.
```powershell
# Ensure you are in the project root
python -m backend.main
```
The backend will run on `http://localhost:8000`.

### 3. Running the Frontend (React/Vite)
The frontend provides the Intake Portal and Doctor Dashboard.
```powershell
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Folder Structure
- `backend/`: FastAPI application and FHIR utilities.
- `frontend/`: React application (Intake Portal, Dashboard).
- `ml/`: Model training scripts and data.
- `models/`: Saved XGBoost/SHAP model artifacts.
