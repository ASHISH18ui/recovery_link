# AfterCare: Post-Discharge Patient Recovery Monitoring Platform

> **Clinical Principle**: *THE AI SUMMARISES AND FLAGS; THE CLINICIAN DECIDES.*  
> The AI must never diagnose, prescribe, or give medical advice to patients.

> **Illustrative Workflow Notice**: *Illustrative workflow; clinical instructions must be customised and approved by the hospital.*  
> **Mandatory AI Disclaimer**: *AI-generated summary. Clinician review required.*

---

## 🏥 Product Overview
**AfterCare** is an intelligent, hospital-grade post-discharge patient recovery monitoring web platform. It bridges the critical 14-day gap between hospital discharge and first outpatient follow-up.

### The 6-Step Clinical Recovery Journey
1. **Patient Discharged**: Staff input surgical procedure, discharge instructions, medication schedule, and follow-up appointment date.
2. **Patient Onboarding**: A unique, non-guessable, expiring tokenized link is generated and sent via simulated WhatsApp/SMS with zero password friction.
3. **Daily Check-Ins**: The patient opens the mobile-first web portal to report daily pain levels (0–10), fever/temperature, surgical site swelling, daily function (eating, sleeping, moving), medication adherence, and callback requests.
4. **AI Analysis & Guardrailed Flagging**: The AI summarization service extracts clinical flags, evaluates trends (e.g., pain rising 2+ points, fever, missed meds), and produces a structured summary with strict disclaimers.
5. **Care Team Clinical Triage**: Surgeons and nurses review flagged patients in an alerts queue, triage urgency, and record immediate interventions (`Call Patient`, `Schedule Clinic Visit`, `Escalate to Doctor`, `No Action Needed`).
6. **Follow-up & Reminders**: Automated reminders for medications, daily check-ins, upcoming clinic visits, and unacknowledged staff escalations are recorded in the notification dispatch log.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS (Mobile-first patient portal, desktop-first staff dashboard)
- **Backend**: Python 3.13 / 3.11 + FastAPI + Uvicorn
- **Database**: PostgreSQL / SQLite (via SQLAlchemy 2.0 ORM + Alembic migrations)
- **AI Service**: LLM API with structured JSON output (Gemini API / OpenAI interface) + robust deterministic rule-based clinical fallback
- **Authentication**: JWT token authentication for staff (roles: `admin`, `doctor`, `nurse`); secure tokenized URL access for patients (no passwords)
- **Reminders & Notifications**: Abstract notification service with simulated WhatsApp Business / SMS / in-app provider
- **Containerization**: Docker Compose

---

## 📂 Project Structure
```
webapp/
├── backend/
│   ├── alembic/                # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── api/                # Modular REST API endpoints
│   │   │   ├── auth.py         # Staff login & user directory
│   │   │   ├── discharges.py   # Module 1: Patient discharge & token generation
│   │   │   ├── checkins.py     # Module 2 & 4: Patient portal & AI check-in submission
│   │   │   ├── dashboard.py    # Module 3: Hospital surveillance stats & alert lists
│   │   │   ├── alerts.py       # Module 3: Clinician acknowledgment & action triage
│   │   │   ├── notifications.py# Module 5: Simulated notification logs & triggers
│   │   │   └── audit.py        # HIPAA & regulatory audit trail
│   │   ├── core/               # Configuration, security & dependencies
│   │   ├── models/             # SQLAlchemy ORM models (12+ tables)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # AI summary service & notification provider
│   │   ├── db.py               # Database engine & session
│   │   └── main.py             # FastAPI entry point & CORS
│   ├── tests/                  # Pytest unit & integration test suite
│   │   ├── test_rules_and_auth.py
│   │   ├── test_api_endpoints.py
│   │   └── verify_e2e_flow.py  # Full end-to-end verification script
│   ├── seed.py                 # Seed script for hospital, staff, and 8 knee patients
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (staff)/
│   │   │   ├── dashboard/      # Module 3: Monitoring dashboard & alerts queue
│   │   │   ├── patients/       # Patient directory & detailed timeline/chart
│   │   │   ├── discharges/new/ # Module 1: New discharge form & simulated SMS
│   │   │   ├── alerts/         # Dedicated clinical intervention queue
│   │   │   ├── notifications/  # Module 5: Simulated dispatch logs
│   │   │   ├── audit/          # Compliance audit trail
│   │   │   ├── login/          # Staff login with quick demo switchers
│   │   │   └── recovery/[token]# Module 2: Mobile-first patient recovery portal
│   │   ├── components/         # StaffNavbar, AIDisclaimer, UI widgets
│   │   └── lib/                # API client & auth storage
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Option A: Running with Docker Compose
```bash
# 1. Clone or navigate to the repository
cd webapp

