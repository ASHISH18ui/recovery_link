import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal
from app.models.models import Patient, PatientAccount, Hospital
from app.core.security import get_password_hash

client = TestClient(app)

def test_all_five_demo_patients_recovery_plan():
    demo_phones = [
        "+1 (555) 234-5678",
        "+1 (555) 345-6789",
        "+1 (555) 456-7890",
        "+1 (555) 567-8901",
        "+1 (555) 678-9012",
    ]
    for phone in demo_phones:
        res = client.post("/patient-api/login", json={"username": phone, "password": "patient123"})
        assert res.status_code == 200, f"Login failed for {phone}: {res.text}"
        token = res.json()["access_token"]
        pat_name = res.json()["patient_name"]

        plan_res = client.get("/patient-api/recovery-plan", headers={"Authorization": f"Bearer {token}"})
        assert plan_res.status_code == 200, f"Plan failed for {phone}: {plan_res.text}"
        data = plan_res.json()
        assert isinstance(data["days"], list), f"days not list for {phone}"
        assert len(data["days"]) > 0, f"days is empty for {phone}"
        for d in data["days"]:
            assert isinstance(d["warning_signs"], list), f"warning_signs is not list for {phone}: {type(d['warning_signs'])}"
            assert isinstance(d["milestones"], list), f"milestones is not list for {phone}: {type(d['milestones'])}"
            assert isinstance(d["is_completed"], bool)

def test_new_patient_with_no_care_plan():
    db = SessionLocal()
    hosp = db.query(Hospital).first()

    dummy_pat = Patient(
        hospital_id=hosp.id,
        mrn="TEST-NOPLAN-99",
        full_name="New NoPlan Patient",
        phone="+1 (555) 999-9999",
        email="noplan@example.com",
        date_of_birth="1985-05-15",
        gender="Other",
        access_token="token-noplan-99"
    )
    db.add(dummy_pat)
    db.flush()

    dummy_acc = PatientAccount(
        patient_id=dummy_pat.id,
        phone=dummy_pat.phone,
        email=dummy_pat.email,
        hashed_password=get_password_hash("patient123"),
        must_change_password=False,
        is_active=True
    )
    db.add(dummy_acc)
    db.commit()

    try:
        # Test login & recovery plan
        res = client.post("/patient-api/login", json={"username": "+1 (555) 999-9999", "password": "patient123"})
        assert res.status_code == 200
        token = res.json()["access_token"]

        plan_res = client.get("/patient-api/recovery-plan", headers={"Authorization": f"Bearer {token}"})
        assert plan_res.status_code == 200
        data = plan_res.json()
        assert data["care_plan"] is None
        assert data["days"] == []
        assert isinstance(data["days"], list)
    finally:
        db.delete(dummy_acc)
        db.delete(dummy_pat)
        db.commit()
        db.close()
