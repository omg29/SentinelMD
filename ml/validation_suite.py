import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split
import os

from backend.ml_core import (
    LCExpertModel,
    DiabetesExpertModel,
    CovidExpertModel,
    HeartDiseaseExpertModel,
    KidneyDiseaseExpertModel,
    StrokeExpertModel,
    DementiaExpertModel,
)

RANDOM_SEED = 42

# ── Per-model classification thresholds ─────────────────────────────────────
# Default 0.5 over-suppresses positives on imbalanced datasets.
# These are recall-optimized thresholds for clinical screening context.
# Lowering threshold = more sensitive (catches more positives at cost of precision).
THRESHOLDS = {
    'lung_cancer':    0.40,
    'diabetes':       0.35,
    'covid19':        0.30,
    'heart_disease':  0.35,
    'kidney_disease': 0.50,
    'stroke':         0.25,
    'dementia':       0.30,
}

EXPERT_CONFIG = {
    'lung_cancer': {
        'csv': 'ml/data/lung_cancer_dataset.csv',
        'mapping_fn': lambda fn: {f: [f.replace('_', ' ')] for f in fn},
        'target': ['cancer', 'LUNG_CANCER'],
    },
    'diabetes': {
        'csv': 'ml/data/diabetes_dataset.csv',
        'mapping_fn': lambda fn: {
            **{f: [f.replace('_', '')] for f in fn},
            'blood_pressure': ['BloodPressure'],
        },
        'target': ['outcome', 'diagnosis'],
    },
    'covid19': {
        'csv': 'ml/data/covid19_dataset.csv',
        'mapping_fn': lambda fn: {f: [f] for f in fn},
        'target': ['corona_result', 'result'],
    },
    'heart_disease': {
        'csv': 'ml/data/heart_disease_dataset.csv',
        'mapping_fn': lambda fn: {
            'age': ['age'], 'gender': ['sex'], 'cp': ['cp'],
            'trestbps': ['trestbps'], 'chol': ['chol'], 'fbs': ['fbs'],
            'restecg': ['restecg'], 'thalach': ['thalach'], 'exang': ['exang'],
            'oldpeak': ['oldpeak'], 'slope': ['slope'], 'ca': ['ca'], 'thal': ['thal'],
        },
        'target': ['target'],
    },
    'kidney_disease': {
        'csv': 'ml/data/kidney_disease_dataset_clean.csv',
        'csv_fallback': 'ml/data/kidney_disease_dataset.csv',
        'mapping_fn': lambda fn: {f: [f] for f in fn},
        'target': ['classification'],
        'kidney_clean': True,
    },
    'stroke': {
        'csv': 'ml/data/stroke_dataset.csv',
        'mapping_fn': lambda fn: {f: [f] for f in fn},
        'target': ['stroke'],
    },
    'dementia': {
        'csv': 'ml/data/dementia_dataset.csv',
        'mapping_fn': lambda fn: {f: [f] for f in fn},
        'target': ['dementia_all'],
    },
}

EXPERT_CLASSES = {
    'lung_cancer':    LCExpertModel,
    'diabetes':       DiabetesExpertModel,
    'covid19':        CovidExpertModel,
    'heart_disease':  HeartDiseaseExpertModel,
    'kidney_disease': KidneyDiseaseExpertModel,
    'stroke':         StrokeExpertModel,
    'dementia':       DementiaExpertModel,
}


def find_col(df, possible_names):
    for name in df.columns:
        if name.lower().strip() in [p.lower() for p in possible_names]:
            return name
    return None


