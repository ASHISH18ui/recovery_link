import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_e2e_test():
    client = httpx.Client(timeout=10.0)
    print("==================================================")
    print("RECOVERLINK: END-TO-END FLOW VERIFICATION")
    print("==================================================")

    # 1. Health check
    print("\n1. Testing Backend Health...")
    res = client.get("http://127.0.0.1:8000/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ Backend is healthy:", res.json()["status"])

    # 2. Staff Login
    print("\n2. Logging in as Dr. Arthur Chen (Lead Orthopedic Surgeon)...")
    res = client.post(f"{BASE_URL}/auth/login", json={
        "email": "dr.chen@recoverlink.com",
        "password": "doctor123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    login_data = res.json()
    token = login_data["access_token"]
    doctor_id = login_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ Authenticated successfully! Staff: {login_data['user']['full_name']} ({login_data['user']['role']})")

    # 3. Check Dashboard Stats before new discharge
    print("\n3. Inspecting Initial Hospital Monitoring Dashboard...")
    res = client.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    print(f"✓ Initial Monitored Patients: {stats['total_discharged_patients']}")
    print(f"✓ Completed Today: {stats['completed_today']}")
    print(f"✓ Requiring Clinical Review: {stats['requiring_review']}")

    # 4. Module 1: Discharge Management
    print("\n4. Creating New Patient Discharge Record (Module 1)...")
    discharge_payload = {
        "full_name": "Eleanor Rigby",
        "phone": "+1 (555) 777-9911",
        "email": "eleanor.rigby@example.com",
        "date_of_birth": "1968-03-14",
        "gender": "Female",
        "emergency_contact": "John Rigby (Brother) +1 (555) 777-9912",
        "mrn": "MRN-33881",
        "diagnosis": "Severe Tricompartmental Knee Osteoarthritis",
        "surgical_procedure": "Right Total Knee Arthroplasty (TKA)",
        "treating_doctor_id": doctor_id,
        "discharge_instructions": "Ice surgical knee 20 mins every 2 hrs. Keep dressing clean and dry. Report fever or sudden severe swelling.",
        "follow_up_date": "2026-11-12T10:00:00Z",
        "medications": [
            {"name": "Enoxaparin", "dosage": "40mg", "frequency": "Once daily subcutaneous", "purpose": "DVT Prophylaxis"},
            {"name": "Paracetamol", "dosage": "1000mg", "frequency": "Every 6 hours", "purpose": "Analgesia"},
            {"name": "Oxycodone", "dosage": "5mg", "frequency": "Every 4-6 hrs as needed", "purpose": "Breakthrough Pain"}
        ]
    }
    res = client.post(f"{BASE_URL}/discharges", json=discharge_payload, headers=headers)
    assert res.status_code == 200, f"Discharge failed: {res.text}"
    discharge_res = res.json()
    patient_token = discharge_res["patient_token"]
    patient_id = discharge_res["patient_id"]
    print(f"✓ Discharge created! Patient ID: {patient_id}")
    print(f"✓ Generated Secure Token: {patient_token}")
    print(f"✓ Simulated Patient Link: {discharge_res['patient_link']}")
    print(f"✓ Simulated WhatsApp/SMS Message Bubble:\n  \"{discharge_res['simulated_message']}\"")

    # 5. Module 2: Patient Recovery Portal Access (Tokenized link, NO password)
    print("\n5. Patient Opens Secure Link on Mobile (Module 2)...")
    res = client.get(f"{BASE_URL}/checkins/portal-info/{patient_token}")
    assert res.status_code == 200, f"Portal access failed: {res.text}"
    portal_info = res.json()
    print(f"✓ Portal loaded for: {portal_info['patient_name']}")
    print(f"✓ Procedure: {portal_info['procedure']}")
    print(f"✓ Prescribed Meds: {[m['name'] for m in portal_info['medications']]}")
    print(f"✓ Today completed: {portal_info['today_completed']}")

    # 6. Patient Submits Concerning Recovery Check-In
    print("\n6. Patient Submits Daily Recovery Check-in (Elevated Pain + Fever + Swelling + Callback)...")
    checkin_payload = {
        "pain_level": 8,
        "has_fever": True,
        "temperature": 38.3,
        "has_swelling": True,
        "swelling_details": "Tense swelling and redness around knee incision",
        "eating_normally": True,
        "sleeping_normally": False,
        "moving_normally": False,
        "medication_taken": False,
        "missed_medication_reason": "Nauseous after previous dose",
        "new_symptoms": "Throbbing incision site and shivering chills",
        "callback_requested": True,
        "callback_reason": "Temperature is 38.3 and pain is very severe"
    }
    res = client.post(f"{BASE_URL}/checkins/submit/{patient_token}", json=checkin_payload)
    assert res.status_code == 200, f"Checkin submit failed: {res.text}"
    checkin_res = res.json()
    print(f"✓ Check-in recorded! ID: {checkin_res['id']}")
    print(f"✓ AI Risk Classification: {checkin_res['ai_risk_level'].upper()}")
    print(f"✓ AI Summary: \"{checkin_res['ai_summary']}\"")
    print(f"✓ Clinical Flags ({len(checkin_res['ai_flags'])} detected):")
    for f in checkin_res['ai_flags']:
        print(f"   - {f}")

    # 7. Module 3: Hospital Monitoring Dashboard Alerts Queue
    print("\n7. Care Team Receives Alert on Hospital Dashboard (Module 3)...")
    res = client.get(f"{BASE_URL}/dashboard/alerts?status_filter=pending", headers=headers)
    assert res.status_code == 200
    alerts = res.json()
    eleanor_alert = next((a for a in alerts if a["patient_id"] == patient_id), None)
    assert eleanor_alert is not None, "Alert was not created for concerning check-in!"
    print(f"✓ Alert Found in Queue! Alert ID: {eleanor_alert['id']}")
    print(f"✓ Alert Summary: {eleanor_alert['summary']}")
    print(f"✓ Priority: {eleanor_alert['risk_level'].upper()} | Status: {eleanor_alert['status'].upper()}")

    # 8. Clinician Decides Action
    print("\n8. Dr. Chen Reviews Alert & Records Clinical Intervention...")
    action_payload = {
        "action": "call_patient",
        "notes": "Spoke directly with Eleanor. Advised leg elevation, ice application, and taking anti-emetic. Arranged urgent morning surgical clinic review with Dr. Chen at 09:30."
    }
    res = client.post(f"{BASE_URL}/alerts/{eleanor_alert['id']}/action", json=action_payload, headers=headers)
    assert res.status_code == 200, f"Action failed: {res.text}"
    updated_alert = res.json()
    print(f"✓ Alert Status: {updated_alert['status'].upper()}")
    print(f"✓ Action Recorded: {updated_alert['action_taken']}")
    print(f"✓ Reviewed By: {updated_alert['acknowledged_by_name']}")

    # 9. Verify Patient Timeline & Pain History
    print("\n9. Verifying Patient Recovery Timeline & Detail View...")
    res = client.get(f"{BASE_URL}/patients/{patient_id}", headers=headers)
    assert res.status_code == 200
    patient_detail = res.json()
    print(f"✓ Check-ins on timeline: {len(patient_detail['checkins'])}")
    print(f"✓ Alerts on record: {len(patient_detail['alerts'])}")
    print(f"✓ Latest Pain Score: {patient_detail['checkins'][0]['pain_level']}/10")

    # 10. Module 5: Notifications Log
    print("\n10. Inspecting Notification Dispatch Log (Module 5)...")
    res = client.get(f"{BASE_URL}/notifications?patient_id={patient_id}", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    print(f"✓ Total notifications logged for Eleanor: {len(notifs)}")
    for n in notifs:
        print(f"   [{n['channel'].upper()} - {n['notification_type']}]: {n['message'][:80]}...")

    # 11. Audit Logs Check
    print("\n11. Inspecting Compliance Audit Log...")
    res = client.get(f"{BASE_URL}/audit-logs?limit=5", headers=headers)
    assert res.status_code == 200
    audit_logs = res.json()
    print(f"✓ Recent Audit Events:")
    for al in audit_logs[:3]:
        print(f"   [{al['action']}] by {al['user_name']}: {al['details']}")

    # 12. Frontend accessibility check
    print("\n12. Testing Frontend Web App Accessibility...")
    frontend_res = client.get("http://localhost:3000")
    assert frontend_res.status_code == 200, "Frontend is not reachable!"
    print("✓ Frontend is serving on http://localhost:3000")

    print("\n==================================================")
    print("ALL 12 END-TO-END FLOW VERIFICATION CHECKS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_test()

