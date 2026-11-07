import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Clinician review required" in data["disclaimer"]

def test_login_successful():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "dr.chen@aftercare.com", "password": "doctor123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "dr.chen@aftercare.com"
    assert data["user"]["role"] == "doctor"

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "dr.chen@aftercare.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_dashboard_stats():
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "dr.chen@aftercare.com", "password": "doctor123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/dashboard/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_discharged_patients"] >= 8
    assert stats["requiring_review"] >= 2  # Robert Vance & Margaret Davis

def test_patient_portal_token_access():
    # Robert Vance's token
    token = "token-robert-vance-high-risk"
    res = client.get(f"/api/v1/checkins/portal-info/{token}")
    assert res.status_code == 200
    data = res.json()
    assert data["patient_name"] == "Robert Vance"
    assert "medications" in data
    assert len(data["medications"]) > 0

def test_patient_portal_invalid_token():
    res = client.get("/api/v1/checkins/portal-info/invalid-token-123")
    assert res.status_code == 404