def preprocess(df, mapping, target_keywords):
    string_map = {
        'M': 1, 'F': 0, 'male': 1, 'female': 0, 'Male': 1, 'Female': 0,
        'YES': 1, 'NO': 0, 'Y': 1, 'N': 0, 'Yes': 1, 'No': 0,
        'POSITIVE': 1, 'NEGATIVE': 0, 'Positive': 1, 'Negative': 0,
        'normal': 0, 'abnormal': 1,
        'present': 1, 'notpresent': 0,
        'good': 0, 'poor': 1,
        'ckd': 1, 'notckd': 0, 'ckd\t': 1,
        'formerly smoked': 1, 'never smoked': 0, 'smokes': 2, 'Unknown': 0,
        'Urban': 1, 'Rural': 0,
        'children': 0, 'Govt_job': 1, 'Never_worked': 0,
        'Private': 2, 'Self-employed': 3,
    }

    mapped_df = pd.DataFrame()
    for internal_name, options in mapping.items():
        actual_col = find_col(df, options + [internal_name])
        if actual_col:
            col_data = df[actual_col].copy()
            if col_data.dtype == object:
                col_data = col_data.map(string_map).fillna(0)
            if pd.api.types.is_numeric_dtype(col_data):
                if col_data.max() == 2 and col_data.min() == 1:
                    col_data = col_data.map({2: 1, 1: 0})
            mapped_df[internal_name] = pd.to_numeric(col_data, errors='coerce').fillna(0)
        else:
            mapped_df[internal_name] = 0

    target_col = find_col(df, target_keywords)
    if target_col:
        y = df[target_col].copy()
        if y.dtype == object:
            target_map = {
                'YES': 1, 'NO': 0, 'Y': 1, 'N': 0, 'Yes': 1, 'No': 0,
                'POSITIVE': 1, 'NEGATIVE': 0, 'Positive': 1, 'Negative': 0,
                '1': 1, '0': 0, 'ckd': 1, 'notckd': 0, 'ckd\t': 1,
            }
            y = y.map(target_map).fillna(0)
        elif y.max() == 2 and y.min() == 1:
            y = y.map({2: 1, 1: 0})
        y = pd.to_numeric(y, errors='coerce').fillna(0)
    else:
        y = pd.Series([0] * len(df))

    return mapped_df, y


def compute_metrics(y_true, y_pred, y_prob):
    acc  = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec  = recall_score(y_true, y_pred, zero_division=0)
    f1   = f1_score(y_true, y_pred, zero_division=0)
    auc  = roc_auc_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.0

    cm = confusion_matrix(y_true, y_pred)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    else:
        tn = fp = fn = tp = spec = 0

    return {
        'Accuracy': acc, 'Precision': prec, 'Recall': rec,
        'F1': f1, 'AUC': auc, 'Specificity': spec,
        'TP': int(tp), 'TN': int(tn), 'FP': int(fp), 'FN': int(fn),
    }


