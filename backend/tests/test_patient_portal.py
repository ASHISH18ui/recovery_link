import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

def test_patient_login_success():
    res = client.post("/patient-api/login", json={
        "username": "+1 (555) 234-5678",
        "password": "patient123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["patient_name"] == "Robert Vance"

def test_patient_token_rejected_on_staff_endpoint():
    # Login as patient
    login_res = client.post("/patient-api/login", json={
        "username": "+1 (555) 234-5678",
        "password": "patient123"
    })
    token = login_res.json()["access_token"]

    # Try accessing staff-only endpoint
    res = client.get("/api/v1/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Staff access required" in res.json()["detail"]

def test_staff_token_rejected_on_patient_endpoint():
    # Staff login
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "dr.chen@aftercare.com",
        "password": "doctor123"
    })
    staff_token = staff_login.json()["access_token"]

    # Try accessing patient-only endpoint
    res = client.get("/patient-api/me", headers={"Authorization": f"Bearer {staff_token}"})
    assert res.status_code == 403
    assert "Patient access required" in res.json()["detail"]

def test_patient_me_endpoint():
    login_res = client.post("/patient-api/login", json={
        "username": "+1 (555) 234-5678",
        "password": "patient123"
    })
    token = login_res.json()["access_token"]

    res = client.get("/patient-api/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "patient" in data
    assert "recovery" in data
    assert "today_tasks" in data
    assert data["patient"]["full_name"] == "Robert Vance"

def test_patient_emergency_trigger():
    login_res = client.post("/patient-api/login", json={
        "username": "+1 (555) 234-5678",
        "password": "patient123"
    })
    token = login_res.json()["access_token"]

    res = client.post(
        "/patient-api/emergency",
        json={"description": "Test sudden severe pain"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "Emergency alert sent" in res.json()["message"]
