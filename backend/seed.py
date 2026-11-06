import sys
import os
import json
import secrets
from datetime import datetime, timezone, timedelta

# Ensure python path includes backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine, Base
from app.models.models import (
    Hospital, User, Patient, Admission, DischargeRecord, CarePlan,
    Medication, Checkin, Vital, Alert, Appointment, Notification, AuditLog,
    PatientNote, CarePlanTemplate
)
from app.core.security import get_password_hash
from app.core.config import settings

def seed_database(drop_existing: bool = True):
    if drop_existing:
        print("Initializing schema (dropping existing tables)...")
        Base.metadata.drop_all(bind=engine)
    print("Ensuring schema exists...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not drop_existing and db.query(Hospital).first():
            print("Database already contains data. Skipping auto-seed.")
            return

        print("Creating demo hospital...")
        hospital = Hospital(
            name="St. Jude Orthopedic & Surgical Centre",
            address="450 Healthcare Boulevard, Suite 800",
            phone="+1 (555) 019-8200"
        )
        db.add(hospital)
        db.flush()

        print("Creating clinical staff users...")
        admin = User(
            hospital_id=hospital.id,
            email="admin@recoverlink.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            full_name="Dr. Sandra Bell, MD (Admin)",
            department="Hospital Administration"
        )
        doctor = User(
            hospital_id=hospital.id,
            email="dr.chen@recoverlink.com",
            hashed_password=get_password_hash("doctor123"),
            role="doctor",
            full_name="Dr. Arthur Chen, MD",
            department="Orthopedic & Trauma Surgery"
        )
        doctor2 = User(
            hospital_id=hospital.id,
            email="dr.patel@recoverlink.com",
            hashed_password=get_password_hash("doctor123"),
            role="doctor",
            full_name="Dr. Meera Patel, MD",
            department="Cardiothoracic Surgery"
        )
        nurse1 = User(
            hospital_id=hospital.id,
            email="nurse.sarah@recoverlink.com",
            hashed_password=get_password_hash("nurse123"),
            role="nurse",
            full_name="Sarah Jenkins, BSN, RN",
            department="Post-Surgical Monitoring"
        )
        nurse2 = User(
            hospital_id=hospital.id,
            email="nurse.elena@recoverlink.com",
            hashed_password=get_password_hash("nurse123"),
            role="nurse",
            full_name="Elena Rostova, RN",
            department="Discharge Navigation"
        )
        db.add_all([admin, doctor, doctor2, nurse1, nurse2])
        db.flush()

        print("Creating Care Plan Templates...")
        t1 = CarePlanTemplate(
            name="Total Knee Arthroplasty (TKA) Protocol",
            category="Orthopedics",
            description="14-day intensive monitoring protocol for unilateral/bilateral total knee replacement.",
            duration_days=14,
            checkin_frequency="daily",
            default_instructions="Ice surgical knee 20 mins every 2 hrs. Keep incision clean & dry. Use walker for ambulation. Report fever > 38.0°C immediately.",
            suggested_medications=json.dumps([
                {"name": "Enoxaparin", "dosage": "40mg", "frequency": "Daily subcutaneous", "purpose": "DVT Prophylaxis"},
                {"name": "Oxycodone / Acetaminophen", "dosage": "5mg/325mg", "frequency": "q4-6h prn", "purpose": "Breakthrough Pain"},
                {"name": "Cephalexin", "dosage": "500mg", "frequency": "q6h for 7 days", "purpose": "Antibiotic"}
            ])
        )
        t2 = CarePlanTemplate(
            name="Coronary Artery Bypass Graft (CABG) Pathway",
            category="Cardiology",
            description="21-day sternotomy healing and cardiovascular stability surveillance.",
            duration_days=21,
            checkin_frequency="daily",
            default_instructions="Strict sternal precautions: no lifting > 5 lbs, support chest when coughing. Daily weight & blood pressure logs.",
            suggested_medications=json.dumps([
                {"name": "Aspirin", "dosage": "81mg", "frequency": "Daily morning", "purpose": "Antiplatelet"},
                {"name": "Metoprolol Succinate", "dosage": "50mg", "frequency": "Daily", "purpose": "Rate Control"},
                {"name": "Atorvastatin", "dosage": "40mg", "frequency": "Daily at bedtime", "purpose": "Lipid Management"}
            ])
        )
        t3 = CarePlanTemplate(
            name="Cesarean Section (C-Section) Recovery",
            category="Obstetrics",
            description="14-day postpartum surgical recovery, incision inspection, and pain management.",
            duration_days=14,
            checkin_frequency="daily",
            default_instructions="Keep dressing dry. Check lochia and incision daily. Hydrate well for lactation support.",
            suggested_medications=json.dumps([
                {"name": "Ibuprofen", "dosage": "600mg", "frequency": "q6h with food", "purpose": "Anti-inflammatory"},
                {"name": "Acetaminophen", "dosage": "650mg", "frequency": "q6h alternating", "purpose": "Pain Relief"},
                {"name": "Docusate Sodium", "dosage": "100mg", "frequency": "Twice daily", "purpose": "Stool Softener"}
            ])
        )
        t4 = CarePlanTemplate(
            name="Lumbar Spinal Fusion Protocol",
            category="Spine",
            description="28-day surveillance for neurological symptom onset, brace compliance, and bone healing.",
            duration_days=28,
            checkin_frequency="daily",
            default_instructions="No bending, lifting, or twisting (BLT). Wear rigid lumbar orthosis during ambulation.",
            suggested_medications=json.dumps([
                {"name": "Gabapentin", "dosage": "300mg", "frequency": "Three times daily", "purpose": "Neuropathic Pain"},
                {"name": "Methocarbamol", "dosage": "750mg", "frequency": "TID prn", "purpose": "Muscle Spasms"}
            ])
        )
        t5 = CarePlanTemplate(
            name="Laparoscopic Cholecystectomy Pathway",
            category="General Surgery",
            description="10-day digestive recovery and trocar incision monitoring.",
            duration_days=10,
            checkin_frequency="daily",
            default_instructions="Low fat diet for first 2 weeks. Ambulate gently to dissipate CO2 gas. Report persistent jaundice or shoulder pain.",
            suggested_medications=json.dumps([
                {"name": "Acetaminophen", "dosage": "500mg", "frequency": "q6h prn", "purpose": "Mild Pain"},
                {"name": "Ondansetron", "dosage": "4mg", "frequency": "q8h prn nausea", "purpose": "Antiemetic"}
            ])
        )
        t6 = CarePlanTemplate(
            name="Total Hip Arthroplasty (THA) Pathway",
            category="Orthopedics",
            description="14-day hip dislocation precaution and mobility tracking protocol.",
            duration_days=14,
            checkin_frequency="daily",
            default_instructions="Do not flex hip past 90 degrees or cross legs. Use abduction wedge while resting.",
            suggested_medications=json.dumps([
                {"name": "Apixaban", "dosage": "2.5mg", "frequency": "Twice daily", "purpose": "DVT Prevention"},
                {"name": "Meloxicam", "dosage": "15mg", "frequency": "Daily with food", "purpose": "Anti-inflammatory"}
            ])
        )
        db.add_all([t1, t2, t3, t4, t5, t6])
        db.flush()

        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")

        print("Seeding 15 realistic patients with rich clinical trajectories...")

        # Helper to create patient bundle
        def create_patient_record(
            mrn, name, phone, email, dob, gender, emergency, token_slug,
            diagnosis, doctor_user, procedure, instructions,
            days_ago_admitted, days_ago_discharged, duration_days, follow_up_in_days,
            meds_list, checkins_data, alert_data=None, appointment_data=None, note_text=None
        ):
            pat = Patient(
                hospital_id=hospital.id,
                mrn=mrn,
                full_name=name,
                phone=phone,
                email=email,
                date_of_birth=dob,
                gender=gender,
                emergency_contact=emergency,
                access_token=token_slug,
                token_expires_at=now + timedelta(days=30)
            )
            db.add(pat)
            db.flush()

            adm = Admission(
                patient_id=pat.id,
                admitted_at=now - timedelta(days=days_ago_admitted),
                diagnosis=diagnosis,
                treating_doctor_id=doctor_user.id,
                status="discharged"
            )
            db.add(adm)
            db.flush()

            disc = DischargeRecord(
                admission_id=adm.id,
                discharged_at=now - timedelta(days=days_ago_discharged),
                surgical_procedure=procedure,
                discharge_instructions=instructions,
                discharged_by=doctor_user.id
            )
            db.add(disc)
            db.flush()

            cp = CarePlan(
                discharge_id=disc.id,
                patient_id=pat.id,
                start_date=now - timedelta(days=days_ago_discharged),
                end_date=now + timedelta(days=duration_days - days_ago_discharged),
                follow_up_date=now + timedelta(days=follow_up_in_days),
                status="active"
            )
            db.add(cp)
            db.flush()

            # Add meds
            for m in meds_list:
                db.add(Medication(
                    care_plan_id=cp.id,
                    name=m["name"],
                    dosage=m["dosage"],
                    frequency=m["frequency"],
                    purpose=m["purpose"]
                ))

            # Add checkins
            prev_checkin = None
            for c in checkins_data:
                chk = Checkin(
                    patient_id=pat.id,
                    care_plan_id=cp.id,
                    date=c["date"],
                    submitted_at=c["time"],
                    pain_level=c["pain"],
                    has_fever=c.get("fever", False),
                    temperature=c.get("temp", None),
                    has_swelling=c.get("swelling", False),
                    swelling_details=c.get("swelling_details", None),
                    eating_normally=c.get("eating", True),
                    sleeping_normally=c.get("sleeping", True),
                    moving_normally=c.get("moving", True),
                    medication_taken=c.get("med_taken", True),
                    missed_medication_reason=c.get("missed_reason", None),
                    new_symptoms=c.get("symptoms", None),
                    callback_requested=c.get("callback", False),
                    callback_reason=c.get("callback_reason", None),
                    ai_summary=c.get("summary", "Patient reported checkin status."),
                    ai_risk_level=c.get("risk", "low"),
                    ai_flags=json.dumps(c.get("flags", [])),
                    ai_missing_info=json.dumps(c.get("missing", []))
                )
                db.add(chk)
                db.flush()
                prev_checkin = chk

            # Alert if specified
            if alert_data:
                alt = Alert(
                    patient_id=pat.id,
                    checkin_id=prev_checkin.id if prev_checkin else None,
                    care_plan_id=cp.id,
                    risk_level=alert_data["risk_level"],
                    summary=alert_data["summary"],
                    flags=json.dumps(alert_data.get("flags", [])),
                    status=alert_data.get("status", "pending"),
                    acknowledged_by=alert_data.get("acknowledged_by", None),
                    acknowledged_at=alert_data.get("acknowledged_at", None),
                    action_taken=alert_data.get("action_taken", None),
                    notes=alert_data.get("notes", None)
                )
                db.add(alt)

            # Appointment
            if appointment_data:
                db.add(Appointment(
                    patient_id=pat.id,
                    care_plan_id=cp.id,
                    doctor_id=doctor_user.id,
                    scheduled_at=appointment_data["time"],
                    appointment_type=appointment_data.get("type", "Post-op Follow-up"),
                    status=appointment_data.get("status", "scheduled"),
                    notes=appointment_data.get("notes", "")
                ))

            # Patient Note
            if note_text:
                db.add(PatientNote(
                    patient_id=pat.id,
                    author_id=doctor_user.id,
                    note_type="clinical",
                    content=note_text,
                    created_at=now - timedelta(days=days_ago_discharged)
                ))

            # Initial simulated onboarding notification
            db.add(Notification(
                patient_id=pat.id,
                care_plan_id=cp.id,
                notification_type="onboarding_link",
                channel="whatsapp",
                recipient_contact=pat.phone,
                message=f"Welcome {pat.full_name} to RecoverLink! Your care team at {hospital.name} will check in daily. Start here: {settings.PATIENT_PORTAL_URL}/{pat.access_token}",
                status="simulated",
                link_url=f"{settings.PATIENT_PORTAL_URL}/{pat.access_token}",
                sent_at=now - timedelta(days=days_ago_discharged)
            ))

            return pat

        # --------------------------------------------------------------------
        # PATIENT 1: Robert Vance - HIGH RISK / FLAGGED
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-84910",
            name="Robert Vance",
            phone="+1 (555) 234-5678",
            email="robert.vance@example.com",
            dob="1960-04-12",
            gender="Male",
            emergency="Phyllis Vance (Wife) +1 (555) 234-5679",
            token_slug="token-robert-vance-high-risk",
            diagnosis="Severe Osteoarthritis, Right Knee",
            doctor_user=doctor,
            procedure="Right Total Knee Arthroplasty (TKA)",
            instructions="Ice surgical knee 20 mins every 2 hrs. Keep incision dry. Report fever > 38.0°C immediately.",
            days_ago_admitted=5,
            days_ago_discharged=3,
            duration_days=14,
            follow_up_in_days=4,
            meds_list=[
                {"name": "Enoxaparin", "dosage": "40mg", "frequency": "Daily subcutaneous", "purpose": "DVT Prophylaxis"},
                {"name": "Oxycodone / Acetaminophen", "dosage": "5mg/325mg", "frequency": "q4-6h prn", "purpose": "Breakthrough Pain"},
                {"name": "Cephalexin", "dosage": "500mg", "frequency": "q6h for 7 days", "purpose": "Antibiotic"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Patient reported moderate post-op pain 4/10. Adherent with pain regimen.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 6, "fever": False, "swelling": True, "swelling_details": "Moderate warmth around lower patella",
                    "med_taken": True, "moving": False,
                    "summary": "Patient reports increasing pain 6/10 (+2 pts) and moderate swelling near knee incision.",
                    "risk": "medium",
                    "flags": ["Pain rising 2 points since previous check-in (4/10 → 6/10)", "Swelling noted near surgical site"]
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=2),
                    "pain": 8, "fever": True, "temp": 38.4, "swelling": True, "swelling_details": "Tense swelling, knee feels hot",
                    "med_taken": False, "missed_reason": "Nauseous after morning medication",
                    "moving": False, "sleeping": False,
                    "symptoms": "Chills starting this morning and throbbing knee pain",
                    "callback": True, "callback_reason": "Fever 38.4 and sharp pain around wound",
                    "summary": "URGENT: Patient reports fever (38.4°C), severe pain spike (8/10), tense swelling, and missed antibiotic due to nausea. Clinician callback requested immediately.",
                    "risk": "high",
                    "flags": [
                        "Fever reported (38.4°C) - potential surgical site infection risk",
                        "Pain rising 2 points since previous check-in (6/10 → 8/10)",
                        "Severe acute pain reported (8/10)",
                        "Localized swelling (Tense swelling, knee feels hot) combined with elevated pain",
                        "Missed prescribed medication dose: Nauseous after morning medication",
                        "Patient explicitly requested a clinician callback"
                    ]
                }
            ],
            alert_data={
                "risk_level": "high",
                "summary": "Robert Vance reports fever 38.4°C, rising pain 8/10, hot tense swelling around knee incision, and missed antibiotic.",
                "flags": [
                    "Fever reported (38.4°C)",
                    "Severe pain spike (8/10)",
                    "Hot tense swelling at surgical site",
                    "Omitted prescribed antibiotics due to nausea",
                    "Clinician callback requested"
                ],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=4, hours=2),
                "type": "Post-Op Wound Assessment & Suture Check",
                "status": "scheduled",
                "notes": "Patient advised to come earlier if fever does not subside within 4 hours."
            },
            note_text="High priority review. Sarah (RN) contacted patient to assess wound drainage; arranged for urgent outpatient clinic visit if temperature remains > 38.2°C."
        )

        # --------------------------------------------------------------------
        # PATIENT 2: Margaret Davis - MEDIUM RISK / FLAGGED
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-72314",
            name="Margaret Davis",
            phone="+1 (555) 345-6789",
            email="m.davis@example.org",
            dob="1952-11-20",
            gender="Female",
            emergency="George Davis (Husband) +1 (555) 345-6780",
            token_slug="token-margaret-davis-med-risk",
            diagnosis="Left Femoral Neck Fracture, Anterior Hip",
            doctor_user=doctor,
            procedure="Left Total Hip Arthroplasty (Anterior Approach)",
            instructions="Maintain posterior hip precautions. Walker assistance required. Ice hip 15m TDS.",
            days_ago_admitted=6,
            days_ago_discharged=4,
            duration_days=14,
            follow_up_in_days=3,
            meds_list=[
                {"name": "Apixaban", "dosage": "2.5mg", "frequency": "Twice daily", "purpose": "DVT Prophylaxis"},
                {"name": "Acetaminophen", "dosage": "1000mg", "frequency": "TID", "purpose": "Baseline Analgesia"},
                {"name": "Tramadol", "dosage": "50mg", "frequency": "PRN breakthrough", "purpose": "Moderate Pain"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=3)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=3),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 1 post-op hip replacement: mobilizing well with physical therapy.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 2 post-op: stable baseline, tolerating oral fluids and pain control.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 5, "fever": False, "swelling": True, "swelling_details": "Mild puffiness lateral thigh",
                    "med_taken": True, "moving": True,
                    "summary": "Mild lateral thigh swelling noted, ambulating with walker.",
                    "risk": "low"
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=3),
                    "pain": 7, "fever": False, "swelling": True, "swelling_details": "Thigh feels tight and uncomfortable",
                    "med_taken": True, "moving": False, "sleeping": False,
                    "callback": True, "callback_reason": "Pain kept me awake all night, need advice on pain med timing",
                    "summary": "ATTENTION: Patient reports rising pain (7/10), sleep disturbance, restricted mobility, and requests a nurse callback for medication timing advice.",
                    "risk": "medium",
                    "flags": [
                        "Pain rising 2 points since previous check-in (5/10 → 7/10)",
                        "Elevated pain reported (7/10)",
                        "Localized swelling (Thigh feels tight) combined with elevated pain",
                        "Patient explicitly requested a clinician callback: 'Pain kept me awake all night'"
                    ]
                }
            ],
            alert_data={
                "risk_level": "medium",
                "summary": "Margaret Davis reports pain elevated to 7/10 (+2 pts), impaired sleep, and requested advice on analgesia timing.",
                "flags": [
                    "Pain spike 5/10 → 7/10",
                    "Sleep disruption from pain",
                    "Callback requested regarding pain medication schedule"
                ],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=3, hours=10),
                "type": "Routine Hip Follow-up & X-Ray",
                "status": "scheduled"
            },
            note_text="Nurse Elena reviewed check-in. Called patient at 11:30 AM, advised taking prescribed acetaminophen 1 hour prior to physical therapy and elevating leg on abduction pillow."
        )

        # --------------------------------------------------------------------
        # PATIENT 3: James Wilson - LOW RISK / STABLE DAY 6
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-59123",
            name="James Wilson",
            phone="+1 (555) 456-7890",
            email="j.wilson@example.com",
            dob="1975-08-30",
            gender="Male",
            emergency="Carol Wilson (Wife) +1 (555) 456-7891",
            token_slug="token-james-wilson-stable",
            diagnosis="Symptomatic Cholelithiasis",
            doctor_user=doctor,
            procedure="Laparoscopic Cholecystectomy",
            instructions="Low fat diet for 2 weeks. Keep port sites clean and dry. No lifting over 15 lbs for 4 weeks.",
            days_ago_admitted=7,
            days_ago_discharged=6,
            duration_days=10,
            follow_up_in_days=4,
            meds_list=[
                {"name": "Acetaminophen", "dosage": "500mg", "frequency": "q6h prn", "purpose": "Mild Pain"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i, hours=2),
                    "pain": max(1, 6 - i),
                    "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": f"Day {6-i} recovery normal. Pain diminishing smoothly ({max(1, 6-i)}/10). Diet tolerated.",
                    "risk": "low"
                } for i in range(5, -1, -1)
            ],
            appointment_data={
                "time": now + timedelta(days=4, hours=9),
                "type": "Post-Op Surgical Check & Pathology Review",
                "status": "scheduled"
            },
            note_text="Excellent post-cholecystectomy recovery. Port wounds clean, patient walking 5,000 steps daily."
        )

        # --------------------------------------------------------------------
        # PATIENT 4: Patricia Moore - LOW RISK (C-Section Day 2)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-63901",
            name="Patricia Moore",
            phone="+1 (555) 567-8901",
            email="patricia.m@example.net",
            dob="1992-03-14",
            gender="Female",
            emergency="Mark Moore (Husband) +1 (555) 567-8902",
            token_slug="token-patricia-moore-csection",
            diagnosis="Failure to Progress in Labor, Term Singleton",
            doctor_user=doctor,
            procedure="Uncomplicated Low Transverse Cesarean Section",
            instructions="Keep incision dry. Showering permitted after 48 hrs. No heavy lifting beyond baby. Report fever > 38.0°C or heavy bleeding.",
            days_ago_admitted=3,
            days_ago_discharged=2,
            duration_days=14,
            follow_up_in_days=12,
            meds_list=[
                {"name": "Ibuprofen", "dosage": "600mg", "frequency": "q6h with meals", "purpose": "Pain & Inflammation"},
                {"name": "Acetaminophen", "dosage": "650mg", "frequency": "q6h alternating", "purpose": "Analgesia"},
                {"name": "Docusate Sodium", "dosage": "100mg", "frequency": "Twice daily", "purpose": "Stool Softener"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 1 post-discharge C-section: pain controlled with oral ibuprofen, newborn nursing well.",
                    "risk": "low"
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=4),
                    "pain": 3, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 2 check-in: incision intact, no bleeding, moving comfortably around home.",
                    "risk": "low"
                }
            ],
            appointment_data={
                "time": now + timedelta(days=12, hours=11),
                "type": "Postpartum 2-Week Incision & Neonatal Follow-up",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 5: David Miller - MISSED CHECKIN TODAY (CABG x3)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-48201",
            name="David Miller",
            phone="+1 (555) 678-9012",
            email="david.miller@example.com",
            dob="1958-07-22",
            gender="Male",
            emergency="Susan Miller (Daughter) +1 (555) 678-9013",
            token_slug="token-david-miller-missed",
            diagnosis="Triple Vessel CAD",
            doctor_user=doctor2,
            procedure="Coronary Artery Bypass Graft (CABG x3)",
            instructions="Strict sternal precautions. No lifting > 5 lbs. Daily morning weight and blood pressure log.",
            days_ago_admitted=8,
            days_ago_discharged=5,
            duration_days=21,
            follow_up_in_days=2,
            meds_list=[
                {"name": "Aspirin", "dosage": "81mg", "frequency": "Daily", "purpose": "Antiplatelet"},
                {"name": "Metoprolol Succinate", "dosage": "50mg", "frequency": "Daily", "purpose": "Rate Control"},
                {"name": "Atorvastatin", "dosage": "40mg", "frequency": "Daily bedtime", "purpose": "Lipid Lowering"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": f"Day {5-i} post CABG: sternum healing, vitals within target parameters.",
                    "risk": "low"
                } for i in range(4, 0, -1)
            ],
            alert_data={
                "risk_level": "medium",
                "summary": "David Miller has missed today's morning check-in (due at 09:00 AM). High-priority cardiovascular protocol.",
                "flags": ["Missed scheduled daily recovery check-in for CABG protocol"],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=2, hours=14),
                "type": "Cardiology Post-CABG Echocardiogram & Wound Check",
                "status": "scheduled"
            },
            note_text="Automated reminder sent via SMS at 11:00 AM. Nurse Sarah scheduled automated follow-up call."
        )

        # --------------------------------------------------------------------
        # PATIENT 6: Linda Taylor - Day 1 Post-Op Rotator Cuff Repair
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-39102",
            name="Linda Taylor",
            phone="+1 (555) 789-0123",
            email="linda.t@example.com",
            dob="1968-09-18",
            gender="Female",
            emergency="Tom Taylor (Spouse) +1 (555) 789-0124",
            token_slug="token-linda-taylor-day1",
            diagnosis="Full Thickness Supraspinatus Tear",
            doctor_user=doctor,
            procedure="Arthroscopic Rotator Cuff Repair",
            instructions="Maintain sling at all times including sleep. Pendulum exercises only. Ice 20m TDS.",
            days_ago_admitted=2,
            days_ago_discharged=1,
            duration_days=14,
            follow_up_in_days=6,
            meds_list=[
                {"name": "Acetaminophen / Hydrocodone", "dosage": "500/5mg", "frequency": "q4-6h prn", "purpose": "Acute Pain"},
                {"name": "Naproxen", "dosage": "500mg", "frequency": "Twice daily with meals", "purpose": "Anti-inflammatory"}
            ],
            checkins_data=[
                {
                    "date": today_str,
                    "time": now - timedelta(hours=1),
                    "pain": 5, "fever": False, "swelling": True, "swelling_details": "Mild swelling around deltoid portals",
                    "med_taken": True, "moving": True,
                    "summary": "Day 1 post-op: nerve block wearing off, managing pain with prescribed hydrocodone and cold therapy.",
                    "risk": "low"
                }
            ],
            appointment_data={
                "time": now + timedelta(days=6, hours=15),
                "type": "Shoulder Dressing Change & Passive ROM Check",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 7: William Anderson - Day 7 Spinal Fusion (Resolved Alert)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-21094",
            name="William Anderson",
            phone="+1 (555) 890-1234",
            email="w.anderson@example.org",
            dob="1965-02-11",
            gender="Male",
            emergency="Janet Anderson (Wife) +1 (555) 890-1235",
            token_slug="token-william-anderson-resolved",
            diagnosis="Spondylolisthesis with Lumbar Radiculopathy",
            doctor_user=doctor,
            procedure="Transforaminal Lumbar Interbody Fusion (TLIF L4-L5)",
            instructions="Wear lumbar brace when out of bed. No bending or twisting. Log walking distance daily.",
            days_ago_admitted=9,
            days_ago_discharged=7,
            duration_days=28,
            follow_up_in_days=7,
            meds_list=[
                {"name": "Gabapentin", "dosage": "300mg", "frequency": "TID", "purpose": "Radicular Pain"},
                {"name": "Robaxin", "dosage": "750mg", "frequency": "q8h prn spasms", "purpose": "Muscle Relaxant"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i),
                    "pain": 7 if i == 4 else max(2, 6 - i),
                    "fever": False, "swelling": False,
                    "med_taken": True, "moving": True,
                    "summary": f"Day {7-i}: Spinal incision healing. Pain trending down nicely to {max(2, 6-i)}/10.",
                    "risk": "high" if i == 4 else "low"
                } for i in range(6, -1, -1)
            ],
            alert_data={
                "risk_level": "high",
                "summary": "William Anderson reported localized lumbar spasm spike on Day 3. Resolved after clinical medication adjustment.",
                "flags": ["Spasm spike reported on post-op day 3"],
                "status": "resolved",
                "acknowledged_by": doctor.id,
                "acknowledged_at": now - timedelta(days=3),
                "action_taken": "call_patient",
                "notes": f"[{doctor.full_name} (doctor)]: Contacted patient. Adjusted Robaxin dosing schedule. Spasm resolved within 24h."
            },
            appointment_data={
                "time": now + timedelta(days=7, hours=10),
                "type": "Spine Post-Op 2-Week Standing X-Ray & Fusion Assessment",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 8: Dorothy Harris - DAY 0 Discharged Today
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-18239",
            name="Dorothy Harris",
            phone="+1 (555) 901-2345",
            email="dorothy.h@example.com",
            dob="1972-12-05",
            gender="Female",
            emergency="Sam Harris (Son) +1 (555) 901-2346",
            token_slug="token-dorothy-harris-day0",
            diagnosis="Right Inguinal Hernia",
            doctor_user=doctor,
            procedure="Open Right Inguinal Hernia Repair with Prolene Mesh",
            instructions="Ice groin area intermittently. Avoid strenuous lifting > 10 lbs for 3 weeks.",
            days_ago_admitted=1,
            days_ago_discharged=0,
            duration_days=10,
            follow_up_in_days=8,
            meds_list=[
                {"name": "Acetaminophen", "dosage": "650mg", "frequency": "q6h prn", "purpose": "Mild Pain"},
                {"name": "Ibuprofen", "dosage": "400mg", "frequency": "TID with food", "purpose": "Inflammation"}
            ],
            checkins_data=[],
            appointment_data={
                "time": now + timedelta(days=8, hours=11),
                "type": "Hernia Wound Assessment",
                "status": "scheduled"
            },
            note_text="Discharged home at 11:30 AM in stable condition. Patient confirmed reception of WhatsApp onboarding checkin link."
        )

        # --------------------------------------------------------------------
        # PATIENT 9: Michael Chang - HIGH RISK (Suspected DVT / Calf Redness)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-90214",
            name="Michael Chang",
            phone="+1 (555) 912-3456",
            email="m.chang@example.com",
            dob="1963-06-25",
            gender="Male",
            emergency="Grace Chang (Wife) +1 (555) 912-3457",
            token_slug="token-michael-chang-high-risk-dvt",
            diagnosis="End-stage Osteoarthritis, Left Knee",
            doctor_user=doctor,
            procedure="Left Total Knee Arthroplasty (TKA)",
            instructions="Elevate leg. Ice knee 20 mins every 2 hrs. Take prescribed blood thinner daily without fail.",
            days_ago_admitted=6,
            days_ago_discharged=4,
            duration_days=14,
            follow_up_in_days=3,
            meds_list=[
                {"name": "Rivaroxaban", "dosage": "10mg", "frequency": "Daily with food", "purpose": "DVT Prophylaxis"},
                {"name": "Acetaminophen", "dosage": "1000mg", "frequency": "TID", "purpose": "Pain Relief"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Post-op day 2 check-in normal. Ambulating with crutches.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 5, "fever": False, "swelling": True, "swelling_details": "Left calf feels fuller than right",
                    "med_taken": True, "moving": True,
                    "summary": "Mild calf fullness noted; instructed to monitor for redness or worsening cramp.",
                    "risk": "medium",
                    "flags": ["Asymmetric calf swelling noted"]
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=3),
                    "pain": 7, "fever": False, "swelling": True, "swelling_details": "Left lower leg very tight, warm and tender on dorsiflexion",
                    "med_taken": True, "moving": False,
                    "symptoms": "Calf feels hot and painful when walking",
                    "callback": True, "callback_reason": "Left calf is noticeably red, hot and swollen",
                    "summary": "CRITICAL FLAG: Patient reports unilateral calf swelling, warmth, tenderness on movement, and pain 7/10. High clinical suspicion for Deep Vein Thrombosis (DVT). Urgent ultrasound recommended.",
                    "risk": "high",
                    "flags": [
                        "Severe acute pain reported (7/10)",
                        "Localized swelling (Calf hot, tight, tender) with pain on dorsiflexion",
                        "High clinical risk factor: Unilateral DVT red flags",
                        "Patient requested urgent callback"
                    ]
                }
            ],
            alert_data={
                "risk_level": "high",
                "summary": "Michael Chang reports hot unilateral calf swelling, tenderness on dorsiflexion, and pain 7/10. Urgent Doppler ultrasound indicated.",
                "flags": [
                    "Unilateral calf swelling & redness",
                    "Positive Homan-type presentation (calf pain on walking)",
                    "Urgent DVT rule-out requested"
                ],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(hours=3),
                "type": "Urgent Lower Extremity Venous Duplex Ultrasound",
                "status": "scheduled",
                "notes": "Fast-tracked STAT imaging slot arranged by Dr. Chen."
            },
            note_text="High urgency alert created. Dr. Chen spoke with patient at 10:15 AM; arranged immediate outpatient vascular ultrasound."
        )

        # --------------------------------------------------------------------
        # PATIENT 10: Eleanor Brooks - LOW RISK (Hysterectomy Day 8)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-78192",
            name="Eleanor Brooks",
            phone="+1 (555) 012-3456",
            email="eleanor.b@example.com",
            dob="1970-10-15",
            gender="Female",
            emergency="Robert Brooks (Husband) +1 (555) 012-3457",
            token_slug="token-eleanor-brooks-stable",
            diagnosis="Symptomatic Uterine Leiomyoma",
            doctor_user=doctor,
            procedure="Total Laparoscopic Hysterectomy with Bilateral Salpingectomy",
            instructions="No lifting > 10 lbs. No pelvic intercourse for 6 weeks. Report sudden heavy vaginal bleeding.",
            days_ago_admitted=10,
            days_ago_discharged=8,
            duration_days=14,
            follow_up_in_days=6,
            meds_list=[
                {"name": "Acetaminophen", "dosage": "500mg", "frequency": "PRN", "purpose": "Mild Abdominal Cramping"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i),
                    "pain": max(1, 5 - i),
                    "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": f"Day {8-i} post-hysterectomy: incisions healing smoothly, pain minimal at {max(1, 5-i)}/10.",
                    "risk": "low"
                } for i in range(7, -1, -1)
            ],
            appointment_data={
                "time": now + timedelta(days=6, hours=14),
                "type": "Post-Op GYN Speculum & Vault Exam",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 11: Samuel O'Connor - MEDIUM RISK (ACL Reconstruction)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-67219",
            name="Samuel O'Connor",
            phone="+1 (555) 123-4567",
            email="sam.oconnor@example.org",
            dob="1998-05-19",
            gender="Male",
            emergency="Fiona O'Connor (Mother) +1 (555) 123-4568",
            token_slug="token-sam-oconnor-acl-medium",
            diagnosis="Complete Left Anterior Cruciate Ligament Rupture",
            doctor_user=doctor,
            procedure="Left ACL Reconstruction with Quad Tendon Autograft",
            instructions="Hinged knee brace locked in extension for ambulation. Cryo-cuff therapy 30 mins QID.",
            days_ago_admitted=7,
            days_ago_discharged=5,
            duration_days=21,
            follow_up_in_days=5,
            meds_list=[
                {"name": "Meloxicam", "dosage": "15mg", "frequency": "Daily with food", "purpose": "Anti-inflammatory"},
                {"name": "Acetaminophen / Codeine", "dosage": "300/30mg", "frequency": "q4-6h prn", "purpose": "Post-Op Pain"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=4)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=4),
                    "pain": 4, "fever": False, "swelling": True, "swelling_details": "Normal post-op effusion",
                    "med_taken": True, "moving": True,
                    "summary": "Day 1 post-ACL reconstruction: quad sets and ankle pumps initiated.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=3)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=3),
                    "pain": 4, "fever": False, "swelling": True,
                    "med_taken": True, "moving": True,
                    "summary": "Day 2: stable, using crutches, cryotherapy compliant.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 5, "fever": False, "swelling": True,
                    "med_taken": True, "moving": True,
                    "summary": "Day 3: minor increase in knee joint fullness after home PT exercises.",
                    "risk": "low"
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=2),
                    "pain": 6, "fever": False, "swelling": True, "swelling_details": "Moderate suprapatellar effusion, flexion limited to 45 deg",
                    "med_taken": True, "moving": False,
                    "callback": True, "callback_reason": "Knee feels blocked when trying to bend, need advice on brace settings",
                    "summary": "MODERATE ALERT: Patient reports rising joint stiffness, pain 6/10, limited knee range of motion, and requests physical therapy coordination callback.",
                    "risk": "medium",
                    "flags": [
                        "Pain elevation (6/10)",
                        "Restricted joint mobility (Flexion limited to 45 deg)",
                        "Callback requested regarding rehabilitation progression"
                    ]
                }
            ],
            alert_data={
                "risk_level": "medium",
                "summary": "Samuel O'Connor reports suprapatellar effusion and restricted flexion after PT. Nurse callback requested.",
                "flags": ["Restricted knee flexion", "Suprapatellar effusion spike"],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=5, hours=15),
                "type": "Sports Medicine Follow-up & PT Progression",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 12: Fatima Al-Mansoor - LOW RISK (Thyroidectomy Day 5)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-56128",
            name="Fatima Al-Mansoor",
            phone="+1 (555) 234-8901",
            email="fatima.m@example.com",
            dob="1984-09-04",
            gender="Female",
            emergency="Zaid Al-Mansoor (Brother) +1 (555) 234-8902",
            token_slug="token-fatima-almansoor-thyroid",
            diagnosis="Multinodular Goiter with Compressive Symptoms",
            doctor_user=doctor,
            procedure="Total Thyroidectomy with Recurrent Laryngeal Nerve Monitoring",
            instructions="Report numbness or tingling in fingers or lips (hypocalcemia sign). Keep neck incision dry.",
            days_ago_admitted=7,
            days_ago_discharged=5,
            duration_days=14,
            follow_up_in_days=5,
            meds_list=[
                {"name": "Levothyroxine", "dosage": "112mcg", "frequency": "Daily 30 min before breakfast", "purpose": "Hormone Replacement"},
                {"name": "Calcium Carbonate with Vitamin D", "dosage": "500mg/400IU", "frequency": "TID", "purpose": "Calcium Maintenance"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i),
                    "pain": max(1, 4 - i),
                    "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": f"Day {5-i} thyroid recovery: swallowing comfortably, voice crisp and loud, no perioral tingling.",
                    "risk": "low"
                } for i in range(4, -1, -1)
            ],
            appointment_data={
                "time": now + timedelta(days=5, hours=10),
                "type": "Endocrine Surgery Follow-up & Serum Calcium Check",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 13: Thomas Sterling - MEDIUM RISK (Sleeve Gastrectomy)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-45190",
            name="Thomas Sterling",
            phone="+1 (555) 345-0123",
            email="thomas.sterling@example.org",
            dob="1980-01-28",
            gender="Male",
            emergency="Karen Sterling (Wife) +1 (555) 345-0124",
            token_slug="token-thomas-sterling-bariatric",
            diagnosis="Class III Severe Obesity (BMI 42)",
            doctor_user=doctor,
            procedure="Laparoscopic Sleeve Gastrectomy",
            instructions="Stage 1 clear liquids: sip 60-120ml per hour. No carbonated beverages. Report intractable nausea.",
            days_ago_admitted=5,
            days_ago_discharged=3,
            duration_days=14,
            follow_up_in_days=4,
            meds_list=[
                {"name": "Pantoprazole", "dosage": "40mg", "frequency": "Daily morning dissolvable", "purpose": "Acid Reduction"},
                {"name": "Ondansetron ODT", "dosage": "4mg", "frequency": "q8h prn nausea", "purpose": "Antiemetic"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 1 post-bariatric surgery: managing liquid intake, 800ml tolerated.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 4, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 2: mild nausea after sipping protein shake.",
                    "risk": "low"
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=3),
                    "pain": 5, "fever": False, "swelling": False, "med_taken": False,
                    "missed_reason": "Vomited morning medication",
                    "eating": False, "moving": True,
                    "symptoms": "Having trouble keeping liquids down, feeling lightheaded",
                    "callback": True, "callback_reason": "Unable to tolerate clear liquids since 7 AM",
                    "summary": "DEHYDRATION RISK: Patient unable to maintain hydration protocol, vomited morning PPI, feeling lightheaded. Clinical review required.",
                    "risk": "medium",
                    "flags": [
                        "Missed medication due to emesis",
                        "Inability to tolerate oral hydration",
                        "Post-bariatric dehydration symptom warning"
                    ]
                }
            ],
            alert_data={
                "risk_level": "medium",
                "summary": "Thomas Sterling reports persistent nausea, vomited medication, and inability to meet 1.5L fluid target.",
                "flags": ["Post-op nausea", "Liquid intolerance", "Dehydration risk"],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=4, hours=14),
                "type": "Bariatric Nutritionist & Post-Op Evaluation",
                "status": "scheduled"
            }
        )

        # --------------------------------------------------------------------
        # PATIENT 14: Brenda Washington - HIGH RISK (Carotid Endarterectomy)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-83921",
            name="Brenda Washington",
            phone="+1 (555) 456-1234",
            email="brenda.w@example.com",
            dob="1955-04-17",
            gender="Female",
            emergency="Marcus Washington (Son) +1 (555) 456-1235",
            token_slug="token-brenda-washington-carotid",
            diagnosis="85% Symptomatic Right Internal Carotid Stenosis",
            doctor_user=doctor2,
            procedure="Right Carotid Endarterectomy with Dacron Patch",
            instructions="Strict blood pressure monitoring. Maintain BP < 140/90. Report any facial droop, arm weakness, or speech change STAT.",
            days_ago_admitted=6,
            days_ago_discharged=4,
            duration_days=21,
            follow_up_in_days=3,
            meds_list=[
                {"name": "Clopidogrel", "dosage": "75mg", "frequency": "Daily", "purpose": "Antiplatelet"},
                {"name": "Amlodipine", "dosage": "5mg", "frequency": "Daily", "purpose": "BP Control"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=3)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=3),
                    "pain": 3, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 1 post-carotid endarterectomy: BP stable 128/82, cranial nerves intact.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=2),
                    "pain": 3, "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": "Day 2: neck incision clean, neurological examination normal.",
                    "risk": "low"
                },
                {
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=1),
                    "pain": 4, "fever": False, "swelling": True, "swelling_details": "Mild neck fullness along sternocleidomastoid",
                    "med_taken": True, "moving": True,
                    "summary": "Day 3: BP 136/86, mild neck fullness without airway compromise.",
                    "risk": "low"
                },
                {
                    "date": today_str,
                    "time": now - timedelta(hours=1),
                    "pain": 4, "fever": False, "swelling": True, "swelling_details": "Right neck incision tender",
                    "med_taken": True, "moving": False,
                    "symptoms": "Brief 5-minute tingling in left hand fingertips this morning, BP measured 158/94",
                    "callback": True, "callback_reason": "Tingling in left fingers and high BP reading",
                    "summary": "HIGH PRIORITY NEUROLOGICAL RED FLAG: Patient reports transient tingling in left upper extremity (contralateral to surgical right carotid) and elevated blood pressure 158/94. Immediate vascular neurology evaluation required.",
                    "risk": "high",
                    "flags": [
                        "Contralateral neurological symptom (transient left hand tingling)",
                        "Elevated blood pressure 158/94 above surgical target parameter (<140)",
                        "Potential TIA / microembolism risk post carotid reconstruction"
                    ]
                }
            ],
            alert_data={
                "risk_level": "high",
                "summary": "Brenda Washington reports transient left hand paresthesia and BP 158/94. Immediate clinical consultation required.",
                "flags": [
                    "Transient ischemic symptom alert",
                    "Systolic BP > 150 mmHg",
                    "Post-carotid protocol escalation"
                ],
                "status": "pending"
            },
            appointment_data={
                "time": now + timedelta(days=1, hours=9),
                "type": "Urgent Vascular Surgical Re-evaluation & Duplex",
                "status": "scheduled"
            },
            note_text="Urgent red flag logged. Dr. Patel notified at 11:45 AM. Patient instructed to monitor for speech difficulty and proceed to ED if symptoms recur."
        )

        # --------------------------------------------------------------------
        # PATIENT 15: Carlos Rivera - LOW RISK (Ventral Hernia Mesh Day 11)
        # --------------------------------------------------------------------
        create_patient_record(
            mrn="MRN-32910",
            name="Carlos Rivera",
            phone="+1 (555) 567-2345",
            email="carlos.rivera@example.com",
            dob="1978-08-12",
            gender="Male",
            emergency="Maria Rivera (Wife) +1 (555) 567-2346",
            token_slug="token-carlos-rivera-finishing",
            diagnosis="Recurrent Incisional Ventral Hernia",
            doctor_user=doctor,
            procedure="Open Ventral Hernia Mesh Repair with Component Separation",
            instructions="Wear abdominal binder for ambulation. Refrain from heavy lifting > 20 lbs until cleared.",
            days_ago_admitted=13,
            days_ago_discharged=11,
            duration_days=14,
            follow_up_in_days=3,
            meds_list=[
                {"name": "Acetaminophen", "dosage": "500mg", "frequency": "PRN", "purpose": "Mild Pain Control"}
            ],
            checkins_data=[
                {
                    "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "time": now - timedelta(days=i),
                    "pain": max(1, 6 - i),
                    "fever": False, "swelling": False, "med_taken": True, "moving": True,
                    "summary": f"Day {11-i} ventral hernia recovery: binder comfortable, wound dry, pain {max(1, 6-i)}/10.",
                    "risk": "low"
                } for i in range(10, -1, -1)
            ],
            appointment_data={
                "time": now + timedelta(days=3, hours=11),
                "type": "Final Recovery Clearance & Abdominal Wall Exam",
                "status": "scheduled"
            }
        )

        # System audit logs
        db.add(AuditLog(
            user_id=admin.id,
            action="SYSTEM_INIT",
            resource_type="hospital",
            resource_id=hospital.id,
            details="Hospital database seeded with 15 clinical patient trajectories across orthopedics, cardiology, obstetrics, spine, general surgery, and bariatrics.",
            ip_address="127.0.0.1",
            created_at=now
        ))

        db.commit()
        print("Database successfully seeded with 15 patients, care-plan templates, check-ins, alerts, and notifications!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