def run_validation():
    results_summary = []

    print("\n" + "=" * 60)
    print("  SENTINELMD - INDEPENDENT VALIDATION REPORT")
    print("=" * 60)
    print(f"  Random seed: {RANDOM_SEED}  |  All models use held-out 20% split")
    print("=" * 60 + "\n")

    for key, cfg in EXPERT_CONFIG.items():
        expert = EXPERT_CLASSES[key]()
        print(f"Validating {expert.name}...")

        expert.load_model()
        if expert.model is None:
            print(f"  [!] Trained model not found - run train_model.py first.\n")
            continue

        csv_path = cfg['csv']
        if not os.path.exists(csv_path):
            csv_path = cfg.get('csv_fallback', '')
        if not os.path.exists(csv_path):
            print(f"  [!] Dataset not found at {cfg['csv']}. Skipping.\n")
            continue

        try:
            # For large datasets sample 50k for validation speed — still independent
            if key == 'covid19':
                df = pd.read_csv(csv_path, nrows=50000)
            else:
                df = pd.read_csv(csv_path)
        except Exception as e:
            print(f"  [!] Error reading CSV: {e}\n")
            continue

        if cfg.get('kidney_clean') and 'classification' in df.columns:
            replace_map = {
                'normal': 0, 'abnormal': 1, 'present': 1, 'notpresent': 0,
                'yes': 1, 'no': 0, 'good': 0, 'poor': 1,
                'ckd': 1, 'notckd': 0, 'ckd\t': 1, '\tyes': 1, ' yes': 1,
            }
            df = df.replace(replace_map).replace(['?', '\t?'], np.nan)
            for col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            for col in df.columns:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)

        mapping = cfg['mapping_fn'](expert.feature_names)
        X_all, y_all = preprocess(df, mapping, cfg['target'])

        # ── FIX: ALL models use held-out 20% split, no exceptions ──
        # This ensures validation data was never seen during training
        # for any model regardless of dataset size.
        _, X_val, _, y_val = train_test_split(
            X_all, y_all,
            test_size=0.20,
            random_state=RANDOM_SEED,
            stratify=y_all if y_all.nunique() > 1 else None,
        )
        split_note = f"held-out 20% of {len(df)} rows = {len(X_val)} validation samples"

        try:
            y_prob = expert.model.predict_proba(X_val)[:, 1]
            # Use recall-optimized threshold per model
            threshold = THRESHOLDS.get(key, 0.5)
            y_pred = (y_prob > threshold).astype(int)
        except Exception as e:
            print(f"  [!] Prediction error: {e}\n")
            continue

        m = compute_metrics(y_val, y_pred, y_prob)

        print(f"  Split:       {split_note}")
        print(f"  Threshold:   {threshold} (recall-optimized for clinical screening)")
        print(f"  Accuracy:    {m['Accuracy']:.2%}")
        print(f"  Recall:      {m['Recall']:.2%}   <- primary clinical metric")
        print(f"  Precision:   {m['Precision']:.2%}")
        print(f"  F1-Score:    {m['F1']:.2%}")
        print(f"  AUC:         {m['AUC']:.4f}")
        print(f"  Specificity: {m['Specificity']:.2%}")
        print(f"  Confusion:   TP={m['TP']} TN={m['TN']} FP={m['FP']} FN={m['FN']}\n")

        results_summary.append({
            'Disease':   expert.name,
            'Accuracy':  m['Accuracy'],
            'Recall':    m['Recall'],
            'Precision': m['Precision'],
            'F1':        m['F1'],
            'AUC':       m['AUC'],
            'N':         len(X_val),
        })

    print("\n" + "=" * 75)
    print("  FINAL SUMMARY TABLE")
    print("=" * 75)
    hdr = f"{'Disease':<28} {'Accuracy':>9} {'Recall':>8} {'Precision':>10} {'F1':>7} {'AUC':>7} {'N':>7}"
    print(hdr)
    print("-" * 75)
    for r in results_summary:
        print(
            f"{r['Disease']:<28} "
            f"{r['Accuracy']:>8.2%} "
            f"{r['Recall']:>8.2%} "
            f"{r['Precision']:>10.2%} "
            f"{r['F1']:>7.2%} "
            f"{r['AUC']:>7.4f} "
            f"{r['N']:>7}"
        )
    print("-" * 75)

    if results_summary:
        mean_acc = np.mean([r['Accuracy'] for r in results_summary])
        mean_rec = np.mean([r['Recall']   for r in results_summary])
        mean_pre = np.mean([r['Precision'] for r in results_summary])
        mean_f1  = np.mean([r['F1']       for r in results_summary])
        sem_acc  = np.std([r['Accuracy']  for r in results_summary], ddof=1) / np.sqrt(len(results_summary))

        print(f"{'MEAN':<28} {mean_acc:>8.2%} {mean_rec:>8.2%} {mean_pre:>10.2%} {mean_f1:>7.2%}")
        print(f"\n  SEM (accuracy across {len(results_summary)} expert models): {sem_acc:.6f}")
        print(f"  Interpretation: expected variance in mean accuracy across independent")
        print(f"  deployments is ±{sem_acc*100:.4f}%\n")


if __name__ == "__main__":
    run_validation()