# 2. Build and start services
docker-compose up --build
```
- Staff Dashboard: **http://localhost:3000**
- API Documentation (Swagger): **http://localhost:8000/docs**
- Health check: **http://localhost:8000/health**

---

### Option B: Running Locally (Development Mode)

#### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtualenv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run seed data script (creates SQLite DB & seeds 8 knee replacement patients)
python seed.py

# Start backend server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup (Next.js)
```bash
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🔑 Demo Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Lead Surgeon (Doctor)** | Dr. Arthur Chen, MD | `dr.chen@aftercare.com` | `doctor123` |
| **Ward Nurse** | Sarah Jenkins, RN | `nurse.sarah@aftercare.com` | `nurse123` |
| **Care Coordinator (Nurse)** | Elena Rostova, RN | `nurse.elena@aftercare.com` | `nurse123` |
| **Hospital Administrator** | Sandra Bell | `admin@aftercare.com` | `admin123` |

> *Tip: The login page includes 1-click Quick Demo Account buttons for instant testing.*

---

## 🎯 Step-by-Step Demo Walkthrough

### 1. Review the Live Monitoring Dashboard
1. Log in as **Dr. Arthur Chen** (`dr.chen@aftercare.com` / `doctor123`).
2. The Dashboard displays 5 primary clinical indicators:
   - **Total Monitored**: 8 Patients
   - **Checked-In Today**: 6 Patients
   - **Missed Today**: 2 Patients (e.g., David Miller)
   - **Clinical Review (Flagged)**: 2 Patients (Robert Vance, Margaret Davis)
   - **Upcoming Appointments**: Scheduled follow-up clinic visits
3. Notice **Robert Vance (High Risk)**:
   - Flagged due to fever 38.4°C, severe pain spike 8/10, tense swelling, and missed morning medication.
4. Click **"Review & Take Action"** on Robert's alert:
   - Select action: `Call Patient Now`
   - Enter notes: *"Called Robert. Advised leg elevation, ice application, and taking anti-emetic. Arranged urgent morning surgical clinic review."*
   - Click **Confirm Action**. Notice the alert moves from Pending to Acknowledged.

### 2. Discharge a New Patient (Module 1)
1. In the top navigation, click **"New Discharge"** (or `/discharges/new`).
2. Fill out patient details:
   - Name: `Eleanor Rigby`
   - Phone: `+1 (555) 777-9911`
   - Procedure: `Right Total Knee Arthroplasty (TKA)`
   - Treating Doctor: `Dr. Arthur Chen`
   - Discharge Instructions: Pre-filled with standard TKA guidelines
   - Medications: Pre-filled with Enoxaparin, Paracetamol, Oxycodone
3. Click **"Complete Discharge & Send Patient Link"**.
4. A **Simulated WhatsApp/SMS Delivery** modal pops up with:
   - The exact message sent to the patient.
   - The unique, non-guessable, tokenized URL.
   - A button: **"Open Patient Recovery Portal Now (Demo)"**.

### 3. Patient Recovery Check-In (Module 2, Mobile Web)
1. Click the button or open the tokenized link (e.g., `http://localhost:3000/recovery/<token>`).
2. Experience the accessible, mobile-first patient interface:
   - Select pain level: `8 / 10` (Turns rose/red).
   - Fever question: Tap `Yes, Feeling Feverish` → enter `38.3`°C.
   - Swelling question: Tap `Noticeable Swelling` → enter details.
   - Daily Milestones: Toggle Eating, Sleeping, Moving.
   - Prescribed Medications: Confirms or reports missed dose.
   - Request Callback: Check the box → enter concern.
3. Click **"Submit Today's Recovery Check-In"**.
4. The patient immediately receives confirmation and an objective AI summary with the mandatory disclaimer:
   *"AI-generated summary. Clinician review required."*

### 4. Verify Immediate Dashboard Alert & Audit Trail
1. Switch back to the staff browser tab and open the **Dashboard** or **Alerts Queue**.
2. Notice Eleanor Rigby immediately appears as **HIGH RISK** with all 8 clinical flags detected.
3. Check the **Notification Log** (`/notifications`): see the simulated WhatsApp onboarding message, appointment reminder, and staff escalation alert.
4. Check the **Audit Trail** (`/audit`): see immutable records for `CREATE_DISCHARGE`, `SUBMIT_CHECKIN`, and `ACKNOWLEDGE_ALERT` with user names and IP addresses.

---

## 🧪 Running Automated Tests
The repository includes unit and end-to-end integration tests:
```bash
# Run pytest test suite (flagging rules + auth + API endpoints)
pytest backend/tests

# Run end-to-end verification script against the live server
python backend/tests/verify_e2e_flow.py
```

---

## 🔒 Security & Privacy Features
- **Zero-Password Patient Access**: Expiring, cryptographically non-guessable URL-safe tokens (32 bytes / 256-bit entropy).
- **Role-Based Access Control (RBAC)**: Enforced via HTTPBearer and FastAPI dependency injection (`admin`, `doctor`, `nurse`).
- **Comprehensive Audit Trail**: Every sensitive clinician action (viewing patient details, acknowledging alerts, creating care plans) is timestamped and recorded in `audit_logs`.
- **Environment Isolation**: No hard-coded secrets; passwords hashed with Bcrypt (12 rounds).
- **Clinical AI Guardrails**: Strict directives prevent the AI from diagnosing, prescribing, or giving direct medical advice.

